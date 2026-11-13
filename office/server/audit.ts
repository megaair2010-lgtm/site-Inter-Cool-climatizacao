import fs from 'node:fs'
import path from 'node:path'
import { config } from './config'

// Registro de auditoria append-only (JSON Lines). Cada comando, aceito ou recusado,
// fica registrado com quem pediu, quando, e o resultado.

const file = () => path.join(config.dataDir, 'audit.log.jsonl')

export function audit(entry: {
  actor: string
  role: string
  ip: string
  action: string
  ok: boolean
  detail?: unknown
}): void {
  fs.mkdirSync(config.dataDir, { recursive: true })
  const line = JSON.stringify({ at: new Date().toISOString(), ...entry })
  fs.appendFileSync(file(), line + '\n')
}

export function readAudit(limit = 200): unknown[] {
  try {
    const lines = fs.readFileSync(file(), 'utf8').trim().split('\n')
    return lines.slice(-limit).map((l) => JSON.parse(l)).reverse()
  } catch {
    return []
  }
}
