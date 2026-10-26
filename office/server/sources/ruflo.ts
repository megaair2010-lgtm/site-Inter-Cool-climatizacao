import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { config } from '../config'
import { iso, type RawAgent, type RawTask, type Source, type SourceRead } from './types'

// Adaptador Ruflo. Fala com o servidor MCP oficial do Ruflo por stdio (`ruflo mcp start`)
// e usa apenas ferramentas documentadas: agent_list, task_list, task_status,
// task_create, task_update, task_cancel, task_retry.
//
// O Ruflo 3.61 não emite eventos; o motor do escritório gera os eventos comparando
// leituras sucessivas. `agent_logs` é sintético na 3.61 (ruvnet/ruflo#1916), então não
// é usado como histórico.
//
// Convenção de delegação (ver docs/INTEGRACAO.md): quando um agente cria uma subtarefa,
// ele passa tags `parent:<taskId>` e `from:<agentId>`. Reuniões usam `kind:meeting`.
// Bloqueios e aprovações são informados por task_update com
// result = { officeState: 'blocked' | 'awaiting_approval' | 'review', reason }.

const TASK_STATUS: Record<string, RawTask['status']> = {
  pending: 'queued',
  queued: 'queued',
  in_progress: 'running',
  running: 'running',
  completed: 'done',
  done: 'done',
  failed: 'failed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
}

interface ListedTask {
  taskId: string
  type: string
  description: string
  status: string
  progress?: number
  priority?: string
  assignedTo?: string[]
  createdAt: string
}

interface TaskDetail extends ListedTask {
  tags?: string[]
  startedAt?: string
  completedAt?: string
  result?: unknown
}

function tag(tags: string[] | undefined, prefix: string): string | null {
  const t = tags?.find((x) => x.startsWith(prefix + ':'))
  return t ? t.slice(prefix.length + 1) : null
}

export class RufloSource implements Source {
  name = 'ruflo' as const
  capabilities = { order: true, cancel: true, retry: true, approve: true, intervene: true }
  private client: Client | null = null
  private connecting: Promise<Client> | null = null
  private details = new Map<string, { sig: string; detail: TaskDetail }>()

  async start(): Promise<void> {
    await this.connect()
  }

  async stop(): Promise<void> {
    await this.client?.close().catch(() => {})
    this.client = null
  }

  private async connect(): Promise<Client> {
    if (this.client) return this.client
    if (this.connecting) return this.connecting
    this.connecting = (async () => {
      const transport = new StdioClientTransport({
        command: config.ruflo.command,
        args: config.ruflo.args,
        cwd: config.ruflo.cwd,
        stderr: 'ignore',
        env: { ...process.env, CLAUDE_FLOW_MCP_QUIET: '1' } as Record<string, string>,
      })
      const client = new Client({ name: 'inter-cool-office', version: '0.1.0' })
      transport.onclose = () => {
        this.client = null
      }
      await client.connect(transport)
      this.client = client
      return client
    })().finally(() => {
      this.connecting = null
    })
    return this.connecting
  }

