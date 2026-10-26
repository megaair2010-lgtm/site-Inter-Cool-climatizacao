/**
 * Registra no Ruflo os agentes ativos de agents/hierarquia.json (agent_spawn) e grava as
 * definições de departamento/papel em OFFICE_DATA_DIR/agents.json para o escritório.
 *
 * Idempotente: agentes que já existem no Ruflo (mesmo id) não são recriados.
 * Uso:  npm run seed:agents [-- --todos] [-- --dry-run]
 * Usa as mesmas variáveis do servidor: RUFLO_CWD, RUFLO_COMMAND, RUFLO_ARGS, OFFICE_DATA_DIR.
 */
import fs from 'node:fs'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { config } from '../server/config'
import type { RosterOverride } from '../server/office/roster'

interface AgentDef {
  id: string
  nome: string
  papel: string
  departamento: RosterOverride['department']
  tipoRuflo: string
  ativo: boolean
  responde_a: string
  diretoria?: string
}

const args = new Set(process.argv.slice(2))
const all = args.has('--todos')
const dry = args.has('--dry-run')
const file = path.resolve(import.meta.dirname, '../agents/hierarquia.json')
const defs: AgentDef[] = JSON.parse(fs.readFileSync(file, 'utf8')).agentes
const wanted = defs.filter((d) => all || d.ativo)

const client = new Client({ name: 'inter-cool-seed', version: '0.1.0' })
await client.connect(new StdioClientTransport({ command: config.ruflo.command, args: config.ruflo.args, cwd: config.ruflo.cwd, stderr: 'ignore' }))
const call = async (name: string, a: Record<string, unknown>) => {
  const r = (await client.callTool({ name, arguments: a })) as { content: { text: string }[] }
  const out = JSON.parse(r.content[0].text)
  if (out.success === false) throw new Error(`${name}: ${out.error ?? JSON.stringify(out)}`)
  return out
}

const existing = new Set<string>(
  ((await call('agent_list', {})).agents as { agentId: string; status: string }[]).filter((a) => a.status !== 'terminated').map((a) => a.agentId),
)
let created = 0
for (const d of wanted) {
  if (existing.has(d.id)) continue
  console.log(`${dry ? '[simulação] ' : ''}registrando ${d.id} — ${d.nome}`)
  if (!dry) await call('agent_spawn', { agentType: d.tipoRuflo, agentId: d.id, name: d.nome, domain: d.departamento })
  created++
}

// Definições para o escritório: departamento e papel vêm do catálogo, não de adivinhação pelo nome.
const ovFile = path.join(config.dataDir, 'agents.json')
let overrides: Record<string, RosterOverride> = {}
try { overrides = JSON.parse(fs.readFileSync(ovFile, 'utf8')) } catch {}
for (const d of defs) {
  overrides[`ruflo:${d.id}`] = { department: d.departamento, role: d.papel === 'specialist' ? d.departamento : d.papel, title: d.diretoria && d.papel !== 'director' ? `${d.nome} · ${d.diretoria.slice(3)}` : d.nome }
}
if (!dry) {
  fs.mkdirSync(config.dataDir, { recursive: true })
  fs.writeFileSync(ovFile, JSON.stringify(overrides, null, 2))
}
console.log(`${created} agente(s) ${dry ? 'seriam registrados' : 'registrados'}; ${wanted.length - created} já existiam. Definições em ${ovFile}.`)
await client.close()
