import path from 'node:path'
import type { Role, SourceName } from '../shared/types'

// Toda configuração vem de variáveis de ambiente. Nada de segredo no código.

function list(v: string | undefined): string[] {
  return (v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

/** OFFICE_TOKENS="admin:<token>,operator:<token>,viewer:<token>" */
function parseTokens(v: string | undefined): Map<string, { role: Role; label: string }> {
  const map = new Map<string, { role: Role; label: string }>()
  for (const entry of list(v)) {
    const [role, token, label] = entry.split(':')
    if (!token || token.length < 16) continue
    if (role !== 'viewer' && role !== 'operator' && role !== 'admin') continue
    map.set(token, { role, label: label || role })
  }
  return map
}

const root = process.cwd()

export const config = {
  host: process.env.OFFICE_HOST || '127.0.0.1',
  port: Number(process.env.OFFICE_PORT || 4310),
  /** Fontes ativas. "demo" nunca é combinada com fontes reais. */
  sources: list(process.env.OFFICE_SOURCES || 'ruflo') as SourceName[],
  pollMs: Math.max(500, Number(process.env.OFFICE_POLL_MS || 2000)),
  dataDir: path.resolve(process.env.OFFICE_DATA_DIR || path.join(root, 'data')),
  staticDir: path.resolve(process.env.OFFICE_STATIC_DIR || path.join(root, 'dist')),
  tokens: parseTokens(process.env.OFFICE_TOKENS),
  /** Só para desenvolvimento local: sem tokens, todo acesso vindo de 127.0.0.1 é viewer. */
  allowLocalViewer: process.env.OFFICE_ALLOW_LOCAL_VIEWER === '1',
  ruflo: {
    /** Diretório do projeto Ruflo (onde está .claude-flow/). */
    cwd: path.resolve(process.env.RUFLO_CWD || root),
    /** Comando que inicia o servidor MCP oficial por stdio. */
    command: process.env.RUFLO_COMMAND || 'npx',
    args: list(process.env.RUFLO_ARGS || 'ruflo,mcp,start'),
  },
  hermes: {
    bin: process.env.HERMES_BIN || 'hermes',
    board: process.env.HERMES_BOARD || '',
    home: process.env.HERMES_HOME || '',
  },
  limits: {
    maxSseClients: Number(process.env.OFFICE_MAX_SSE || 50),
    commandsPerMinute: Number(process.env.OFFICE_COMMANDS_PER_MIN || 20),
    requestsPerMinute: Number(process.env.OFFICE_REQUESTS_PER_MIN || 600),
    maxTasks: 500,
    eventBuffer: 2000,
  },
}
