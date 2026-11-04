import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import type { OfficeEvent } from '../shared/types'
import { OfficeEngine } from '../server/office/engine'
import { Roster, inferRole } from '../server/office/roster'
import type { RawAgent, RawTask, Source } from '../server/sources/types'

// Fonte falsa controlada pelo teste: o motor só vê o que a "fonte" devolve.
class FakeSource implements Source {
  name = 'ruflo' as const
  capabilities = { order: true, cancel: true, retry: true, approve: true, intervene: true }
  agents: RawAgent[] = []
  tasks: RawTask[] = []
  down = false
  async start() {}
  async stop() {}
  async read() {
    if (this.down) throw new Error('connect ECONNREFUSED token=abc123secretvalue')
    return { agents: structuredClone(this.agents), tasks: structuredClone(this.tasks) }
  }
  async orderCeo() { return 'x' }
  async cancel() {}
  async retry() {}
  async approve() {}
  async intervene() {}
}

function task(p: Partial<RawTask> & { id: string }): RawTask {
  return {
    title: p.id, type: 'task', status: 'queued', rawStatus: 'pending', progress: null, assignees: [], parentId: null,
    fromAgentId: null, kind: 'task', createdAt: '2026-10-24T10:00:00.000Z', startedAt: null, completedAt: null,
    result: null, error: null, reason: null, ...p,
  }
}

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'office-test-'))
  let now = Date.parse('2026-10-24T12:00:00.000Z')
  const src = new FakeSource()
  const engine = new OfficeEngine([src], new Roster(dir), { pollMs: 1e9, eventBuffer: 500, now: () => now })
  const events: OfficeEvent[] = []
  engine.subscribe({ onEvent: (e) => events.push(e), onPatch: () => {} })
  return { src, engine, events, advance: (ms: number) => (now += ms), agent: (id: string) => engine.snapshot().agents.find((a) => a.id === id)! }
}

const CEO: RawAgent = { id: 'a-ceo', name: 'CEO', type: 'ceo', status: 'idle' }
const GM: RawAgent = { id: 'a-gm', name: 'Gerente-geral', type: 'gerente-geral', status: 'idle' }
const SDR: RawAgent = { id: 'a-sdr', name: 'SDR', type: 'sdr', status: 'idle' }

test('agente sem tarefa fica ocioso, mesmo se a fonte disser "busy"', async () => {
  const { src, engine, agent } = setup()
  src.agents = [{ ...SDR, status: 'busy' }]
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'idle')
  assert.match(agent('a-sdr').evidence, /não exibido como trabalhando/)
})

test('estado visual segue o estado real da tarefa', async () => {
  const { src, engine, agent, advance } = setup()
  src.agents = [SDR]
  src.tasks = [task({ id: 't1', title: 'Pesquisar construtoras em Goiânia', assignees: ['a-sdr'] })]
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'queued')

  src.tasks[0] = { ...src.tasks[0], status: 'running', rawStatus: 'in_progress', progress: 40 }
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'researching')
  assert.equal(agent('a-sdr').progress, 40)

  src.tasks[0] = { ...src.tasks[0], status: 'done', rawStatus: 'completed', completedAt: new Date(Date.parse('2026-10-24T12:00:00.000Z')).toISOString(), result: { ok: 1 } }
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'done')
  advance(9_000)
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'idle')
})

test('bloqueio, aprovação e erro aparecem com motivo', async () => {
  const { src, engine, agent, events } = setup()
  src.agents = [SDR, GM, CEO]
  await engine.poll()
  src.tasks = [
    task({ id: 'b', assignees: ['a-sdr'], status: 'blocked', rawStatus: 'in_progress', reason: 'Falta CNPJ do cliente' }),
    task({ id: 'p', assignees: ['a-gm'], status: 'awaiting_approval', rawStatus: 'in_progress', reason: 'Desconto acima de 10%' }),
    task({ id: 'f', assignees: ['a-ceo'], status: 'failed', rawStatus: 'failed', error: 'timeout', completedAt: '2026-10-24T11:59:00.000Z' }),
  ]
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'blocked')
  assert.equal(agent('a-gm').state, 'awaiting_approval')
  assert.equal(agent('a-ceo').state, 'error')
  assert.equal(agent('a-ceo').lastError, 'timeout')
  const types = events.map((e) => e.type)
  for (const t of ['task.blocked', 'task.awaiting_approval', 'task.failed']) assert.ok(types.includes(t as never), t)
  assert.equal(engine.metrics().tasksBlocked, 1)
  assert.ok(engine.metrics().alerts >= 3)
})

