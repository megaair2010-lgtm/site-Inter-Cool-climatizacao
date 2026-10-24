/**
 * Teste ponta a ponta contra um Ruflo REAL (servidor MCP oficial `ruflo mcp start`).
 *
 * O que é real: o Ruflo, seus registros de agentes e tarefas, o servidor do escritório,
 * a API, o SSE e o navegador. O que este script faz no lugar de um LLM: ele age como o
 * "runtime" dos agentes, chamando as MESMAS ferramentas MCP que um agente chamaria
 * (task_create com tags parent/from, task_update, task_complete). Nenhum texto é gerado
 * por IA aqui; o objetivo é provar que o escritório reflete fielmente o que o Ruflo registra.
 *
 * Uso: npm run build && RUFLO_BIN=/caminho/ruflo.js npm run e2e:ruflo
 * Evidências: E2E_OUT (padrão ./evidence) — resultados.json + capturas de tela.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { OfficeAgent, OfficeEvent, OfficeSnapshot } from '../shared/types'

const ROOT = path.resolve(import.meta.dirname, '..')
const RUFLO_BIN = process.env.RUFLO_BIN || require_resolve_ruflo()
const OUT = path.resolve(process.env.E2E_OUT || path.join(ROOT, 'evidence'))
const PORT = Number(process.env.E2E_PORT || 4397)
const BASE = `http://127.0.0.1:${PORT}`
const ADMIN = 'e2e-admin-' + 'a'.repeat(24)
const VIEWER = 'e2e-viewer-' + 'b'.repeat(24)
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'ruflo-e2e-'))
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'office-e2e-data-'))

function require_resolve_ruflo(): string {
  for (const p of [path.join(ROOT, 'node_modules/ruflo/bin/ruflo.js'), '/tmp/claude-0/ruflo/node_modules/ruflo/bin/ruflo.js']) if (fs.existsSync(p)) return p
  throw new Error('Defina RUFLO_BIN com o caminho de ruflo/bin/ruflo.js')
}

const results: { criterio: string; ok: boolean; evidencia: string }[] = []
function check(criterio: string, ok: boolean, evidencia: string) {
  results.push({ criterio, ok, evidencia })
  console.log(`${ok ? 'PASSOU' : 'FALHOU'}  ${criterio}\n        ${evidencia}`)
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------ runtime dos agentes (MCP) -- */
const runtime = new Client({ name: 'e2e-agent-runtime', version: '0' })
async function mcp<T = any>(name: string, args: Record<string, unknown>): Promise<T> {
  const r = (await runtime.callTool({ name, arguments: args })) as { content: { text: string }[] }
  const out = JSON.parse(r.content[0].text)
  if (out.success === false) throw new Error(`${name}: ${JSON.stringify(out)}`)
  return out
}

/* ----------------------------------------------------- cliente do escritório -- */
async function api<T = any>(p: string, init: RequestInit & { token?: string } = {}): Promise<{ status: number; body: T }> {
  const r = await fetch(BASE + p, { ...init, headers: { 'Content-Type': 'application/json', ...(init.token !== '' ? { Authorization: `Bearer ${init.token ?? ADMIN}` } : {}) } })
  const text = await r.text()
  let body: any = text
  try { body = JSON.parse(text) } catch {}
  return { status: r.status, body }
}
const state = async () => (await api<OfficeSnapshot>('/api/office/state')).body
const byName = (s: OfficeSnapshot, n: string) => s.agents.find((a) => a.name === n)!
async function waitFor<T>(label: string, fn: () => Promise<T | undefined | null | false>, ms = 15_000): Promise<T> {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const v = await fn().catch(() => null)
    if (v) return v
    await sleep(250)
  }
  throw new Error(`Tempo esgotado esperando: ${label}`)
}

/** Assinante SSE simples que guarda eventos e o último id recebido. */
class Sse {
  events: OfficeEvent[] = []
  snapshots = 0
  lastId = 0
  private ctrl = new AbortController()
  constructor(private since?: number) {}
  async open() {
    const q = new URLSearchParams({ token: VIEWER, ...(this.since ? { since: String(this.since) } : {}) })
    const r = await fetch(`${BASE}/api/office/events?${q}`, { signal: this.ctrl.signal })
    if (r.status !== 200) throw new Error('SSE ' + r.status)
    void (async () => {
      const dec = new TextDecoder()
      let buf = ''
      try {
        for await (const chunk of r.body as unknown as AsyncIterable<Uint8Array>) {
          buf += dec.decode(chunk, { stream: true })
          let i
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i)
            buf = buf.slice(i + 2)
            const ev = /^event: (.+)$/m.exec(block)?.[1]
            const id = /^id: (\d+)$/m.exec(block)?.[1]
            const data = /^data: (.+)$/m.exec(block)?.[1]
            if (id) this.lastId = Math.max(this.lastId, Number(id))
            if (ev === 'snapshot') this.snapshots++
            if ((ev === 'office-event' || ev === 'replay') && data) this.events.push(JSON.parse(data))
          }
        }
      } catch {}
    })()
  }
  close() { this.ctrl.abort() }
  has(type: string, pred: (e: OfficeEvent) => boolean = () => true) { return this.events.some((e) => e.type === type && pred(e)) }
}

