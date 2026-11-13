import type {
  AgentDetail,
  OfficeAgent,
  OfficeEvent,
  OfficeEventType,
  OfficeMetrics,
  OfficeSnapshot,
  OfficeTask,
  SourceHealth,
  SourceName,
  VisualState,
} from '../../shared/types'
import { WORKING_STATES } from '../../shared/types'
import { redact } from '../redact'
import type { RawAgent, RawTask, Source } from '../sources/types'
import { Roster } from './roster'

// Motor do escritório: lê as fontes, compara com a leitura anterior, gera eventos e
// deriva o estado visual de cada agente. O estado visual só afirma atividade quando
// existe uma tarefa registrada que a sustenta (campo `evidence`).

export const DONE_MS = 8_000
export const DELEGATE_MS = 10_000
export const ERROR_MS = 30 * 60_000

export interface Patch {
  seq: number
  agents: OfficeAgent[]
  removedAgents: string[]
  tasks: OfficeTask[]
  removedTasks: string[]
  metrics: OfficeMetrics
  sources: SourceHealth[]
}

type Listener = { onEvent(e: OfficeEvent): void; onPatch(p: Patch): void }

interface SourceState {
  source: Source
  baseline: boolean
  agents: Map<string, RawAgent>
  tasks: Map<string, RawTask>
  health: SourceHealth
}

const ACTIVITY: [RegExp, VisualState][] = [
  [/research|pesquis|investig|levantament|busca/i, 'researching'],
  [/proposal|proposta|or[cç]amento|cota[cç]/i, 'proposal'],
  [/analy|an[aá]lis|relat[oó]rio|dados|data|m[eé]trica|margem|fluxo de caixa|dre/i, 'analyzing'],
  [/content|conte[uú]do|writ|escrev|artigo|post|copy|seo|blog|roteiro/i, 'writing'],
]

const STATE_LABEL: Record<VisualState, string> = {
  offline: 'desconectado',
  idle: 'ocioso',
  queued: 'aguardando início',
  working: 'executando tarefa',
  researching: 'pesquisando',
  analyzing: 'analisando dados',
  writing: 'escrevendo conteúdo',
  proposal: 'preparando proposta',
  delegating: 'delegando tarefa',
  meeting: 'em reunião',
  awaiting_approval: 'aguardando aprovação',
  review: 'em revisão',
  blocked: 'bloqueado',
  done: 'trabalho concluído',
  error: 'erro de execução',
}

export class OfficeEngine {
  private seq = 0
  private events: OfficeEvent[] = []
  private listeners = new Set<Listener>()
  private states = new Map<SourceName, SourceState>()
  private agents = new Map<string, OfficeAgent>()
  private tasks = new Map<string, OfficeTask>()
  private delegatedAt = new Map<string, { at: number; to: string[]; parentTaskKey: string | null }>()
  private timer: NodeJS.Timeout | null = null
  private polling = false

  constructor(
    sources: Source[],
    private roster: Roster,
    private opts: { pollMs: number; eventBuffer: number; now?: () => number },
  ) {
    for (const s of sources) {
      this.states.set(s.name, {
        source: s,
        baseline: false,
        agents: new Map(),
        tasks: new Map(),
        health: { name: s.name, ok: false, lastOkAt: null, error: 'ainda não conectado' },
      })
    }
  }

  private now(): number {
    return this.opts.now ? this.opts.now() : Date.now()
  }

  get mode(): 'real' | 'demo' {
    return this.states.has('demo') ? 'demo' : 'real'
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  async start(): Promise<void> {
    for (const st of this.states.values()) {
      await st.source.start().catch((e) => this.markDown(st, e))
    }
    await this.poll()
    this.timer = setInterval(() => void this.poll(), this.opts.pollMs)
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer)
    for (const st of this.states.values()) await st.source.stop().catch(() => {})
  }

  source(name: SourceName): Source | undefined {
    return this.states.get(name)?.source
  }

  /* ------------------------------------------------------------- leitura -- */

