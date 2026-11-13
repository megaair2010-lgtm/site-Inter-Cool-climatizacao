import type { RawAgent, RawTask, Source, SourceRead } from './types'

// Fonte de DEMONSTRAÇÃO. Só é usada com OFFICE_SOURCES=demo e nunca junto com fontes
// reais. A interface mostra uma faixa "DADOS SIMULADOS" sempre que ela está ativa.
// Serve para avaliar o visual sem um Ruflo rodando; não representa trabalho real.

const ROSTER: [string, string, string][] = [
  ['ceo', 'Helena (demo)', 'ceo'],
  ['gm', 'Rafael (demo)', 'gerente-geral'],
  ['cmo', 'Marina (demo)', 'diretor-de-marketing'],
  ['seo', 'Tiago (demo)', 'especialista-seo-local'],
  ['sdr', 'Bruna (demo)', 'sdr'],
  ['ae', 'Caio (demo)', 'preparador-de-propostas'],
  ['cfo', 'Lúcia (demo)', 'diretor-financeiro'],
  ['fin', 'Paulo (demo)', 'analista-de-margens'],
  ['ops', 'Diego (demo)', 'planejador-de-servicos-hvac'],
  ['qa', 'Sofia (demo)', 'verificador-de-resultados'],
]

export class DemoSource implements Source {
  name = 'demo' as const
  capabilities = { order: true, cancel: true, retry: true, approve: true, intervene: true }
  private tasks = new Map<string, RawTask>()
  private n = 0
  private timer: NodeJS.Timeout | null = null

  async start(): Promise<void> {
    this.timer = setInterval(() => this.tick(), 3000)
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer)
  }

  async read(): Promise<SourceRead> {
    const agents: RawAgent[] = ROSTER.map(([id, name, type]) => ({ id, name, type, status: 'idle' }))
    return { agents, tasks: [...this.tasks.values()] }
  }

  private add(t: Partial<RawTask> & { title: string; assignees: string[] }): RawTask {
    const id = `demo-${++this.n}`
    const task: RawTask = {
      id, type: 'task', status: 'queued', rawStatus: 'pending', progress: 0, parentId: null, fromAgentId: null,
      kind: 'task', createdAt: new Date().toISOString(), startedAt: null, completedAt: null, result: null, error: null, reason: null,
      ...t,
    }
    this.tasks.set(id, task)
    return task
  }

  private tick(): void {
    const now = new Date().toISOString()
    for (const t of this.tasks.values()) {
      if (t.status === 'queued') {
        t.status = 'running'; t.rawStatus = 'in_progress'; t.startedAt = now
      } else if (t.status === 'running') {
        t.progress = Math.min(100, (t.progress ?? 0) + 20 + Math.round(Math.random() * 15))
        if (t.assignees[0] === 'ceo' && !t.parentId && (t.progress ?? 0) >= 30 && ![...this.tasks.values()].some((x) => x.parentId === t.id)) {
          this.add({ title: `Organizar execução: ${t.title}`, type: 'planning', assignees: ['gm'], parentId: t.id, fromAgentId: 'ceo' })
        }
        if (t.assignees[0] === 'gm' && (t.progress ?? 0) >= 40 && ![...this.tasks.values()].some((x) => x.parentId === t.id)) {
          this.add({ title: 'Pesquisar palavras-chave', type: 'research', assignees: ['seo'], parentId: t.id, fromAgentId: 'gm' })
          this.add({ title: 'Preparar proposta comercial', type: 'proposal', assignees: ['ae'], parentId: t.id, fromAgentId: 'gm' })
          this.add({ title: 'Analisar margem da campanha', type: 'analysis', assignees: ['fin'], parentId: t.id, fromAgentId: 'gm' })
        }
        if ((t.progress ?? 0) >= 100) {
          if (t.type === 'analysis' && Math.random() < 0.3) {
            t.status = 'awaiting_approval'; t.reason = 'Desconto acima de 10% exige aprovação'
          } else {
            t.status = 'done'; t.rawStatus = 'completed'; t.completedAt = now; t.result = { resumo: `Concluído: ${t.title}` }
          }
        }
      }
    }
    if (this.tasks.size > 60) {
      for (const [id, t] of this.tasks) if (t.status === 'done' && this.tasks.size > 40) this.tasks.delete(id)
    }
  }

  async orderCeo(ceoAgentId: string, text: string): Promise<string> {
    return this.add({ title: text, type: 'directive', assignees: [ceoAgentId] }).id
  }
  async cancel(taskId: string): Promise<void> {
    const t = this.tasks.get(taskId); if (t) { t.status = 'cancelled'; t.completedAt = new Date().toISOString() }
  }
  async retry(taskId: string): Promise<void> {
    const t = this.tasks.get(taskId); if (t) { t.status = 'queued'; t.progress = 0; t.error = null }
  }
  async approve(taskId: string): Promise<void> {
    const t = this.tasks.get(taskId); if (t) { t.status = 'done'; t.completedAt = new Date().toISOString(); t.reason = null }
  }
  async intervene(): Promise<void> {}
}
