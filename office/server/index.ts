import fs from 'node:fs'
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import path from 'node:path'
import { audit, readAudit } from './audit'
import { authenticate, hasRole, type Principal } from './auth'
import { parseCommand } from './commands'
import { config } from './config'
import { OfficeEngine, type Patch } from './office/engine'
import { Roster } from './office/roster'
import { DemoSource } from './sources/demo'
import { HermesSource } from './sources/hermes'
import { RufloSource } from './sources/ruflo'
import type { Source } from './sources/types'
import { RateLimiter } from './ratelimit'
import type { OfficeEvent, Role } from '../shared/types'

// API de estado do escritório. Interface de visualização e controle: a execução
// real continua no Ruflo/Hermes. Este processo nunca expõe as portas internas
// deles e só aceita comandos de uma lista fechada e validada.

export function buildSources(names: string[]): Source[] {
  if (names.includes('demo') && names.length > 1) {
    throw new Error('OFFICE_SOURCES: "demo" não pode ser combinado com fontes reais')
  }
  return names.map((n) => {
    if (n === 'ruflo') return new RufloSource()
    if (n === 'hermes') return new HermesSource()
    if (n === 'demo') return new DemoSource()
    throw new Error(`Fonte desconhecida: ${n}`)
  })
}

export function createServer(engine: OfficeEngine): http.Server {
  const reqLimiter = new RateLimiter(config.limits.requestsPerMinute)
  const cmdLimiter = new RateLimiter(config.limits.commandsPerMinute)
  const sseClients = new Set<ServerResponse>()

  engine.subscribe({
    onEvent(e: OfficeEvent) {
      for (const res of sseClients) send(res, 'office-event', e, e.seq)
    },
    onPatch(p: Patch) {
      for (const res of sseClients) send(res, 'patch', p, p.seq)
    },
  })
  // Mantém proxies e balanceadores sem derrubar a conexão SSE ociosa.
  setInterval(() => {
    for (const res of sseClients) res.write(': ping\n\n')
  }, 15_000).unref()

  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://local')
    const ip = req.socket.remoteAddress ?? '?'
    secureHeaders(res)
    try {
      if (!url.pathname.startsWith('/api/')) return serveStatic(url, res)
      if (url.pathname === '/api/health') return json(res, 200, { ok: true, sources: engine.sourceHealth() })
      if (!reqLimiter.allow(ip)) return json(res, 429, { error: 'Muitas requisições' })

      const who = authenticate(req, url)
      if (!who) return json(res, 401, { error: 'Não autenticado' })
      const need = (role: Role) => {
        if (hasRole(who, role)) return true
        json(res, 403, { error: `Requer papel ${role}` })
        return false
      }

      if (req.method === 'GET' && url.pathname === '/api/office/me') return json(res, 200, who)
      if (req.method === 'GET' && url.pathname === '/api/office/state') return json(res, 200, engine.snapshot())

      if (req.method === 'GET' && url.pathname === '/api/office/events') {
        if (sseClients.size >= config.limits.maxSseClients) return json(res, 503, { error: 'Limite de conexões em tempo real atingido' })
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
        res.write('retry: 3000\n\n')
        const last = Number(req.headers['last-event-id'] ?? url.searchParams.get('since') ?? NaN)
        // Recuperação: sempre manda o estado completo; e repete os eventos perdidos
        // para o feed de atividade, quando ainda estão no buffer.
        const missed = Number.isFinite(last) ? engine.eventsSince(last) : null
        send(res, 'snapshot', engine.snapshot(), engine.snapshot().seq)
        if (missed) for (const e of missed) send(res, 'replay', e, e.seq)
        sseClients.add(res)
        req.on('close', () => sseClients.delete(res))
        return
      }

      const agentMatch = url.pathname.match(/^\/api\/office\/agents\/(.+)$/)
      if (req.method === 'GET' && agentMatch) {
        const d = engine.agentDetail(decodeURIComponent(agentMatch[1]))
        return d ? json(res, 200, d) : json(res, 404, { error: 'Agente não encontrado' })
      }

      const taskMatch = url.pathname.match(/^\/api\/office\/tasks\/(.+)$/)
      if (req.method === 'GET' && taskMatch) {
        const k = decodeURIComponent(taskMatch[1])
        const t = engine.task(k)
        if (!t) return json(res, 404, { error: 'Tarefa não encontrada' })
        const children = engine.snapshot().tasks.filter((x) => x.parentKey === k)
        return json(res, 200, { task: t, events: engine.taskEvents(k), children })
      }

      if (req.method === 'GET' && url.pathname === '/api/office/audit') {
        if (!need('admin')) return
        return json(res, 200, readAudit(Number(url.searchParams.get('limit') ?? 200)))
      }

      if (req.method === 'POST' && url.pathname === '/api/office/commands') {
        if (!need('operator')) return
        if (!cmdLimiter.allow(who.label + ip)) return json(res, 429, { error: 'Limite de comandos por minuto atingido' })
        const body = await readBody(req, 16_384)
        return handleCommand(engine, who, ip, body, res)
      }

      return json(res, 404, { error: 'Rota não encontrada' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return json(res, 500, { error: 'Erro interno', detail: msg.slice(0, 200) })
    }
  })
}