  async poll(): Promise<void> {
    if (this.polling) return
    this.polling = true
    try {
      for (const st of this.states.values()) {
        try {
          const data = await st.source.read()
          this.ingest(st, data.agents, data.tasks)
        } catch (e) {
          this.markDown(st, e)
        }
      }
      this.rebuild()
    } finally {
      this.polling = false
    }
  }

  private markDown(st: SourceState, e: unknown): void {
    const msg = redact(e instanceof Error ? e.message : String(e), 300)
    if (st.health.ok || st.health.error === 'ainda não conectado') {
      this.emit('source.down', st.source.name, { summary: `Fonte ${st.source.name} indisponível: ${msg}` })
      for (const a of st.agents.values()) {
        this.emit('agent.disconnected', st.source.name, { agentKey: key(st.source.name, a.id), summary: `${a.name} desconectado (fonte ${st.source.name} indisponível)` })
      }
    }
    st.health = { ...st.health, ok: false, error: msg }
  }

  /** Compara a leitura nova com a anterior e emite os eventos correspondentes. */
  ingest(st: SourceState | SourceName, rawAgents: RawAgent[], rawTasks: RawTask[]): void {
    if (typeof st === 'string') st = this.states.get(st)!
    const src = st.source.name
    const wasDown = !st.health.ok
    st.health = { name: src, ok: true, lastOkAt: new Date(this.now()).toISOString(), error: null }

    const nextAgents = new Map(rawAgents.map((a) => [a.id, a]))
    const nextTasks = new Map(rawTasks.map((t) => [t.id, t]))

    if (!st.baseline) {
      st.baseline = true
      st.agents = nextAgents
      st.tasks = nextTasks
      this.emit('source.up', src, { summary: `Fonte ${src} conectada: ${rawAgents.length} agentes, ${rawTasks.length} tarefas` })
      return
    }
    if (wasDown) {
      this.emit('source.up', src, { summary: `Fonte ${src} reconectada` })
      for (const a of rawAgents) {
        if (st.agents.has(a.id)) this.emit('agent.reconnected', src, { agentKey: key(src, a.id), summary: `${a.name} reconectado` })
      }
    }

    // Agentes
    for (const a of rawAgents) {
      const prev = st.agents.get(a.id)
      const k = key(src, a.id)
      if (!prev) this.emit('agent.started', src, { agentKey: k, summary: `${a.name} entrou no escritório` })
      else if (prev.name !== a.name) this.emit('agent.renamed', src, { agentKey: k, summary: `${prev.name} agora se chama ${a.name}` })
    }
    for (const [id, a] of st.agents) {
      if (!nextAgents.has(id)) this.emit('agent.removed', src, { agentKey: key(src, id), summary: `${a.name} foi removido` })
    }

    const nameOf = (id: string) => nextAgents.get(id)?.name ?? st.agents.get(id)?.name ?? id

    // Tarefas
    for (const t of rawTasks) {
      const prev = st.tasks.get(t.id)
      const tk = key(src, t.id)
      const from = this.resolveFrom(t, nextTasks)
      const newAssignees = t.assignees.filter((a) => !prev?.assignees.includes(a))
      if (newAssignees.length) {
        const names = newAssignees.map(nameOf).join(', ')
        if (from && !newAssignees.includes(from)) {
          this.emit('task.delegated', src, { taskKey: tk, agentKey: key(src, newAssignees[0]), fromAgentKey: key(src, from), summary: `${nameOf(from)} delegou "${short(t.title)}" para ${names}` })
          this.delegatedAt.set(key(src, from), {
            at: this.now(),
            to: newAssignees.map((a) => key(src, a)),
            parentTaskKey: t.parentId ? key(src, t.parentId) : null,
          })
        } else {
          for (const a of newAssignees) this.emit('task.received', src, { taskKey: tk, agentKey: key(src, a), summary: `${nameOf(a)} recebeu a tarefa "${short(t.title)}"` })
        }
      } else if (!prev) {
        this.emit('task.received', src, { taskKey: tk, summary: `Nova tarefa na fila: "${short(t.title)}"` })
      }
      if (prev && prev.status === t.status && prev.progress !== t.progress && t.status === 'running') {
        this.emit('task.progress', src, { taskKey: tk, agentKey: t.assignees[0] ? key(src, t.assignees[0]) : undefined, summary: `"${short(t.title)}" em ${t.progress ?? 0}%` })
      }
      if (prev?.status !== t.status && (prev || t.status !== 'queued')) {
        const who = t.assignees.length ? t.assignees.map(nameOf).join(', ') : 'sem responsável'
        const agentKey = t.assignees[0] ? key(src, t.assignees[0]) : undefined
        const map: Partial<Record<RawTask['status'], [OfficeEventType, string]>> = {
          running: ['task.started', `${who} começou "${short(t.title)}"`],
          awaiting_approval: ['task.awaiting_approval', `"${short(t.title)}" aguarda aprovação${t.reason ? `: ${short(t.reason)}` : ''}`],
          review: ['task.review', `"${short(t.title)}" está em revisão`],
          blocked: ['task.blocked', `${who} bloqueado em "${short(t.title)}"${t.reason ? `: ${short(t.reason)}` : ''}`],
          done: ['task.completed', `${who} concluiu "${short(t.title)}"`],
          failed: ['task.failed', `"${short(t.title)}" falhou${t.error ? `: ${short(redact(t.error, 200) ?? '')}` : ''}`],
          cancelled: ['task.cancelled', `"${short(t.title)}" foi cancelada`],
        }
        const ev = map[t.status]
        if (ev) this.emit(ev[0], src, { taskKey: tk, agentKey, summary: ev[1] })
      }
    }

    st.agents = nextAgents
    st.tasks = nextTasks
  }

