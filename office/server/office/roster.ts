import fs from 'node:fs'
import path from 'node:path'
import { DESKS, type Desk } from '../../shared/layout'
import type { DepartmentId } from '../../shared/types'
import type { RawAgent } from '../sources/types'

// Mesa persistente por agente. A chave é o identificador real da fonte
// (`ruflo:agent-179...`), então renomear o agente não muda a mesa, e um agente
// removido libera a mesa só depois de RELEASE_AFTER_MS (evita "dança das cadeiras"
// quando a fonte oscila).

export interface Placement {
  deskId: string
  department: DepartmentId
  role: string
  title: string
  releasedAt?: string | null
}

export interface RosterOverride {
  department?: DepartmentId
  role?: string
  title?: string
  deskId?: string
}

const RELEASE_AFTER_MS = 24 * 60 * 60 * 1000

// Ordem importa: regras mais específicas (diretores) antes das genéricas.
const RULES: [RegExp, DepartmentId, string, string][] = [
  [/\b(ceo|chief executive|presidente|diretor geral|ceo executivo)\b/i, 'executive', 'ceo', 'CEO executivo de IA'],
  [/\b(gerente geral|general manager|gm|coo|gerente de opera[cç][oõ]es|queen|hierarchical coordinator|task orchestrator)\b/i, 'management', 'manager', 'Gerente-geral de operações'],
  [/\bdiretor comercial\b|\bcso\b/i, 'commercial', 'director', 'Diretor comercial'],
  [/\bdiretor de marketing\b|\bdiretor marketing\b|\bcmo\b/i, 'marketing', 'director', 'Diretor de marketing'],
  [/\bdiretor financeiro\b|\bcfo\b/i, 'finance', 'director', 'Diretor financeiro'],
  [/\bdiretor de opera[cç][oõ]es\b/i, 'operations', 'director', 'Diretor de operações'],
  [/\bdiretor de relacionamento\b/i, 'customer', 'director', 'Diretor de relacionamento'],
  [/\bdiretor de suprimentos\b/i, 'supply', 'director', 'Diretor de suprimentos'],
  [/\bdiretor administrativo\b/i, 'legal', 'director', 'Diretor administrativo'],
  [/\bgestor de capacidade\b|\bdiretor de rh\b/i, 'hr', 'director', 'Gestor de capacidade operacional'],
  [/\bpesquisador de mercado\b|\bdiretor de intelig[eê]ncia\b/i, 'intelligence', 'director', 'Líder de inteligência de mercado'],
  [/\bdiretor de tecnologia\b|\bcto\b/i, 'technology', 'director', 'Diretor de tecnologia'],
  [/\bdiretor de projetos\b/i, 'pmo', 'director', 'Diretor de projetos'],
  [/\bdiretor de qualidade\b/i, 'quality', 'director', 'Diretor de qualidade'],
  [/\bseo\b|conte[uú]do|content|redator|copywriter|palavras chave|keyword|blog/i, 'seo', 'seo', 'SEO e conteúdo'],
  [/marketing|growth|ads|campanha|social|redes sociais|designer|landing|reputa[cç][aã]o/i, 'marketing', 'marketing', 'Marketing e growth'],
  [/\bsdr\b|prospec|vend|sales|comercial|closer|proposta|negocia|pipeline|follow up|oportunidade/i, 'commercial', 'commercial', 'Comercial e vendas'],
  [/financ|fluxo de caixa|contas a (pagar|receber)|custo|pre[cç]o|margem|or[cç]amento e previs|inadimpl|controladoria/i, 'finance', 'finance', 'Financeiro e controladoria'],
  [/hvac|instala|manuten|ordens de servi|campo|engenharia|t[eé]cnic|cronograma de obra|vrf|chiller/i, 'operations', 'operations', 'Operações e engenharia HVAC'],
  [/atendimento|crm|agendament|satisfa|p[oó]s venda|reten|reclama|renova|support|suporte|sac/i, 'customer', 'customer', 'Atendimento e CRM'],
  [/suprimento|fornecedor|cota[cç]|compra|estoque|prazo de entrega|frete/i, 'supply', 'supply', 'Suprimentos'],
  [/jur[ií]dic|licita|edital|habilita|certid|document|contrat|administrativ|conformidade documental/i, 'legal', 'legal', 'Administrativo e licitações'],
  [/\brh\b|recursos humanos|aloca[cç][aã]o de agentes|desempenho|treinamento|carga de trabalho|cat[aá]logo de agentes|custos de execu/i, 'hr', 'hr', 'RH e gestão de agentes'],
  [/intelig[eê]ncia|mercado|concorr|researcher|pesquis|tend[eê]ncia|demanda regional/i, 'intelligence', 'intelligence', 'Inteligência de mercado'],
  [/tecnolog|software|integra[cç]|automa[cç]|banco de dados|dados|seguran[cç]a|observab|deploy|coder|architect|backend|frontend|devops/i, 'technology', 'technology', 'Tecnologia, dados e automação'],
  [/pmo|projeto|planej|planner|cronograma|depend[eê]ncia|produtividade|entregas/i, 'pmo', 'pmo', 'PMO — projetos'],
  [/qualidade|auditor|verifica|incidente|risco|integridade|revisor|reviewer|tester|teste/i, 'quality', 'quality', 'Qualidade, riscos e auditoria'],
  [/recep/i, 'reception', 'reception', 'Recepção'],
]

