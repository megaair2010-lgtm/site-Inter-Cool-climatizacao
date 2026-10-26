import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { config } from '../config'
import { iso, type RawAgent, type RawTask, type Source, type SourceRead } from './types'

// Adaptador Hermes Agent (NousResearch). Usa só o CLI oficial `hermes`, com os mesmos
// verbos que o Hermes Virtual Office (MIT) usa em produção:
//   kanban list --json · kanban show <id> --json · kanban assignees --json
//   kanban create <título> --assignee <perfil> · kanban unblock · kanban comment
// e lê a lista de perfis em $HERMES_HOME/profiles (somente leitura).
// Sem Hermes instalado nesta máquina, este adaptador não foi testado ao vivo.

const run = promisify(execFile)

const STATUS: Record<string, RawTask['status']> = {
  triage: 'queued',
  todo: 'queued',
  queued: 'queued',
  ready: 'queued',
  running: 'running',
  working: 'running',
  review: 'review',
  blocked: 'blocked',
  done: 'done',
  failed: 'failed',
  fail: 'failed',
  cancelled: 'cancelled',
}

interface HermesTask {
  id: string
  title: string
  body?: string | null
  assignee?: string | null
  status: string
  created_by?: string | null
  created_at?: number | null
  updated_at?: number | null
  completed_at?: number | null
}

export class HermesSource implements Source {
  name = 'hermes' as const
  capabilities = { order: true, cancel: false, retry: false, approve: true, intervene: true }
  private parents = new Map<string, string | null>()

  private async hermes(args: string[]): Promise<string> {
    const full = config.hermes.board && args[0] === 'kanban' ? ['kanban', '--board', config.hermes.board, ...args.slice(1)] : args
    const { stdout } = await run(config.hermes.bin, full, { timeout: 20_000, maxBuffer: 8 * 1024 * 1024 })
    return stdout
  }

  private async json<T>(args: string[]): Promise<T> {
    return JSON.parse(await this.hermes([...args, '--json'])) as T
  }

  async start(): Promise<void> {
    await this.hermes(['--version'])
  }

  async stop(): Promise<void> {}

  private profiles(): string[] {
    const home = config.hermes.home || path.join(os.homedir(), '.hermes')
    try {
      return fs.readdirSync(path.join(home, 'profiles'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    } catch {
      return []
    }
  }

  async read(): Promise<SourceRead> {
    const [rows, assignees] = await Promise.all([
      this.json<HermesTask[]>(['kanban', 'list']),
      this.json<{ name: string; counts?: Record<string, number> }[]>(['kanban', 'assignees']).catch(() => []),
    ])
    const names = new Set<string>([...this.profiles(), ...assignees.map((a) => a.name)])
    const tasks: RawTask[] = []
    for (const r of rows) {
      if (r.status === 'archived') continue
      const status = STATUS[r.status] ?? 'queued'
      if (!this.parents.has(r.id) && status !== 'done' && status !== 'failed') {
        const shown = await this.json<{ parents?: string[] }>(['kanban', 'show', r.id]).catch(() => ({ parents: [] as string[] }))
        this.parents.set(r.id, shown.parents?.[0] ?? null)
      }
      const createdBy = r.created_by ?? ''
      const from = createdBy.startsWith('agent:') ? createdBy.slice(6) : names.has(createdBy) ? createdBy : null
      if (r.assignee) names.add(r.assignee)
      tasks.push({
        id: r.id,
        title: r.title,
        type: 'kanban',
        status,
        rawStatus: r.status,
        progress: null,
        assignees: r.assignee ? [r.assignee] : [],
        parentId: this.parents.get(r.id) ?? null,
        fromAgentId: from,
        kind: createdBy.startsWith('meeting:') ? 'meeting' : 'task',
        createdAt: iso(r.created_at) ?? new Date(0).toISOString(),
        startedAt: status === 'running' ? iso(r.updated_at) : null,
        completedAt: iso(r.completed_at),
        result: status === 'done' ? r.body ?? null : null,
        error: status === 'failed' ? r.body ?? 'falhou' : null,
        reason: status === 'blocked' ? r.body ?? null : null,
      })
    }
    const agents: RawAgent[] = [...names].map((n) => ({ id: n, name: n, type: 'hermes-profile', status: 'registered' }))
    return { agents, tasks }
  }

  async orderCeo(ceoAgentId: string, text: string, _priority: string, actor: string): Promise<string> {
    const title = text.length > 120 ? text.slice(0, 117) + '…' : text
    const out = await this.hermes(['kanban', 'create', title, '--assignee', ceoAgentId, '--body', text, '--created-by', `office:${actor}`])
    const m = out.match(/t_[0-9a-f]{8}/)
    if (!m) throw new Error('Hermes não retornou o id da tarefa criada')
    return m[0]
  }

  async cancel(): Promise<void> {
    throw new Error('Cancelamento não suportado pelo adaptador Hermes')
  }

  async retry(): Promise<void> {
    throw new Error('Repetição não suportada pelo adaptador Hermes')
  }

  async approve(taskId: string, note: string, actor: string): Promise<void> {
    await this.hermes(['kanban', 'unblock', taskId, '--reason', note || `aprovado por ${actor} no escritório`])
  }

  async intervene(taskId: string, note: string): Promise<void> {
    await this.hermes(['kanban', 'comment', taskId, note])
  }
}
