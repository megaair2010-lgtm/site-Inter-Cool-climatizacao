// Planta do escritório (metros), organizada pela hierarquia da Inter-Cool AI Company:
// CEO e gerente-geral no eixo central, 12 diretorias ao redor. Compartilhada entre o
// servidor (alocação de mesas) e o cliente (3D e 2D). x cresce para leste, z para sul;
// a entrada fica no lado sul, pela recepção.

import type { DepartmentId } from './types'

export interface Desk {
  id: string
  department: DepartmentId
  x: number
  z: number
  /** Rotação (rad) do agente sentado; direção do olhar = (-sin rot, -cos rot). 0 = olha para o norte. */
  rot: number
  /** Mesa reservada a um papel. */
  reservedFor?: 'ceo' | 'manager' | 'director'
}

export interface Room {
  id: DepartmentId
  label: string
  /** Nome curto para rótulos no 3D. */
  short: string
  /** Número da diretoria na hierarquia (01–12), quando houver. */
  code?: string
  x0: number
  z0: number
  x1: number
  z1: number
  glass?: boolean
  /** Porta: ponto no meio da parede voltada para o corredor. */
  door: { x: number; z: number }
  /** Corredor por onde se chega à porta. */
  corridorZ: number
  /** Sala sem parede (área aberta). */
  open?: boolean
}

export const OFFICE_BOUNDS = { x0: -35, z0: -20, x1: 35, z1: 16 }

/** Corredores horizontais e passagens verticais entre eles. */
export const CORRIDORS = { north: -9.5, south: 2.5, aisles: [-15, 15] }

const COLS = [-35, -25, -15, -5, 5, 15, 25, 35]
const ROW_A = { z0: -20, z1: -11 } // norte: porta ao sul
const ROW_B = { z0: -8, z1: 1 } // meio: porta ao norte
const ROW_C = { z0: 4, z1: 13 } // sul: porta ao norte
const INSET = 0.75 // folga lateral na fileira do meio para as passagens verticais

function roomA(id: DepartmentId, label: string, short: string, c0: number, c1: number, extra: Partial<Room> = {}): Room {
  const x0 = COLS[c0], x1 = COLS[c1]
  return { id, label, short, x0, x1, ...ROW_A, door: { x: (x0 + x1) / 2, z: ROW_A.z1 }, corridorZ: CORRIDORS.north, ...extra }
}
function roomB(id: DepartmentId, label: string, short: string, c0: number, c1: number, extra: Partial<Room> = {}): Room {
  const x0 = COLS[c0] + (c0 === 0 ? 0 : INSET), x1 = COLS[c1] - (c1 === 7 ? 0 : INSET)
  return { id, label, short, x0, x1, ...ROW_B, door: { x: (x0 + x1) / 2, z: ROW_B.z0 }, corridorZ: CORRIDORS.north, ...extra }
}
function roomC(id: DepartmentId, label: string, short: string, c0: number, c1: number, extra: Partial<Room> = {}): Room {
  const x0 = COLS[c0], x1 = COLS[c1]
  return { id, label, short, x0, x1, ...ROW_C, door: { x: (x0 + x1) / 2, z: ROW_C.z0 }, corridorZ: CORRIDORS.south, ...extra }
}