export function inferRole(a: RawAgent): { department: DepartmentId; role: string; title: string } {
  const hay = `${a.name} ${a.type} ${a.description ?? ''}`.replace(/[-_]/g, ' ')
  for (const [re, department, role, title] of RULES) if (re.test(hay)) return { department, role, title }
  return { department: 'pmo', role: a.type || 'agent', title: a.type ? `Agente ${a.type}` : 'Agente' }
}

export class Roster {
  private placements: Record<string, Placement> = {}
  private overrides: Record<string, RosterOverride> = {}
  private file: string
  private overridesFile: string

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true })
    this.file = path.join(dataDir, 'roster.json')
    this.overridesFile = path.join(dataDir, 'agents.json')
    try {
      this.placements = JSON.parse(fs.readFileSync(this.file, 'utf8'))
    } catch {
      this.placements = {}
    }
    this.reloadOverrides()
  }

  private overridesMtime = -1

  /** Relê agents.json quando o arquivo muda (o seed pode rodar com o servidor no ar). */
  reloadOverrides(): void {
    let mtime = 0
    try {
      mtime = fs.statSync(this.overridesFile).mtimeMs
    } catch {}
    if (mtime === this.overridesMtime) return
    this.overridesMtime = mtime
    try {
      this.overrides = JSON.parse(fs.readFileSync(this.overridesFile, 'utf8'))
    } catch {
      this.overrides = {}
    }
  }

  get(key: string): Placement | undefined {
    return this.placements[key]
  }

  /** Garante mesa para cada agente presente; marca ausentes para liberação futura. */
  sync(present: { key: string; raw: RawAgent }[]): boolean {
    this.reloadOverrides()
    let changed = false
    const now = Date.now()
    const presentKeys = new Set(present.map((p) => p.key))

    for (const [key, p] of Object.entries(this.placements)) {
      if (presentKeys.has(key)) {
        if (p.releasedAt) {
          p.releasedAt = null
          changed = true
        }
      } else if (!p.releasedAt) {
        p.releasedAt = new Date(now).toISOString()
        changed = true
      } else if (now - Date.parse(p.releasedAt) > RELEASE_AFTER_MS) {
        delete this.placements[key]
        changed = true
      }
    }

    // CEO e gerente primeiro, para ficarem com as mesas reservadas.
    const order = [...present].sort((a, b) => rank(inferRole(a.raw).role) - rank(inferRole(b.raw).role) || a.key.localeCompare(b.key))
    for (const { key, raw } of order) {
      const inferred = inferRole(raw)
      const ov = this.overrides[key] ?? this.overrides[raw.name] ?? {}
      const department = ov.department ?? inferred.department
      const role = ov.role ?? inferred.role
      const title = ov.title ?? inferred.title
      const cur = this.placements[key]
      if (cur && (!ov.deskId || cur.deskId === ov.deskId) && (!ov.department || cur.department === ov.department)) {
        if (cur.role !== role || cur.title !== title) {
          cur.role = role
          cur.title = title
          changed = true
        }
        continue
      }
      const desk = this.pickDesk(key, department, role, ov.deskId)
      this.placements[key] = { deskId: desk.id, department: desk.department, role, title, releasedAt: null }
      changed = true
    }
    if (changed) this.save()
    return changed
  }

  private taken(exceptKey: string): Set<string> {
    return new Set(Object.entries(this.placements).filter(([k]) => k !== exceptKey).map(([, p]) => p.deskId))
  }

  private pickDesk(key: string, department: DepartmentId, role: string, wanted?: string): Desk {
    const taken = this.taken(key)
    const free = (d: Desk) => !taken.has(d.id)
    if (wanted) {
      const d = DESKS.find((x) => x.id === wanted && free(x))
      if (d) return d
    }
    const reserved = role === 'ceo' ? 'ceo' : role === 'manager' ? 'manager' : role === 'director' ? 'director' : undefined
    const inDept = DESKS.filter((d) => d.department === department && free(d))
    const pick =
      (reserved && inDept.find((d) => d.reservedFor === reserved)) ||
      inDept.find((d) => !d.reservedFor) ||
      DESKS.find((d) => d.department === 'pmo' && free(d) && !d.reservedFor) ||
      DESKS.find((d) => free(d) && !d.reservedFor)
    if (pick) return pick
    // Escritório lotado: mesa virtual de excedente (aparece na lista/2D, não no 3D).
    return { id: `overflow-${key}`, department, x: 0, z: 14, rot: 0 }
  }

  private save(): void {
    const tmp = this.file + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(this.placements, null, 2))
    fs.renameSync(tmp, this.file)
  }
}

function rank(role: string): number {
  return role === 'ceo' ? 0 : role === 'manager' ? 1 : role === 'director' ? 2 : 3
}