/* ------------------------------------------------------------------- roteiro -- */
let server: ChildProcess | null = null
async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  console.log(`Ruflo: ${RUFLO_BIN}\nProjeto Ruflo isolado: ${WORK}\n`)
  await runtime.connect(new StdioClientTransport({ command: process.execPath, args: [RUFLO_BIN, 'mcp', 'start'], cwd: WORK, stderr: 'ignore' }))

  // Hierarquia real registrada no Ruflo (agent_spawn). Os ids são os do Ruflo.
  const roster = [
    ['ceo', 'Helena', 'coordinator', 'executive'],
    ['gm', 'Rafael', 'coordinator', 'operations'],
    ['dir-comercial', 'Diretor comercial', 'coordinator', 'sales'],
    ['sdr', 'SDR de construtoras', 'researcher', 'sales'],
    ['propostas', 'Preparador de propostas', 'coder', 'sales'],
    ['dir-mkt', 'Diretor de marketing', 'coordinator', 'marketing'],
    ['seo', 'Especialista em SEO local', 'researcher', 'marketing'],
    ['dir-fin', 'Diretor financeiro', 'coordinator', 'finance'],
    ['margens', 'Analista de margens', 'analyst', 'finance'],
  ] as const
  const id: Record<string, string> = {}
  for (const [k, name, type, domain] of roster) {
    const r = await mcp('agent_spawn', { agentType: type, agentId: `ic-${k}`, name: k === 'ceo' ? 'Helena — CEO executivo de IA' : k === 'gm' ? 'Rafael — Gerente-geral de operações' : name, domain })
    id[k] = r.agentId
  }

  server = spawn(process.execPath, [path.join(ROOT, 'node_modules/tsx/dist/cli.mjs'), path.join(ROOT, 'server/index.ts')], {
    cwd: ROOT,
    env: {
      ...process.env,
      OFFICE_PORT: String(PORT), OFFICE_SOURCES: 'ruflo', OFFICE_POLL_MS: '700', OFFICE_DATA_DIR: DATA,
      OFFICE_TOKENS: `admin:${ADMIN}:jhow,viewer:${VIEWER}:visitante`,
      RUFLO_CWD: WORK, RUFLO_COMMAND: process.execPath, RUFLO_ARGS: `${RUFLO_BIN},mcp,start`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stderr!.on('data', (d) => process.stderr.write('[office] ' + d))
  await waitFor('servidor do escritório', async () => (await api('/api/health', { token: '' })).status === 200)

  // 1. Abre no navegador (HTML servido) + estado
  const html = await fetch(BASE + '/').then((r) => r.text())
  const s0 = await waitFor('9 agentes', async () => { const s = await state(); return s.agents.length === 9 && s })
  check('1. O escritório abre no navegador', html.includes('<canvas') || html.includes('id="stage"') || html.includes('<div'), `GET / → ${html.length} bytes de HTML; modo=${s0.mode}; fonte ruflo ok=${s0.sources[0].ok}`)

  // 2. Agentes reais em suas mesas
  const ceo = byName(s0, 'Helena — CEO executivo de IA')
  const gm = byName(s0, 'Rafael — Gerente-geral de operações')
  check('2. Agentes reais aparecem em suas mesas', s0.agents.every((a) => !a.deskId.startsWith('overflow')) && ceo.deskId === 'executive-ceo' && gm.deskId === 'management-gm',
    s0.agents.map((a) => `${a.id}→${a.deskId} (${a.department})`).join('; '))

  // 10. Sem atividade registrada, ninguém aparece trabalhando — nem se a fonte disser "busy"
  await mcp('agent_update', { agentId: id.margens, status: 'busy' })
  const s10 = await waitFor('margens busy lido', async () => { const s = await state(); return byName(s, 'Analista de margens').rawStatus === 'busy' && s })
  const margens10 = byName(s10, 'Analista de margens')
  check('10. Nunca afirma trabalho sem atividade registrada', s10.agents.every((a) => a.state === 'idle') && margens10.state === 'idle',
    `Todos ociosos sem tarefas. Ruflo marca "Analista de margens" como busy; escritório mostra "${margens10.state}" com evidência: ${margens10.evidence}`)
  await mcp('agent_update', { agentId: id.margens, status: 'idle' })

  const sse = new Sse()
  await sse.open()

  // 4. Nova tarefa aparece: ordem enviada pelo painel (API) vira task_create real no Ruflo
  const order = await api<{ taskKey: string }>('/api/office/commands', { method: 'POST', body: JSON.stringify({ type: 'order_ceo', text: 'Encontre oportunidades comerciais em construtoras de Goiânia e prepare uma proposta de manutenção preventiva', priority: 'high' }) })
  const rootId = order.body.taskKey?.split(':')[1]
  const rufloRoot = await mcp('task_status', { taskId: rootId })
  await waitFor('task.received no SSE', async () => sse.has('task.received', (e) => e.taskKey === order.body.taskKey))
  check('4. Uma nova tarefa aparece no escritório', order.status === 200 && rufloRoot.assignedTo?.includes(id.ceo),
    `POST order_ceo → ${order.status}; Ruflo task_status(${rootId}) assignedTo=${rufloRoot.assignedTo} tags=${rufloRoot.tags}; SSE recebeu task.received`)

  // 3. Estado visual muda com o estado real
  await mcp('task_update', { taskId: rootId, status: 'in_progress', progress: 10 })
  const s3 = await waitFor('CEO trabalhando', async () => { const s = await state(); const a = byName(s, ceo.name); return a.state !== 'idle' && a.state !== 'queued' && s })
  const ceo3 = byName(s3, ceo.name)
  check('3. O estado visual muda quando o estado real muda', ['working', 'researching', 'proposal', 'analyzing', 'writing'].includes(ceo3.state) && sse.has('agent.state', (e) => e.agentKey === ceo.key),
    `task_update(${rootId}, in_progress) → CEO "${ceo3.state}" (${ceo3.evidence}); evento agent.state recebido por SSE`)

  // 5. Delegação real CEO → gerente → especialistas (tags parent/from)
  const gmTask = await mcp('task_create', { type: 'coordination', description: 'Organizar a execução: oportunidades em construtoras de Goiânia', assignTo: [id.gm], tags: [`parent:${rootId}`, `from:${id.ceo}`] })
  await waitFor('CEO delegando', async () => byName(await state(), ceo.name).state === 'delegating')
  await mcp('task_update', { taskId: gmTask.taskId, status: 'in_progress', progress: 20 })
  const comTask = await mcp('task_create', { type: 'coordination', description: 'Coordenar prospecção e proposta comercial', assignTo: [id['dir-comercial']], tags: [`parent:${gmTask.taskId}`, `from:${id.gm}`] })
  const finTask = await mcp('task_create', { type: 'analysis', description: 'Analisar margem mínima para contratos de manutenção preventiva', assignTo: [id.margens], tags: [`parent:${gmTask.taskId}`, `from:${id.gm}`] })
  const sdrTask = await mcp('task_create', { type: 'research', description: 'Pesquisar construtoras com obras ativas em Goiânia', assignTo: [id.sdr], tags: [`parent:${comTask.taskId}`, `from:${id['dir-comercial']}`] })
  const propTask = await mcp('task_create', { type: 'proposal', description: 'Preparar proposta de contrato de manutenção preventiva', assignTo: [id.propostas], tags: [`parent:${comTask.taskId}`, `from:${id['dir-comercial']}`] })
  await waitFor('4 delegações', async () => sse.events.filter((e) => e.type === 'task.delegated').length >= 5)
  const chain = sse.events.filter((e) => e.type === 'task.delegated').map((e) => `${e.fromAgentKey?.split(':')[1]}→${e.agentKey?.split(':')[1]}`)
  const sTree = await state()
  const sdrT = sTree.tasks.find((t) => t.id === sdrTask.taskId)!
  check('5. Delegação real CEO → gerente → especialistas', chain[0] === `${id.ceo}→${id.gm}` && chain.includes(`${id.gm}→${id['dir-comercial']}`) && chain.includes(`${id['dir-comercial']}→${id.sdr}`) && sdrT.parentKey === `ruflo:${comTask.taskId}`,
    `Eventos task.delegated: ${chain.join(', ')}; árvore: ${rootId} → ${gmTask.taskId} → ${comTask.taskId} → ${sdrTask.taskId}`)

  // Especialistas trabalham (estados distintos a partir do tipo/título real)
  await mcp('task_update', { taskId: sdrTask.taskId, status: 'in_progress', progress: 35 })
  await mcp('task_update', { taskId: propTask.taskId, status: 'in_progress', progress: 15 })
  await mcp('task_update', { taskId: finTask.taskId, status: 'in_progress', progress: 60 })
  await mcp('task_update', { taskId: comTask.taskId, status: 'in_progress', progress: 25 })
  const sWork = await waitFor('especialistas ativos', async () => { const s = await state(); return byName(s, 'SDR de construtoras').state === 'researching' && byName(s, 'Preparador de propostas').state === 'proposal' && byName(s, 'Analista de margens').state === 'analyzing' && s })
  await sleep(11_000) // passa a janela de "delegando" para a captura mostrar o trabalho em si
  const page = await shots('trabalho')

  // 6. Clicar no agente mostra tarefa e resultado
  await mcp('task_complete', { taskId: sdrTask.taskId, result: { resumo: '3 construtoras com obras ativas encontradas (dados públicos)', fontes: ['registro público de alvarás'] } })
  const detail = await waitFor('resultado do SDR', async () => { const d = (await api(`/api/office/agents/${encodeURIComponent(`ruflo:${id.sdr}`)}`)).body; return d.agent?.lastResult && d })
  const propDetail = (await api(`/api/office/agents/${encodeURIComponent(`ruflo:${id.propostas}`)}`)).body
  check('6. Clicar em um agente mostra tarefa e resultado', detail.agent.lastResult.includes('3 construtoras') && propDetail.agent.currentTask?.includes('Preparar proposta') && detail.history.length > 0,
    `Painel do SDR: resultado="${detail.agent.lastResult.replace(/\s+/g, ' ').slice(0, 90)}…", ${detail.history.length} eventos no histórico. Painel do preparador: tarefa atual="${propDetail.agent.currentTask}" ${propDetail.agent.progress}%`)
  if (page) await page.click('Preparador de propostas')

  // 7. Erros e bloqueios
  await mcp('task_update', { taskId: propTask.taskId, result: { officeState: 'blocked', reason: 'Falta tabela de preços de contratos vigente' } })
  await mcp('task_update', { taskId: finTask.taskId, status: 'failed', result: { error: 'Base de custos não configurada' } })
  const seoTask = await mcp('task_create', { type: 'content', description: 'Revisar página de manutenção preventiva', assignTo: [id.seo], tags: [`parent:${gmTask.taskId}`, `from:${id.gm}`] })
  await mcp('task_update', { taskId: seoTask.taskId, status: 'in_progress', result: { officeState: 'awaiting_approval', reason: 'Publicação no site exige aprovação do proprietário' } })
  const s7 = await waitFor('bloqueio + erro + aprovação', async () => { const s = await state(); return byName(s, 'Preparador de propostas').state === 'blocked' && byName(s, 'Analista de margens').state === 'error' && byName(s, 'Especialista em SEO local').state === 'awaiting_approval' && s })
  const blockedT = s7.tasks.find((t) => t.id === propTask.taskId)!
  check('7. Erros e bloqueios aparecem corretamente', blockedT.reason === 'Falta tabela de preços de contratos vigente' && sse.has('task.blocked') && sse.has('task.failed') && sse.has('task.awaiting_approval') && s7.metrics.alerts >= 3,
    `Preparador=blocked ("${blockedT.reason}"); Analista=error ("${byName(s7, 'Analista de margens').lastError}"); SEO=awaiting_approval; alertas=${s7.metrics.alerts}`)
  await shots('alertas', page)

  // Aprovação pelo painel (comando real → task_update no Ruflo)
  const appr = await api('/api/office/commands', { method: 'POST', body: JSON.stringify({ type: 'approve_task', taskKey: `ruflo:${seoTask.taskId}`, note: 'Aprovado' }) })
  const approved = await mcp('task_status', { taskId: seoTask.taskId })
  check('Extra. Aprovação pelo painel grava no Ruflo', appr.status === 200 && approved.status === 'in_progress' && approved.result?.officeState === 'approved', `POST approve_task → ${appr.status}; Ruflo result=${JSON.stringify(approved.result)}`)

  // 8. Reconexão: cliente cai, eventos acontecem, cliente volta com o último id e recebe o que perdeu
  const lastSeen = sse.lastId
  sse.close()
  await mcp('task_complete', { taskId: comTask.taskId, result: { resumo: 'Prospecção concluída; proposta bloqueada aguardando tabela de preços' } })
  await mcp('agent_terminate', { agentId: id['dir-mkt'] })
  await waitFor('mudanças lidas', async () => { const s = await state(); return !s.agents.some((a) => a.id === id['dir-mkt']) && s })
  const sse2 = new Sse(lastSeen)
  await sse2.open()
  await waitFor('replay', async () => sse2.has('task.completed') && sse2.has('agent.removed'))
  check('8. A tela recupera o estado após reconexão', sse2.snapshots >= 1 && sse2.events.every((e) => e.seq > lastSeen) && sse2.has('task.completed', (e) => e.taskKey === `ruflo:${comTask.taskId}`) && sse2.has('agent.removed'),
    `Desconectado no evento ${lastSeen}; ao reconectar com since=${lastSeen}: snapshot completo + ${sse2.events.length} eventos perdidos reenviados (task.completed, agent.removed…)`)
  sse2.close()

  // 9. Modo 2D disponível
  const v2d = page ? await page.shot('2d', '2d') : false
  const vk = page ? await page.shot('kanban', 'kanban') : false
  const vl = page ? await page.shot('lista', 'list') : false
  check('9. O modo 2D continua disponível', v2d && vk && vl, page ? `Planta 2D com agentes=${v2d}, Kanban com cartões=${vk}, Lista com linhas=${vl} (dados reais do Ruflo)` : 'Playwright indisponível: 2D não verificado')

  // Segurança
  const noTok = await api('/api/office/state', { token: '' })
  const viewerCmd = await api('/api/office/commands', { method: 'POST', token: VIEWER, body: JSON.stringify({ type: 'order_ceo', text: 'teste de permissão' }) })
  const evil = await api('/api/office/commands', { method: 'POST', body: JSON.stringify({ type: 'exec', cmd: 'cat /etc/passwd' }) })
  const audit = await api('/api/office/audit', { token: VIEWER })
  check('Segurança: autenticação, papéis e lista de comandos', noTok.status === 401 && viewerCmd.status === 403 && evil.status === 400 && audit.status === 403,
    `sem token→${noTok.status}; visitante enviando ordem→${viewerCmd.status}; comando arbitrário→${evil.status}; visitante lendo auditoria→${audit.status}`)

  await page?.close()
}

/* ------------------------------------------------------------ capturas -- */
type Page = { click(agentName: string): Promise<void>; shot(name: string, view?: string): Promise<boolean>; close(): Promise<void> }
async function shots(name: string, page?: Page | null, view?: string): Promise<Page | null> {
  if (page === undefined) page = await openBrowser()
  if (!page) return null
  await page.shot(name, view)
  return page
}
async function openBrowser(): Promise<Page | null> {
  let pw: any
  try { pw = createRequire(import.meta.url)('playwright') } catch { console.log('(playwright não instalado: sem capturas)'); return null }
  const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript((t: string) => { try { localStorage.setItem('office_token', t); localStorage.setItem('office_view', '3d') } catch {} }, ADMIN)
  const p = await ctx.newPage()
  await p.goto(BASE + '/')
  await p.waitForTimeout(4000)
  return {
    async click(name) {
      await p.evaluate((n: string) => ([...document.querySelectorAll('.agent-label')].find((e) => e.textContent?.includes(n)) as HTMLElement | undefined)?.click(), name)
      await p.waitForTimeout(1500)
    },
    async shot(n, v) {
      if (v) { await p.click(`[data-view="${v}"]`); await p.waitForTimeout(1500) }
      else await p.waitForTimeout(1500)
      await p.screenshot({ path: path.join(OUT, `${n}.png`) })
      if (v === '2d') return (await p.locator('svg.plan g.agent').count()) > 0
      if (v === 'kanban') return (await p.locator('.kanban .card').count()) > 0
      if (v === 'list') return (await p.locator('table.agents tbody tr[data-agent]').count()) > 0
      return true
    },
    async close() { await browser.close() },
  }
}

main()
  .catch((e) => { check('Execução do roteiro', false, String(e?.stack ?? e)); })
  .finally(async () => {
    fs.writeFileSync(path.join(OUT, 'resultados.json'), JSON.stringify({ quando: new Date().toISOString(), ruflo: RUFLO_BIN, resultados: results }, null, 2))
    const failed = results.filter((r) => !r.ok).length
    console.log(`\n${results.length - failed}/${results.length} critérios aprovados. Evidências em ${OUT}`)
    server?.kill('SIGTERM')
    await runtime.close().catch(() => {})
    process.exit(failed ? 1 : 0)
  })
