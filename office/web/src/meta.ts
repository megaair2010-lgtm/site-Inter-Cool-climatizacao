import type { DepartmentId, TaskStatus, VisualState } from '../../shared/types'

export const STATE_META: Record<VisualState, { label: string; color: string; icon: string }> = {
  offline: { label: 'Desconectado', color: '#6B7280', icon: '⏻' },
  idle: { label: 'Ocioso', color: '#9DB3D6', icon: '☕' },
  queued: { label: 'Aguardando início', color: '#A5B4FC', icon: '⏳' },
  working: { label: 'Executando tarefa', color: '#5CC3DD', icon: '⌨' },
  researching: { label: 'Pesquisando', color: '#38BDF8', icon: '🔎' },
  analyzing: { label: 'Analisando dados', color: '#22D3EE', icon: '📊' },
  writing: { label: 'Escrevendo conteúdo', color: '#67E8F9', icon: '✍' },
  proposal: { label: 'Preparando proposta', color: '#7DD3FC', icon: '📄' },
  delegating: { label: 'Delegando tarefa', color: '#C084FC', icon: '➜' },
  meeting: { label: 'Em reunião', color: '#818CF8', icon: '👥' },
  awaiting_approval: { label: 'Aguardando aprovação', color: '#FACC15', icon: '⏸' },
  review: { label: 'Em revisão', color: '#FCD34D', icon: '🔍' },
  blocked: { label: 'Bloqueado', color: '#FB923C', icon: '⚠' },
  done: { label: 'Trabalho concluído', color: '#4ADE80', icon: '✓' },
  error: { label: 'Erro de execução', color: '#F87171', icon: '✕' },
}

export const TASK_META: Record<TaskStatus, { label: string; color: string }> = {
  queued: { label: 'Na fila', color: '#A5B4FC' },
  running: { label: 'Em andamento', color: '#5CC3DD' },
  review: { label: 'Em revisão', color: '#FCD34D' },
  awaiting_approval: { label: 'Aguardando aprovação', color: '#FACC15' },
  blocked: { label: 'Bloqueada', color: '#FB923C' },
  done: { label: 'Concluída', color: '#4ADE80' },
  failed: { label: 'Com erro', color: '#F87171' },
  cancelled: { label: 'Cancelada', color: '#6B7280' },
}

export const DEPT_COLOR: Record<DepartmentId, string> = {
  reception: '#5CC3DD',
  executive: '#E2E8F0',
  management: '#2A86C2',
  commercial: '#1E55B0',
  marketing: '#38BDF8',
  seo: '#67E8F9',
  finance: '#17468F',
  operations: '#0EA5E9',
  customer: '#22D3EE',
  supply: '#3B82F6',
  legal: '#64748B',
  hr: '#818CF8',
  intelligence: '#06B6D4',
  technology: '#0F2F72',
  pmo: '#9DB3D6',
  quality: '#94A3B8',
  meeting: '#818CF8',
  lounge: '#9DB3D6',
}

export const BRAND = {
  navy: 0x071634,
  navy2: 0x0f2f72,
  blue: 0x17468f,
  blue2: 0x1e55b0,
  cyan: 0x5cc3dd,
  graphite: 0x2b2f36,
  graphite2: 0x3a3f47,
  white: 0xf2f6fb,
}

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return '—'
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000)
  if (s < 5) return 'agora'
  if (s < 60) return `há ${s} s`
  if (s < 3600) return `há ${Math.round(s / 60)} min`
  if (s < 86400) return `há ${Math.round(s / 3600)} h`
  return new Date(iso).toLocaleString('pt-BR')
}