export const ROOMS: Room[] = [
  roomA('marketing', 'Marketing e Growth', 'Marketing', 0, 1, { code: '02' }),
  roomA('seo', 'SEO e conteúdo', 'SEO e conteúdo', 1, 2, { code: '02' }),
  roomA('meeting', 'Sala de reuniões e centro de operações', 'Reuniões', 2, 4, { glass: true }),
  roomA('pmo', 'PMO — Projetos e planejamento', 'PMO', 4, 5, { code: '11' }),
  roomA('intelligence', 'Inteligência de mercado', 'Inteligência', 5, 6, { code: '09' }),
  roomA('executive', 'Sala do CEO', 'Sala do CEO', 6, 7, { glass: true }),
  roomB('commercial', 'Comercial e vendas', 'Comercial', 0, 1, { code: '01' }),
  roomB('customer', 'Atendimento, CRM e sucesso do cliente', 'Atendimento e CRM', 1, 2, { code: '05' }),
  roomB('management', 'Gerente-geral de operações', 'Gerente-geral', 2, 4, { glass: true }),
  roomB('finance', 'Financeiro e controladoria', 'Financeiro', 4, 5, { code: '03' }),
  roomB('legal', 'Administrativo, jurídico e licitações', 'Jurídico e licitações', 5, 6, { code: '07' }),
  roomB('hr', 'RH e gestão de agentes', 'RH e agentes', 6, 7, { code: '08' }),
  roomC('operations', 'Operações e engenharia HVAC', 'Engenharia HVAC', 0, 1, { code: '04' }),
  roomC('supply', 'Suprimentos e fornecedores', 'Suprimentos', 1, 2, { code: '06' }),
  roomC('technology', 'Tecnologia, dados e automação', 'Tecnologia', 2, 3, { code: '10' }),
  { ...roomC('reception', 'Recepção Inter-Cool', 'Recepção', 3, 4), open: true, z1: 16 },
  roomC('quality', 'Qualidade, riscos e auditoria', 'Qualidade', 4, 5, { code: '12' }),
  { ...roomC('lounge', 'Copa e descanso', 'Copa', 5, 7), open: true },
]

export const DEPARTMENT_LABEL: Record<DepartmentId, string> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r.label]),
) as Record<DepartmentId, string>

/** Bloco de mesas: 2 colunas frente a frente × n linhas, centrado em (cx, cz). */
function cluster(dep: DepartmentId, cx: number, cz: number, rows: number, cols = 2, start = 1): Desk[] {
  const out: Desk[] = []
  let n = start
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cx + (c - (cols - 1) / 2) * 3.2
      const z = cz + (r - (rows - 1) / 2) * 2.4
      out.push({ id: `${dep}-${n++}`, department: dep, x, z, rot: c % 2 === 0 ? -Math.PI / 2 : Math.PI / 2 })
    }
  }
  return out
}

/** Diretoria padrão: mesa do diretor ao fundo + 6 especialistas. */
function directorate(id: DepartmentId): Desk[] {
  const r = ROOMS.find((x) => x.id === id)!
  const cx = (r.x0 + r.x1) / 2
  const north = r.door.z === r.z1 // porta ao sul → fundo ao norte
  const backZ = north ? r.z0 + 1.6 : r.z1 - 1.6
  const director: Desk = { id: `${id}-dir`, department: id, x: cx, z: backZ, rot: north ? Math.PI : 0, reservedFor: 'director' }
  const clusterZ = north ? r.z0 + 5.6 : r.z1 - 5.6
  return [director, ...cluster(id, cx, clusterZ, 3)]
}

export const DESKS: Desk[] = [
  { id: 'executive-ceo', department: 'executive', x: 30, z: -17.4, rot: Math.PI, reservedFor: 'ceo' },
  { id: 'executive-2', department: 'executive', x: 27, z: -13.5, rot: -Math.PI / 2 },
  { id: 'management-gm', department: 'management', x: -5, z: -0.8, rot: 0, reservedFor: 'manager' },
  ...cluster('management', -5, -4.2, 1, 4).map((d, i) => ({ ...d, id: `management-${i + 2}` })),
  ...(['commercial', 'marketing', 'seo', 'finance', 'operations', 'customer', 'supply', 'legal', 'hr', 'intelligence', 'technology', 'quality'] as DepartmentId[]).flatMap(directorate),
  { id: 'pmo-dir', department: 'pmo', x: 10, z: -18.4, rot: Math.PI, reservedFor: 'director' },
  ...cluster('pmo', 10, -14.2, 2),
  { id: 'reception-1', department: 'reception', x: -1.6, z: 6.6, rot: Math.PI },
  { id: 'reception-2', department: 'reception', x: 1.6, z: 6.6, rot: Math.PI },
]

/** Assentos da sala de reuniões, ao redor da mesa oval. */
export const MEETING_SEATS: { x: number; z: number; rot: number }[] = (() => {
  const seats: { x: number; z: number; rot: number }[] = []
  const cx = -5, cz = -15.5
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    seats.push({ x: cx + Math.cos(a) * 4.6, z: cz + Math.sin(a) * 2.5, rot: Math.atan2(Math.cos(a), Math.sin(a)) })
  }
  return seats
})()

export function roomAt(x: number, z: number): Room | undefined {
  return ROOMS.find((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1)
}