  /** Quem delegou: tag explícita `from`, senão o responsável pela tarefa-mãe. */
  private resolveFrom(t: RawTask, all: Map<string, RawTask>): string | null {
    if (t.fromAgentId) return t.fromAgentId
    if (t.parentId) return all.get(t.parentId)?.assignees[0] ?? null
    return null
  }

  /* ------------------------------------------------------------ derivação -- */

  private rebuild(): void {
    const now = this.now()
    const nextTasks = new Map<string, OfficeTask>()
    const present: { key: string; raw: RawAgent; src: SourceName; ok: boolean }[] = []

    for (const st of this.states.values()) {
      const src = st.source.name
      for (const a of st.agents.values()) present.push({ key: key(src, a.id), raw: a, src, ok: st.health.ok })
      for (const t of st.tasks.values()) {
        const from = this.resolveFrom(t, st.tasks)
        const ot: OfficeTask = {
          key: key(src, t.id),
          id: t.id,
          source: src,
          title: redact(t.title, 500) ?? '',
          type: t.type,
          status: t.status,
          rawStatus: t.rawStatus,
          progress: t.progress,
          assignees: t.assignees.map((a) => key(src, a)),
          parentKey: t.parentId ? key(src, t.parentId) : null,
          fromAgent: from ? key(src, from) : null,
          kind: t.kind,
          createdAt: t.createdAt,
          startedAt: t.startedAt,
          completedAt: t.completedAt,
          updatedAt: t.completedAt ?? t.startedAt ?? t.createdAt,
          result: redact(t.result),
          error: redact(t.error, 1500),
          reason: redact(t.reason, 500),
        }
        const old = this.tasks.get(ot.key)
        if (old && sameTask(old, ot)) ot.updatedAt = old.updatedAt
        else if (old) ot.updatedAt = new Date(now).toISOString()
        nextTasks.set(ot.key, ot)
      }
    }

    this.roster.sync(present.map((p) => ({ key: p.key, raw: p.raw })))

    const byAgent = new Map<string, OfficeTask[]>()
    for (const t of nextTasks.values()) {
      for (const a of t.assignees) {
        if (!byAgent.has(a)) byAgent.set(a, [])
        byAgent.get(a)!.push(t)
      }
    }

    const nextAgents = new Map<string, OfficeAgent>()
    for (const p of present) {
      const place = this.roster.get(p.key)!
      const mine = (byAgent.get(p.key) ?? []).sort((a, b) => ts(b) - ts(a))
      const d = this.deriveState(p.key, p.raw, mine, p.ok, now)
      const lastDone = mine.find((t) => t.status === 'done')
      const lastFail = mine.find((t) => t.status === 'failed')
      const agent: OfficeAgent = {
        key: p.key,
        id: p.raw.id,
        source: p.src,
        name: p.raw.name,
        role: place.role,
        title: place.title,
        department: place.department,
        deskId: place.deskId,
        state: d.state,
        rawStatus: p.raw.status,
        evidence: d.evidence,
        currentTaskKey: d.task?.key ?? null,
        currentTask: d.task?.title ?? null,
        progress: d.task?.progress ?? null,
        delegation: d.delegation,
        lastResult: lastDone?.result ?? null,
        lastError: lastFail?.error ?? null,
        updatedAt: new Date(now).toISOString(),
      }
      const old = this.agents.get(p.key)
      if (old) {
        agent.updatedAt = sameAgent(old, agent) ? old.updatedAt : agent.updatedAt
        if (old.state !== agent.state) {
          this.emit('agent.state', p.src, { agentKey: p.key, taskKey: agent.currentTaskKey ?? undefined, summary: `${agent.name}: ${STATE_LABEL[old.state]} → ${STATE_LABEL[agent.state]}` })
        }
      }
      nextAgents.set(p.key, agent)
    }

    // Patch para os clientes conectados
    const changedAgents = [...nextAgents.values()].filter((a) => {
      const o = this.agents.get(a.key)
      return !o || !sameAgent(o, a)
    })
    const removedAgents = [...this.agents.keys()].filter((k) => !nextAgents.has(k))
    const changedTasks = [...nextTasks.values()].filter((t) => {
      const o = this.tasks.get(t.key)
      return !o || !sameTask(o, t)
    })
    const removedTasks = [...this.tasks.keys()].filter((k) => !nextTasks.has(k))
    this.agents = nextAgents
    this.tasks = nextTasks
    for (const [k, v] of this.delegatedAt) if (now - v.at > DELEGATE_MS) this.delegatedAt.delete(k)

    if (changedAgents.length || removedAgents.length || changedTasks.length || removedTasks.length || this.sourcesChanged()) {
      const patch: Patch = {
        seq: ++this.seq,
        agents: changedAgents,
        removedAgents,
        tasks: changedTasks,
        removedTasks,
        metrics: this.metrics(),
        sources: this.sourceHealth(),
      }
      for (const l of this.listeners) l.onPatch(patch)
    }
  }

