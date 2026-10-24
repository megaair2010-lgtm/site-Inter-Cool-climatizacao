import type { IncomingMessage } from 'node:http'
import crypto from 'node:crypto'
import { config } from './config'
import type { Role } from '../shared/types'

export interface Principal {
  role: Role
  label: string
}

const RANK: Record<Role, number> = { viewer: 1, operator: 2, admin: 3 }

export function hasRole(p: Principal | null, needed: Role): boolean {
  return !!p && RANK[p.role] >= RANK[needed]
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

function tokenFrom(req: IncomingMessage, url: URL): string | null {
  const h = req.headers.authorization
  if (h?.startsWith('Bearer ')) return h.slice(7).trim()
  const cookie = req.headers.cookie ?? ''
  const m = cookie.match(/(?:^|;\s*)office_token=([^;]+)/)
  if (m) return decodeURIComponent(m[1])
  // EventSource não envia cabeçalhos: aceita ?token= apenas no stream SSE.
  if (url.pathname === '/api/office/events') return url.searchParams.get('token')
  return null
}

export function authenticate(req: IncomingMessage, url: URL): Principal | null {
  const token = tokenFrom(req, url)
  if (token) {
    for (const [t, p] of config.tokens) if (safeEqual(t, token)) return p
    return null
  }
  const ip = req.socket.remoteAddress ?? ''
  if (config.allowLocalViewer && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1')) {
    return { role: 'viewer', label: 'local' }
  }
  return null
}
