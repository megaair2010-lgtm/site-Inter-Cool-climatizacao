// Visão "Pixel Art": desenha os agentes reais (Ruflo/Hermes) como personagens
// em pixel art, usando os sprites do projeto W17ant/Claude-Office (MIT
// License — ver public/sprites/THIRD_PARTY_NOTICE/NOTICE.md). Ao contrário do
// Claude-Office original (que mostra sessões do Claude Code rodando no
// terminal), aqui os personagens representam os agentes de negócio da
// Inter-Cool AI Company: os mesmos dados da visão 2D/3D, só com outra
// estética.

import { DESKS, OFFICE_BOUNDS, ROOMS } from '../../shared/layout'
import type { DepartmentId, OfficeAgent } from '../../shared/types'
import { DEPT_COLOR, STATE_META } from './meta'

/** Qual personagem representa cada diretoria (puramente estético). */
const CHAR_BY_DEPT: Record<DepartmentId, string> = {
  executive: 'Me-1',
  management: 'Claude-1',
  commercial: 'dev-1',
  marketing: 'Frontend-dev-1',
  seo: 'Frontend-dev-1',
  finance: 'employee-1',
  operations: 'security-audit-1',
  customer: 'employee-2',
  supply: 'employee-3',
  legal: 'employee-1',
  hr: 'employee-2',
  intelligence: 'explore-1',
  technology: 'dev-2',
  pmo: 'employee-3',
  quality: 'security-audit-1',
  reception: 'employee-1',
  meeting: 'dev-1',
  lounge: 'employee-2',
}

const SPRITE_RATIO = 880 / 432

interface Placed {
  agent: OfficeAgent
  x: number
  y: number
}

const spriteCache = new Map<string, HTMLImageElement>()
function sprite(base: string, facing: 'front-left' | 'front-right'): HTMLImageElement {
  const key = `${base}-${facing}`
  let img = spriteCache.get(key)
  if (!img) {
    img = new Image()
    img.src = `/sprites/characters/${key}.png`
    spriteCache.set(key, img)
  }
  return img
}

export class PixelOffice {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private placed: Placed[] = []
  private raf = 0
  private frameOn = false
  private sw = 40
  private sh = 80
  onSelect: ((key: string | null) => void) | null = null

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'pixel-canvas'
    container.innerHTML = ''
    container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    this.canvas.addEventListener('click', (e) => this.handleClick(e))
    const loop = () => {
      this.frameOn = Math.floor(Date.now() / 450) % 2 === 0
      this.draw()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
  }

  private lastAgents: OfficeAgent[] = []
  private lastSelected: string | null = null

  update(agents: OfficeAgent[], selected: string | null) {
    this.lastAgents = agents
    this.lastSelected = selected
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1)
    const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1)
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    for (const p of this.placed) {
      if (mx >= p.x - this.sw / 2 && mx <= p.x + this.sw / 2 && my >= p.y - this.sh && my <= p.y) {
        this.onSelect?.(p.agent.key)
        return
      }
    }
    this.onSelect?.(null)
  }

  private draw() {
    const c = this.canvas
    const parent = c.parentElement!
    const dpr = window.devicePixelRatio || 1
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    const ctx = this.ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0b1a3a'
    ctx.fillRect(0, 0, w, h)

    const bw = OFFICE_BOUNDS.x1 - OFFICE_BOUNDS.x0
    const bh = OFFICE_BOUNDS.z1 - OFFICE_BOUNDS.z0
    const scale = Math.min(w / bw, h / bh) * 0.92
    const offX = w / 2 - ((OFFICE_BOUNDS.x0 + OFFICE_BOUNDS.x1) / 2) * scale
    const offY = h / 2 - ((OFFICE_BOUNDS.z0 + OFFICE_BOUNDS.z1) / 2) * scale
    const toX = (x: number) => x * scale + offX
    const toY = (z: number) => z * scale + offY
    const SPRITE_W = (this.sw = Math.max(16, Math.min(54, scale * 2.6)))
    const SPRITE_H = (this.sh = SPRITE_W * SPRITE_RATIO)

    // Salas (retângulos simples, cor por diretoria)
    for (const r of ROOMS) {
      ctx.fillStyle = `${DEPT_COLOR[r.id]}22`
      ctx.strokeStyle = `${DEPT_COLOR[r.id]}66`
      ctx.lineWidth = 2
      const x = toX(r.x0), y = toY(r.z0)
      const rw = toX(r.x1) - x, rh = toY(r.z1) - y
      ctx.fillRect(x, y, rw, rh)
      ctx.strokeRect(x, y, rw, rh)
      ctx.fillStyle = '#e8eefc99'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText(r.short, x + 6, y + 14)
    }

    this.placed = []
    const deptSeen = new Map<DepartmentId, number>()
    for (const agent of this.lastAgents) {
      const desk = DESKS.find((d) => d.id === agent.deskId)
      const room = ROOMS.find((r) => r.id === agent.department)
      let px: number, pz: number
      if (desk) {
        px = toX(desk.x)
        pz = toY(desk.z)
      } else if (room) {
        // Sem mesa atribuída: espalha em linha dentro da sala para não sobrepor.
        const i = deptSeen.get(agent.department) ?? 0
        deptSeen.set(agent.department, i + 1)
        const cols = Math.max(1, Math.floor((toX(room.x1) - toX(room.x0)) / (SPRITE_W + 10)))
        const col = i % cols
        const row = Math.floor(i / cols)
        const roomW = toX(room.x1) - toX(room.x0)
        const stepX = roomW / (cols + 1)
        px = toX(room.x0) + stepX * (col + 1)
        pz = toY((room.z0 + room.z1) / 2) + row * (SPRITE_H * 0.6)
      } else {
        px = w / 2
        pz = h / 2
      }
      const base = CHAR_BY_DEPT[agent.department] ?? 'employee-1'
      const working = agent.state !== 'offline' && agent.state !== 'idle' && agent.state !== 'done'
      const facing = working && this.frameOn ? 'front-right' : 'front-left'
      const img = sprite(base, facing)
      const selected = agent.key === this.lastSelected

      if (selected) {
        ctx.save()
        ctx.shadowColor = '#5CC3DD'
        ctx.shadowBlur = 16
      }
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, px - SPRITE_W / 2, pz - SPRITE_H, SPRITE_W, SPRITE_H)
      } else {
        ctx.fillStyle = DEPT_COLOR[agent.department] ?? '#5CC3DD'
        ctx.beginPath()
        ctx.arc(px, pz - SPRITE_H / 2, SPRITE_W / 3, 0, Math.PI * 2)
        ctx.fill()
      }
      if (selected) ctx.restore()

      // bolinha de estado
      const meta = STATE_META[agent.state]
      ctx.fillStyle = meta.color
      ctx.beginPath()
      ctx.arc(px + SPRITE_W / 2 - 6, pz - SPRITE_H + 8, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0b1a3a'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // nome
      ctx.fillStyle = '#f2f6fb'
      ctx.font = '10px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(agent.name.split(' ')[0].slice(0, 12), px, pz + 12)
      ctx.textAlign = 'start'

      this.placed.push({ agent, x: px, y: pz })
    }
  }
}