  private lastSourcesSig = ''
  private sourcesChanged(): boolean {
    const sig = this.sourceHealth().map((s) => `${s.name}:${s.ok}:${s.error}`).join('|')
    const changed = sig !== this.lastSourcesSig
    this.lastSourcesSig = sig
    return changed
  }

  deriveState(
    agentKey: string,
    raw: RawAgent,
    mine: OfficeTask[],
    sourceOk: boolean,
    now: number,
  ): { state: VisualState; evidence: string; task: OfficeTask | null; delegation: OfficeAgent['delegation'] } {
    if (!sourceOk) return { state: 'offline', evidence: 'Fonte indisponível: último estado conhecido não é exibido como atividade.', task: null, delegation: null }

    const pick = (s: OfficeTask['status'], kind?: OfficeTask['kind']) => mine.find((t) => t.status === s && (!kind || t.kind === kind)) ?? null
    const meeting = pick('running', 'meeting')
    const running = pick('running')
    const blocked = pick('blocked')
    const approval = pick('awaiting_approval')
    const review = pick('review')
    const queued = pick('queued')
    const del = this.delegatedAt.get(agentKey)
    const delegation = del && now - del.at <= DELEGATE_MS ? { from: agentKey, to: del.to, parentTaskKey: del.parentTaskKey } : null
    const incoming = running ?? approval ?? blocked ?? review ?? queued
    const incomingDelegation = incoming?.fromAgent ? { from: incoming.fromAgent, to: [agentKey], parentTaskKey: incoming.parentKey } : null

    if (meeting) return { state: 'meeting', evidence: `Tarefa de reunião em andamento (${meeting.id})`, task: meeting, delegation: incomingDelegation }
    if (delegation) {
      return { state: 'delegating', evidence: `Delegou ${delegation.to.length} tarefa(s) há ${Math.round((now - del!.at) / 1000)} s`, task: running ?? queued, delegation }
    }
    if (running) {
      // O tipo declarado da tarefa manda; o título só desempata quando o tipo é genérico.
      const activity = ACTIVITY.find(([re]) => re.test(running.type))?.[1] ?? ACTIVITY.find(([re]) => re.test(running.title))?.[1] ?? 'working'
      return { state: activity, evidence: `Tarefa ${running.id} com status "${running.rawStatus}" na fonte ${running.source}`, task: running, delegation: incomingDelegation }
    }
    if (blocked) return { state: 'blocked', evidence: `Tarefa ${blocked.id} bloqueada`, task: blocked, delegation: incomingDelegation }
    if (approval) return { state: 'awaiting_approval', evidence: `Tarefa ${approval.id} aguardando aprovação`, task: approval, delegation: incomingDelegation }
    if (review) return { state: 'review', evidence: `Tarefa ${review.id} em revisão`, task: review, delegation: incomingDelegation }

    const lastTerminal = mine.find((t) => t.status === 'done' || t.status === 'failed' || t.status === 'cancelled')
    if (lastTerminal?.status === 'failed' && now - Date.parse(lastTerminal.completedAt ?? lastTerminal.updatedAt) < ERROR_MS && !queued) {
      return { state: 'error', evidence: `Última tarefa (${lastTerminal.id}) falhou`, task: lastTerminal, delegation: null }
    }
    if (lastTerminal?.status === 'done' && now - Date.parse(lastTerminal.completedAt ?? lastTerminal.updatedAt) < DONE_MS) {
      return { state: 'done', evidence: `Concluiu a tarefa ${lastTerminal.id}`, task: lastTerminal, delegation: null }
    }
    if (queued) return { state: 'queued', evidence: `Tarefa ${queued.id} atribuída, ainda não iniciada`, task: queued, delegation: incomingDelegation }

    const note = raw.status === 'busy' ? ' (a fonte marca o agente como "busy", mas não há tarefa registrada; não exibido como trabalhando)' : ''
    return { state: 'idle', evidence: `Nenhuma tarefa ativa registrada${note}`, task: null, delegation: null }
  }

