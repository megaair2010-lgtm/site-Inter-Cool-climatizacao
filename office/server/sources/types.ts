import type { SourceName } from '../../shared/types'

/** Agente como a fonte o descreve, antes de ganhar mesa e estado visual. */
export interface RawAgent {
  id: string
  name: string
  type: string
  status: string
  description?: string
}

/** Tarefa normalizada a partir da fonte. Nenhum campo é inventado. */
export interface RawTask {
  id: string
  title: string
  type: string
  /** Estado já mapeado para o vocabulário do escritório. */
  status: 'queued' | 'running' | 'review' | 'awaiting_approval' | 'blocked' | 'done' | 'failed' | 'cancelled'
  rawStatus: string
  progress: number | null
  assignees: string[]
  parentId: string | null
  fromAgentId: string | null
  kind: 'task' | 'meeting'
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  result: unknown
  error: unknown
  reason: string | null
}

export interface SourceRead {
  agents: RawAgent[]
  tasks: RawTask[]
}

export interface SourceCapabilities {
  order: boolean
  cancel: boolean
  retry: boolean
  approve: boolean
  intervene: boolean
}

export interface Source {
  name: SourceName
  capabilities: SourceCapabilities
  start(): Promise<void>
  stop(): Promise<void>
  read(): Promise<SourceRead>
  /** Cria a tarefa da ordem e a atribui ao agente CEO. Retorna o id real criado. */
  orderCeo(ceoAgentId: string, text: string, priority: string, actor: string): Promise<string>
  cancel(taskId: string, actor: string): Promise<void>
  retry(taskId: string, actor: string): Promise<void>
  approve(taskId: string, note: string, actor: string): Promise<void>
  intervene(taskId: string, note: string, actor: string): Promise<void>
}

export function iso(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v).toISOString()
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