test('delegação CEO → gerente → especialista gera eventos e estado "delegando"', async () => {
  const { src, engine, agent, events } = setup()
  src.agents = [CEO, GM, SDR]
  await engine.poll()
  src.tasks = [task({ id: 'root', title: 'Ordem do proprietário', assignees: ['a-ceo'], status: 'running', rawStatus: 'in_progress' })]
  await engine.poll()
  src.tasks.push(task({ id: 'c1', parentId: 'root', fromAgentId: 'a-ceo', assignees: ['a-gm'] }))
  await engine.poll()
  assert.equal(agent('a-ceo').state, 'delegating')
  assert.deepEqual(agent('a-ceo').delegation?.to, ['ruflo:a-gm'])
  src.tasks.push(task({ id: 'c2', parentId: 'c1', assignees: ['a-sdr'] })) // sem tag from: deduz pela tarefa-mãe
  await engine.poll()
  const del = events.filter((e) => e.type === 'task.delegated')
  assert.equal(del.length, 2)
  assert.equal(del[0].fromAgentKey, 'ruflo:a-ceo')
  assert.equal(del[1].fromAgentKey, 'ruflo:a-gm')
  assert.equal(engine.task('ruflo:c2')?.parentKey, 'ruflo:c1')
})

test('criar, renomear e remover agente; mesa persiste pelo id real', async () => {
  const { src, engine, agent, events } = setup()
  src.agents = [SDR]
  await engine.poll()
  const desk = agent('a-sdr').deskId
  src.agents = [{ ...SDR, name: 'SDR Goiânia' }, GM]
  await engine.poll()
  assert.equal(agent('a-sdr').deskId, desk)
  assert.equal(agent('a-sdr').name, 'SDR Goiânia')
  src.agents = [GM]
  await engine.poll()
  assert.equal(engine.snapshot().agents.some((a) => a.id === 'a-sdr'), false)
  const types = events.map((e) => e.type)
  assert.ok(types.includes('agent.started') && types.includes('agent.renamed') && types.includes('agent.removed'))
})

test('fonte fora do ar: agentes ficam desconectados e o erro é redigido', async () => {
  const { src, engine, agent, events } = setup()
  src.agents = [SDR]
  src.tasks = [task({ id: 't', assignees: ['a-sdr'], status: 'running', rawStatus: 'in_progress' })]
  await engine.poll()
  src.down = true
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'offline')
  const down = events.find((e) => e.type === 'source.down')!
  assert.doesNotMatch(down.summary, /abc123secretvalue/)
  src.down = false
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'working')
  assert.ok(events.some((e) => e.type === 'agent.reconnected'))
})

test('replay de eventos para reconexão (Last-Event-ID)', async () => {
  const { src, engine } = setup()
  src.agents = [SDR]
  await engine.poll()
  const seq = engine.snapshot().seq
  src.tasks = [task({ id: 'n', assignees: ['a-sdr'] })]
  await engine.poll()
  const missed = engine.eventsSince(seq)!
  assert.ok(missed.length > 0 && missed.every((e) => e.seq > seq))
  assert.deepEqual(engine.eventsSince(engine.snapshot().seq), [])
})

test('inferência de papel para a hierarquia', () => {
  const r = (name: string, type = '') => inferRole({ id: 'x', name, type, status: 'idle' })
  assert.equal(r('CEO executivo de IA').role, 'ceo')
  assert.equal(r('Gerente-geral de operações').role, 'manager')
  assert.equal(r('Diretor financeiro').department, 'finance')
  assert.equal(r('Especialista em SEO local').department, 'seo')
  assert.equal(r('Planejador de manutenção preventiva').department, 'operations')
  assert.equal(r('qualquer', 'coder').department, 'technology')
})

test('atividade segue o tipo da tarefa antes do título', async () => {
  const { src, engine, agent } = setup()
  src.agents = [SDR]
  src.tasks = [task({ id: 'm', type: 'analysis', title: 'Analisar margem de contratos de manutenção', assignees: ['a-sdr'], status: 'running', rawStatus: 'in_progress' })]
  await engine.poll()
  assert.equal(agent('a-sdr').state, 'analyzing')
})