async function handleCommand(engine: OfficeEngine, who: Principal, ip: string, body: string, res: ServerResponse): Promise<void> {
  let raw: unknown
  try {
    raw = JSON.parse(body)
  } catch {
    audit({ actor: who.label, role: who.role, ip, action: 'invalid', ok: false, detail: 'JSON inválido' })
    return json(res, 400, { error: 'JSON inválido' })
  }
  const parsed = parseCommand(raw)
  if (!parsed.ok) {
    audit({ actor: who.label, role: who.role, ip, action: 'invalid', ok: false, detail: parsed.error })
    return json(res, 400, { error: parsed.error })
  }
  const cmd = parsed.command
  try {
    if (cmd.type === 'order_ceo') {
      const ceo = engine.ceo()
      if (!ceo) throw new Error('Nenhum agente CEO ativo foi encontrado nas fontes conectadas')
      const src = engine.source(ceo.source)!
      const id = await src.orderCeo(ceo.id, cmd.text, cmd.priority ?? 'normal', who.label)
      const taskKey = `${ceo.source}:${id}`
      engine.recordCommand(`${who.label} enviou uma ordem ao CEO (${ceo.name})`, taskKey)
      audit({ actor: who.label, role: who.role, ip, action: cmd.type, ok: true, detail: { taskKey, ceo: ceo.key, length: cmd.text.length } })
      await engine.poll()
      return json(res, 200, { ok: true, taskKey })
    }

    const task = engine.task(cmd.taskKey)
    if (!task) throw new Error('Tarefa não encontrada')
    const src = engine.source(task.source)!
    const caps = src.capabilities
    if (cmd.type === 'cancel_task') {
      if (!caps.cancel) throw new Error('Fonte não suporta cancelamento')
      await src.cancel(task.id, who.label)
    } else if (cmd.type === 'retry_task') {
      if (!caps.retry) throw new Error('Fonte não suporta repetir tarefa')
      await src.retry(task.id, who.label)
    } else if (cmd.type === 'approve_task') {
      if (!caps.approve) throw new Error('Fonte não suporta aprovação')
      if (task.status !== 'awaiting_approval' && task.status !== 'blocked') throw new Error('A tarefa não está aguardando aprovação')
      await src.approve(task.id, cmd.note ?? '', who.label)
    } else if (cmd.type === 'intervene') {
      if (!caps.intervene) throw new Error('Fonte não suporta intervenção')
      await src.intervene(task.id, cmd.note, who.label)
    }
    engine.recordCommand(`${who.label}: ${cmd.type} em "${task.title.slice(0, 60)}"`, task.key)
    audit({ actor: who.label, role: who.role, ip, action: cmd.type, ok: true, detail: { taskKey: task.key } })
    await engine.poll()
    return json(res, 200, { ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    audit({ actor: who.label, role: who.role, ip, action: cmd.type, ok: false, detail: msg.slice(0, 300) })
    return json(res, 422, { error: msg.slice(0, 300) })
  }
}

/* ----------------------------------------------------------------- helpers -- */

function send(res: ServerResponse, event: string, data: unknown, id: number): void {
  res.write(`id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

function secureHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self'; script-src 'self'")
}

function readBody(req: IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > max) {
        reject(new Error('Corpo da requisição muito grande'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function serveStatic(url: URL, res: ServerResponse): void {
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
  const file = path.resolve(config.staticDir, rel)
  if (!file.startsWith(config.staticDir)) return json(res, 403, { error: 'Proibido' })
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(config.staticDir, 'index.html')
  if (!fs.existsSync(target)) return json(res, 404, { error: 'Frontend não compilado. Rode npm run build.' })
  res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': target.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' })
  fs.createReadStream(target).pipe(res)
}

/* -------------------------------------------------------------------- main -- */

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  if (!config.tokens.size && !config.allowLocalViewer) {
    console.error('Defina OFFICE_TOKENS (ex.: "admin:<token>,operator:<token>,viewer:<token>", tokens com 16+ caracteres).')
    process.exit(1)
  }
  const engine = new OfficeEngine(buildSources(config.sources), new Roster(config.dataDir), {
    pollMs: config.pollMs,
    eventBuffer: config.limits.eventBuffer,
  })
  await engine.start()
  createServer(engine).listen(config.port, config.host, () => {
    console.log(`Escritório Inter-Cool em http://${config.host}:${config.port} — fontes: ${config.sources.join(', ')} (${engine.mode})`)
  })
  const shutdown = async () => {
    await engine.stop()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
