import type { OfficeAgent, OfficeEvent, OfficeMetrics, OfficeSnapshot, OfficeTask, Role, SourceHealth } from '../../shared/types'

// Estado do cliente. Recebe um snapshot completo a cada (re)conexão e aplica patches
// incrementais depois. Nada aqui inventa estado: só reflete o que a API envia.

export interface Patch {
  seq: number
  agents: OfficeAgent[]
  removedAgents: string[]
  tasks: OfficeTask[]
  removedTasks: string[]
  metrics: OfficeMetrics
  sources: SourceHealth[]
}

export type Conn = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'unauthorized'

type Handler = { change?(): void; event?(e: OfficeEvent, replay: boolean): void; conn?(c: Conn): void }

class Store {
  seq = 0
  mode: 'real' | 'demo' = 'real'
  agents = new Map<string, OfficeAgent>()
  tasks = new Map<string, OfficeTask>()
  metrics: OfficeMetrics | null = null
  sources: SourceHealth[] = []
  events: OfficeEvent[] = []
  conn: Conn = 'connecting'
  role: Role | null = null
  me = ''
  private handlers = new Set<Handler>()
  private es: EventSource | null = null
  private retry = 0
  private seenEvents = new Set<number>()

  on(h: Handler): () => void {
    this.handlers.add(h)
    return () => this.handlers.delete(h)
  }

  private changed() {
    for (const h of this.handlers) h.change?.()
  }

  private setConn(c: Conn) {
    this.conn = c
    for (const h of this.handlers) h.conn?.(c)
  }

  applySnapshot(s: OfficeSnapshot) {
    this.seq = s.seq
    this.mode = s.mode
    this.agents = new Map(s.agents.map((a) => [a.key, a]))
    this.tasks = new Map(s.tasks.map((t) => [t.key, t]))
    this.metrics = s.metrics
    this.sources = s.sources
    for (const e of s.recentEvents) this.pushEvent(e, true)
    this.changed()
  }

  applyPatch(p: Patch) {
    this.seq = Math.max(this.seq, p.seq)
    for (const a of p.agents) this.agents.set(a.key, a)
    for (const k of p.removedAgents) this.agents.delete(k)
    for (const t of p.tasks) this.tasks.set(t.key, t)
    for (const k of p.removedTasks) this.tasks.delete(k)
    this.metrics = p.metrics
    this.sources = p.sources
    this.changed()
  }

  private pushEvent(e: OfficeEvent, replay: boolean) {
    if (this.seenEvents.has(e.seq)) return
    this.seenEvents.add(e.seq)
    this.events.push(e)
    this.events.sort((a, b) => a.seq - b.seq)
    if (this.events.length > 500) this.events.splice(0, this.events.length - 500)
    for (const h of this.handlers) h.event?.(e, replay)
  }

  token(): string {
    try {
      return localStorage.getItem('office_token') ?? ''
    } catch {
      return ''
    }
  }

  setToken(t: string) {
    try {
      localStorage.setItem('office_token', t)
    } catch {
      /* sem storage: token vale só nesta aba */
    }
    this.memToken = t
  }
  private memToken = ''

  private auth(): string {
    return this.token() || this.memToken
  }

  async api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(this.auth() ? { Authorization: `Bearer ${this.auth()}` } : {}), ...(init?.headers ?? {}) },
    })
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) this.setConn('unauthorized')
    if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
    return body as T
  }

  async connect() {
    this.es?.close()
    try {
      const me = await this.api<{ role: Role; label: string }>('/api/office/me')
      this.role = me.role
      this.me = me.label
    } catch {
      if (this.conn === 'unauthorized') return
    }
    this.setConn(this.retry ? 'reconnecting' : 'connecting')
    const qs = new URLSearchParams()
    if (this.auth()) qs.set('token', this.auth())
    if (this.seq) qs.set('since', String(this.seq))
    const es = new EventSource(`/api/office/events?${qs}`)
    this.es = es
    es.addEventListener('snapshot', (m) => {
      this.retry = 0
      this.setConn('live')
      this.applySnapshot(JSON.parse((m as MessageEvent).data))
    })
    es.addEventListener('patch', (m) => this.applyPatch(JSON.parse((m as MessageEvent).data)))
    es.addEventListener('office-event', (m) => this.pushEvent(JSON.parse((m as MessageEvent).data), false))
    es.addEventListener('replay', (m) => this.pushEvent(JSON.parse((m as MessageEvent).data), true))
    es.onerror = () => {
      // Reconexão com recuo exponencial; ao voltar, o servidor reenvia o snapshot completo.
      es.close()
      if (this.es !== es) return
      this.retry++
      this.setConn(this.retry > 5 ? 'offline' : 'reconnecting')
      setTimeout(() => this.connect(), Math.min(15_000, 1000 * 2 ** Math.min(this.retry, 4)))
    }
  }

  canOperate(): boolean {
    return this.role === 'operator' || this.role === 'admin'
  }
}

export const store = new Store()