  /* ---------------------------------------------------------------- saída -- */

  private emit(type: OfficeEventType, source: OfficeEvent['source'], e: Omit<OfficeEvent, 'seq' | 'at' | 'type' | 'source'>): OfficeEvent {
    const ev: OfficeEvent = { seq: ++this.seq, at: new Date(this.now()).toISOString(), type, source, ...e, summary: redact(e.summary, 400) ?? '' }
    this.events.push(ev)
    if (this.events.length > this.opts.eventBuffer) this.events.splice(0, this.events.length - this.opts.eventBuffer)
    for (const l of this.listeners) l.onEvent(ev)
    return ev
  }

  recordCommand(summary: string, taskKey?: string): void {
    this.emit('command', 'office', { summary, taskKey })
  }

  eventsSince(seq: number): OfficeEvent[] | null {
    if (!this.events.length || seq >= this.seq) return []
    if (this.events[0].seq > seq + 1) return null // fora do buffer: cliente precisa de snapshot
    return this.events.filter((e) => e.seq > seq)
  }

  sourceHealth(): SourceHealth[] {
    return [...this.states.values()].map((s) => s.health)
  }

  metrics(): OfficeMetrics {
    const agents = [...this.agents.values()]
    const tasks = [...this.tasks.values()]
    const dayAgo = this.now() - 24 * 3600_000
    const recentFailed = tasks.filter((t) => t.status === 'failed' && Date.parse(t.completedAt ?? t.updatedAt) > dayAgo).length
    const blocked = tasks.filter((t) => t.status === 'blocked').length
    const approvals = tasks.filter((t) => t.status === 'awaiting_approval').length
    return {
      agentsTotal: agents.length,
      agentsActive: agents.filter((a) => a.state !== 'offline').length,
      agentsWorking: agents.filter((a) => WORKING_STATES.includes(a.state)).length,
      agentsIdle: agents.filter((a) => a.state === 'idle').length,
      tasksCompleted: tasks.filter((t) => t.status === 'done').length,
      tasksBlocked: blocked,
      tasksQueued: tasks.filter((t) => t.status === 'queued').length,
      tasksRunning: tasks.filter((t) => t.status === 'running').length,
      tasksFailed: tasks.filter((t) => t.status === 'failed').length,
      meetingsRunning: tasks.filter((t) => t.kind === 'meeting' && t.status === 'running').length,
      alerts: blocked + approvals + recentFailed + this.sourceHealth().filter((s) => !s.ok).length,
    }
  }

