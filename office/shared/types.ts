// Contrato entre a API de estado do escritório e o frontend.
// Tudo aqui é derivado de dados reais das fontes (Ruflo/Hermes) — ou da fonte
// "demo", que é sempre marcada como tal e nunca misturada com dados reais.

export type SourceName = 'ruflo' | 'hermes' | 'demo'

export type DepartmentId =
  | 'reception'
  | 'executive' // Sala do CEO
  | 'management' // Gerente-geral e centro de operações
  | 'commercial' // 01 Comercial e vendas
  | 'marketing' // 02 Marketing e growth
  | 'seo' // SEO e conteúdo (sob Marketing)
  | 'finance' // 03 Financeiro e controladoria
  | 'operations' // 04 Operações e engenharia HVAC
  | 'customer' // 05 Atendimento, CRM e sucesso do cliente
  | 'supply' // 06 Suprimentos e fornecedores
  | 'legal' // 07 Administrativo, jurídico e licitações
  | 'hr' // 08 RH e gestão de agentes
  | 'intelligence' // 09 Inteligência de mercado
  | 'technology' // 10 Tecnologia, dados e automação
  | 'pmo' // 11 PMO — projetos e planejamento
  | 'quality' // 12 Qualidade, riscos e auditoria
  | 'meeting'
  | 'lounge'

/** Estado visual de um agente. Cada valor exige evidência registrada na fonte. */
export type VisualState =
  | 'offline' // fonte inacessível ou agente encerrado
  | 'idle' // nenhuma tarefa ativa registrada
  | 'queued' // tem tarefa atribuída que ainda não começou
  | 'working' // tarefa em andamento (genérica)
  | 'researching'
  | 'analyzing'
  | 'writing'
  | 'proposal'
  | 'delegating' // acabou de criar/atribuir tarefa a outro agente
  | 'meeting' // tarefa de reunião em andamento
  | 'awaiting_approval'
  | 'review'
  | 'blocked'
  | 'done' // concluiu uma tarefa há poucos segundos
  | 'error' // última tarefa falhou

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'review'
  | 'awaiting_approval'
  | 'blocked'
  | 'done'
  | 'failed'
  | 'cancelled'

export interface OfficeTask {
  key: string // `${source}:${id}`
  id: string
  source: SourceName
  title: string
  type: string
  status: TaskStatus
  rawStatus: string
  progress: number | null
  assignees: string[] // chaves de agente
  parentKey: string | null
  fromAgent: string | null // chave do agente que delegou
  kind: 'task' | 'meeting'
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  updatedAt: string
  result: string | null // já redigido
  error: string | null // já redigido
  reason: string | null // motivo de bloqueio / aprovação
}

export interface OfficeAgent {
  key: string // `${source}:${id}` — identificador persistente
  id: string // id real na fonte (ex.: agent-179... no Ruflo)
  source: SourceName
  name: string
  role: string
  title: string
  department: DepartmentId
  deskId: string
  state: VisualState
  rawStatus: string
  /** Por que o estado é este: qual dado da fonte sustenta a afirmação. */
  evidence: string
  currentTaskKey: string | null
  currentTask: string | null
  progress: number | null
  delegation: { from: string | null; to: string[]; parentTaskKey: string | null } | null
  lastResult: string | null
  lastError: string | null
  updatedAt: string
}

export type OfficeEventType =
  | 'agent.started'
  | 'agent.removed'
  | 'agent.renamed'
  | 'agent.state'
  | 'agent.disconnected'
  | 'agent.reconnected'
  | 'task.received'
  | 'task.delegated'
  | 'task.started'
  | 'task.progress'
  | 'task.awaiting_approval'
  | 'task.review'
  | 'task.blocked'
  | 'task.completed'
  | 'task.failed'
  | 'task.cancelled'
  | 'agent.message'
  | 'source.down'
  | 'source.up'
  | 'command'

export interface OfficeEvent {
  seq: number
  at: string
  type: OfficeEventType
  source: SourceName | 'office'
  agentKey?: string
  taskKey?: string
  /** Para delegação/comunicação: quem originou. */
  fromAgentKey?: string
  summary: string
}

export interface SourceHealth {
  name: SourceName
  ok: boolean
  lastOkAt: string | null
  error: string | null
}

export interface OfficeMetrics {
  agentsTotal: number
  agentsActive: number // não offline
  agentsWorking: number
  agentsIdle: number
  tasksCompleted: number
  tasksBlocked: number
  tasksQueued: number
  tasksRunning: number
  tasksFailed: number
  meetingsRunning: number
  alerts: number
}

export interface OfficeSnapshot {
  seq: number
  generatedAt: string
  mode: 'real' | 'demo'
  sources: SourceHealth[]
  agents: OfficeAgent[]
  tasks: OfficeTask[]
  metrics: OfficeMetrics
  recentEvents: OfficeEvent[]
}

export interface AgentDetail {
  agent: OfficeAgent
  history: OfficeEvent[]
  tasks: OfficeTask[]
  capabilities: { intervene: boolean; cancel: boolean; retry: boolean; approve: boolean }
}

export type Role = 'viewer' | 'operator' | 'admin'

export type OfficeCommand =
  | { type: 'order_ceo'; text: string; priority?: 'low' | 'normal' | 'high' | 'critical' }
  | { type: 'cancel_task'; taskKey: string }
  | { type: 'retry_task'; taskKey: string }
  | { type: 'approve_task'; taskKey: string; note?: string }
  | { type: 'intervene'; taskKey: string; note: string }

export const WORKING_STATES: VisualState[] = [
  'working',
  'researching',
  'analyzing',
  'writing',
  'proposal',
  'delegating',
  'meeting',
  'review',
]
