import { DESKS, MEETING_SEATS, ROOMS, OFFICE_BOUNDS } from '../../shared/layout'
import type { DepartmentId, OfficeAgent, OfficeTask, TaskStatus } from '../../shared/types'
import { DEPT_COLOR, STATE_META, TASK_META, ago, esc } from './meta'

// Visões leves (sem WebGL): planta 2D em SVG, lista e Kanban. Funcionam em
// computadores modestos e celulares e mostram exatamente os mesmos dados do 3D.

export function renderPlan(host: HTMLElement, agents: OfficeAgent[], filter: DepartmentId | null, selected: string | null): void {
  const { x0, z0, x1, z1 } = OFFICE_BOUNDS
  const pad = 1
  const vb = `${x0 - pad} ${z0 - pad} ${x1 - x0 + pad * 2} ${z1 - z0 + pad * 2}`
  const deskById = new Map(DESKS.map((d) => [d.id, d]))
  let meetingIdx = 0
  const dim = (id: string) => (filter && filter !== id ? 'dim' : '')
  const rooms = ROOMS.map(
    (r) => `<g class="room ${dim(r.id)}" data-room="${r.id}"><title>${esc(r.label)}</title>
      <rect x="${r.x0 + 0.1}" y="${r.z0 + 0.1}" width="${r.x1 - r.x0 - 0.2}" height="${r.z1 - r.z0 - 0.2}" rx="0.4" style="--accent:${DEPT_COLOR[r.id]}"/></g>`,
  ).join('')
  // Nomes das salas por cima das mesas, com o nome curto para caber.
  const roomNames = ROOMS.map(
    (r) => {
      const full = r.code ? `${r.code} · ${r.short}` : r.short
      const max = Math.floor((r.x1 - r.x0 - 0.8) / 0.5)
      return `<text class="room-name ${dim(r.id)}" x="${r.x0 + 0.5}" y="${r.z0 + 1.05}">${esc(full.length > max ? full.slice(0, max - 1) + '…' : full)}</text>`
    },
  ).join('')
  const desks = DESKS.map((d) => `<rect class="desk" x="${d.x - 0.7}" y="${d.z - 0.45}" width="1.4" height="0.9" rx="0.15"/>`).join('')
  const placed = agents
    .filter((a) => !filter || a.department === filter || a.state === 'meeting')
    .map((a) => {
      let x = 0, z = 14
      if (a.state === 'meeting') {
        const s = MEETING_SEATS[meetingIdx++ % MEETING_SEATS.length]
        x = s.x
        z = s.z
      } else {
        const d = deskById.get(a.deskId)
        if (d) {
          x = d.x
          z = d.z
        }
      }
      return { a, x, z, below: true }
    })
  // Na mesma fileira, nomes alternam abaixo/acima para não colidirem.
  const rows = new Map<number, typeof placed>()
  for (const p of placed) {
    const r = Math.round(p.z)
    if (!rows.has(r)) rows.set(r, [])
    rows.get(r)!.push(p)
  }
  for (const row of rows.values()) row.sort((p, q) => p.x - q.x).forEach((p, i) => (p.below = i % 2 === 0))
  const dots = placed
    .map(({ a, x, z, below }) => {
      const m = STATE_META[a.state]
      const pulse = ['blocked', 'error', 'awaiting_approval'].includes(a.state) ? 'pulse' : ''
      const label = a.name.split(' — ')[0]
      const nm = label.length > 16 ? label.slice(0, 15) + '…' : label
      return `<g class="agent ${pulse} ${selected === a.key ? 'sel' : ''}" data-agent="${esc(a.key)}" transform="translate(${x} ${z})">
        <title>${esc(a.name)} · ${esc(m.label)}</title>
        <circle r="0.75" fill="${m.color}" stroke="#071634" stroke-width="0.15"/>
        <text class="ico" y="0.28">${m.icon}</text>
        <text class="nm" y="${below ? 1.6 : -1.05}">${esc(nm)}</text></g>`
    })
    .join('')
  host.innerHTML = `<svg class="plan" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${rooms}${desks}${roomNames}${dots}</svg>`
}

export function renderList(host: HTMLElement, agents: OfficeAgent[], tasks: Map<string, OfficeTask>): void {
  const rows = [...agents]
    .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name))
    .map((a) => {
      const m = STATE_META[a.state]
      const t = a.currentTaskKey ? tasks.get(a.currentTaskKey) : null
      return `<tr data-agent="${esc(a.key)}">
        <td><span class="dot" style="background:${m.color}"></span><b>${esc(a.name)}</b><small>${esc(a.title)}</small></td>
        <td>${esc(ROOMS.find((r) => r.id === a.department)?.label ?? a.department)}</td>
        <td><span class="chip" style="--c:${m.color}">${m.icon} ${esc(m.label)}</span></td>
        <td>${t ? esc(t.title) : '<span class="muted">—</span>'}${a.progress != null ? ` <small>${a.progress}%</small>` : ''}</td>
        <td class="muted">${ago(a.updatedAt)}</td></tr>`
    })
    .join('')
  host.innerHTML = `<div class="table-wrap"><table class="agents"><thead><tr><th>Agente</th><th>Departamento</th><th>Estado</th><th>Tarefa atual</th><th>Atualizado</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted">Nenhum agente cadastrado nas fontes conectadas.</td></tr>'}</tbody></table></div>`
}

const COLUMNS: TaskStatus[] = ['queued', 'running', 'awaiting_approval', 'review', 'blocked', 'failed', 'done']

export function renderKanban(host: HTMLElement, tasks: OfficeTask[], agents: Map<string, OfficeAgent>): void {
  const cols = COLUMNS.map((s) => {
    const items = tasks.filter((t) => t.status === s).slice(0, 60)
    const cards = items
      .map((t) => {
        const who = t.assignees.map((k) => agents.get(k)?.name ?? k.split(':')[1]).join(', ') || 'sem responsável'
        const from = t.fromAgent ? agents.get(t.fromAgent)?.name : null
        return `<article class="card" data-task="${esc(t.key)}">
          <p>${esc(t.title)}</p>
          <small>${esc(who)}${from ? ` · delegada por ${esc(from)}` : ''}</small>
          ${t.progress != null && s === 'running' ? `<div class="bar"><i style="width:${t.progress}%"></i></div>` : ''}
          ${t.reason ? `<em>${esc(t.reason)}</em>` : ''}${t.error ? `<em class="err">${esc(t.error.slice(0, 140))}</em>` : ''}
        </article>`
      })
      .join('')
    return `<section class="col"><h4 style="--c:${TASK_META[s].color}">${TASK_META[s].label} <span>${items.length}</span></h4>${cards}</section>`
  }).join('')
  host.innerHTML = `<div class="kanban">${cols}</div>`
}
