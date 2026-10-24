import type { OfficeCommand } from '../shared/types'

// Validação estrita dos comandos aceitos pela tela. Qualquer coisa fora desta lista
// é recusada: a interface não executa comandos arbitrários no servidor.

const KEY_RE = /^(ruflo|hermes|demo):[A-Za-z0-9_.-]{1,128}$/
const PRIORITIES = new Set(['low', 'normal', 'high', 'critical'])

function text(v: unknown, field: string, min: number, max: number): string {
  if (typeof v !== 'string') throw new Error(`${field} deve ser texto`)
  const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
  if (s.length < min) throw new Error(`${field} muito curto`)
  if (s.length > max) throw new Error(`${field} excede ${max} caracteres`)
  return s
}

function taskKey(v: unknown): string {
  if (typeof v !== 'string' || !KEY_RE.test(v)) throw new Error('taskKey inválida')
  return v
}

export function parseCommand(raw: unknown): { ok: true; command: OfficeCommand } | { ok: false; error: string } {
  try {
    if (!raw || typeof raw !== 'object') throw new Error('Comando ausente')
    const r = raw as Record<string, unknown>
    const allowed = (keys: string[]) => {
      for (const k of Object.keys(r)) if (!keys.includes(k)) throw new Error(`Campo não permitido: ${k}`)
    }
    switch (r.type) {
      case 'order_ceo': {
        allowed(['type', 'text', 'priority'])
        const priority = r.priority === undefined ? undefined : String(r.priority)
        if (priority && !PRIORITIES.has(priority)) throw new Error('Prioridade inválida')
        return { ok: true, command: { type: 'order_ceo', text: text(r.text, 'text', 3, 2000), priority: priority as never } }
      }
      case 'cancel_task':
      case 'retry_task':
        allowed(['type', 'taskKey'])
        return { ok: true, command: { type: r.type, taskKey: taskKey(r.taskKey) } }
      case 'approve_task':
        allowed(['type', 'taskKey', 'note'])
        return { ok: true, command: { type: 'approve_task', taskKey: taskKey(r.taskKey), note: r.note === undefined ? undefined : text(r.note, 'note', 0, 1000) } }
      case 'intervene':
        allowed(['type', 'taskKey', 'note'])
        return { ok: true, command: { type: 'intervene', taskKey: taskKey(r.taskKey), note: text(r.note, 'note', 3, 1000) } }
      default:
        throw new Error('Tipo de comando não suportado')
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