  private async call<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const client = await this.connect()
    const res = (await client.callTool({ name, arguments: args }, undefined, { timeout: 15_000 })) as {
      content?: { type: string; text?: string }[]
      isError?: boolean
    }
    const text = res.content?.find((c) => c.type === 'text')?.text ?? ''
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(`${name}: resposta não-JSON do Ruflo: ${text.slice(0, 200)}`)
    }
    if (res.isError || (parsed as { success?: boolean }).success === false) {
      const err = (parsed as { error?: string }).error ?? text.slice(0, 200)
      throw new Error(`${name}: ${err}`)
    }
    return parsed as T
  }

  async read(): Promise<SourceRead> {
    const [agentsRes, tasksRes] = await Promise.all([
      this.call<{ agents: { agentId: string; agentType: string; name?: string; status: string; domain?: string }[] }>('agent_list', {}),
      this.call<{ tasks: ListedTask[] }>('task_list', { limit: config.limits.maxTasks }),
    ])

    const agents: RawAgent[] = agentsRes.agents
      .filter((a) => a.status !== 'terminated')
      .map((a) => ({ id: a.agentId, name: a.name || a.agentId, type: a.agentType, status: a.status, description: a.domain }))

    // task_list não traz tags/resultado; task_status traz. Busca detalhe de tarefas novas,
    // alteradas, ou ainda ativas (o resultado pode mudar sem mudar o status).
    const seen = new Set<string>()
    const tasks: RawTask[] = []
    for (const t of tasksRes.tasks) {
      seen.add(t.taskId)
      const sig = `${t.status}|${t.progress ?? ''}|${(t.assignedTo ?? []).join(',')}`
      const cached = this.details.get(t.taskId)
      const active = t.status === 'pending' || t.status === 'in_progress'
      let detail = cached?.detail
      if (!cached || cached.sig !== sig || active) {
        detail = await this.call<TaskDetail>('task_status', { taskId: t.taskId }).catch(() => ({ ...t }))
        this.details.set(t.taskId, { sig, detail })
      }
      tasks.push(this.normalize({ ...t, ...detail! }))
    }
    for (const id of this.details.keys()) if (!seen.has(id)) this.details.delete(id)
    return { agents, tasks }
  }

  private normalize(t: TaskDetail): RawTask {
    let status = TASK_STATUS[t.status] ?? 'queued'
    const result = (t.result ?? null) as Record<string, unknown> | null
    const officeState = result && typeof result === 'object' ? (result.officeState as string | undefined) : undefined
    let reason: string | null = null
    if ((status === 'queued' || status === 'running') && officeState) {
      if (officeState === 'blocked' || officeState === 'awaiting_approval' || officeState === 'review') {
        status = officeState
        reason = typeof result?.reason === 'string' ? result.reason : null
      }
    }
    const isFailure = status === 'failed'
    return {
      id: t.taskId,
      title: t.description,
      type: t.type,
      status,
      rawStatus: t.status,
      progress: typeof t.progress === 'number' ? t.progress : null,
      assignees: t.assignedTo ?? [],
      parentId: tag(t.tags, 'parent'),
      fromAgentId: tag(t.tags, 'from'),
      kind: tag(t.tags, 'kind') === 'meeting' ? 'meeting' : 'task',
      createdAt: iso(t.createdAt) ?? new Date(0).toISOString(),
      startedAt: iso(t.startedAt),
      completedAt: iso(t.completedAt),
      result: isFailure ? null : result,
      error: isFailure ? (result?.error ?? result) : null,
      reason,
    }
  }

  async orderCeo(ceoAgentId: string, text: string, priority: string, actor: string): Promise<string> {
    const res = await this.call<{ taskId: string }>('task_create', {
      type: 'directive',
      description: text,
      priority,
      assignTo: [ceoAgentId],
      tags: ['origin:office', `requested-by:${actor}`],
    })
    return res.taskId
  }

  async cancel(taskId: string): Promise<void> {
    await this.call('task_cancel', { taskId })
  }

  async retry(taskId: string): Promise<void> {
    await this.call('task_retry', { taskId })
  }

  async approve(taskId: string, note: string, actor: string): Promise<void> {
    await this.call('task_update', {
      taskId,
      status: 'in_progress',
      result: { officeState: 'approved', approvedBy: actor, note: note || null, at: new Date().toISOString() },
    })
  }

  async intervene(taskId: string, note: string, actor: string): Promise<void> {
    // O Ruflo 3.61 não tem canal de mensagem para uma tarefa em execução. A intervenção
    // fica registrada no resultado da tarefa, onde o runtime do agente a lê.
    const cur = await this.call<TaskDetail>('task_status', { taskId })
    const prev = (cur.result && typeof cur.result === 'object' ? cur.result : {}) as Record<string, unknown>
    const interventions = Array.isArray(prev.interventions) ? prev.interventions : []
    await this.call('task_update', {
      taskId,
      result: { ...prev, interventions: [...interventions, { by: actor, note, at: new Date().toISOString() }] },
    })
  }
}