  snapshot(): OfficeSnapshot {
    return {
      seq: this.seq,
      generatedAt: new Date(this.now()).toISOString(),
      mode: this.mode,
      sources: this.sourceHealth(),
      agents: [...this.agents.values()],
      tasks: [...this.tasks.values()].sort((a, b) => ts(b) - ts(a)),
      metrics: this.metrics(),
      recentEvents: this.events.slice(-100),
    }
  }

  agentDetail(agentKey: string): AgentDetail | null {
    const agent = this.agents.get(agentKey)
    if (!agent) return null
    const tasks = [...this.tasks.values()].filter((t) => t.assignees.includes(agentKey) || t.fromAgent === agentKey).sort((a, b) => ts(b) - ts(a)).slice(0, 50)
    const taskKeys = new Set(tasks.map((t) => t.key))
    const history = this.events.filter((e) => e.agentKey === agentKey || e.fromAgentKey === agentKey || (e.taskKey && taskKeys.has(e.taskKey))).slice(-100).reverse()
    const caps = this.states.get(agent.source)!.source.capabilities
    return { agent, history, tasks, capabilities: { intervene: caps.intervene, cancel: caps.cancel, retry: caps.retry, approve: caps.approve } }
  }

  task(taskKey: string): OfficeTask | undefined {
    return this.tasks.get(taskKey)
  }

  taskEvents(taskKey: string): OfficeEvent[] {
    return this.events.filter((e) => e.taskKey === taskKey).reverse()
  }

  /** O agente CEO: papel "ceo" atribuído pela planta/override. */
  ceo(): OfficeAgent | undefined {
    return [...this.agents.values()].find((a) => a.role === 'ceo' && a.state !== 'offline')
  }
}

export function key(src: string, id: string): string {
  return `${src}:${id}`
}

function ts(t: OfficeTask): number {
  return Date.parse(t.completedAt ?? t.startedAt ?? t.createdAt) || 0
}

function short(s: string, n = 80): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function sameTask(a: OfficeTask, b: OfficeTask): boolean {
  return a.status === b.status && a.progress === b.progress && a.title === b.title && a.result === b.result && a.error === b.error && a.reason === b.reason && a.assignees.join() === b.assignees.join()
}

function sameAgent(a: OfficeAgent, b: OfficeAgent): boolean {
  return (
    a.state === b.state && a.name === b.name && a.deskId === b.deskId && a.currentTaskKey === b.currentTaskKey &&
    a.progress === b.progress && a.title === b.title && a.lastError === b.lastError && a.lastResult === b.lastResult &&
    JSON.stringify(a.delegation) === JSON.stringify(b.delegation) && a.evidence.split(' há ')[0] === b.evidence.split(' há ')[0]
  )
}
