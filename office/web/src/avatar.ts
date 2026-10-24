import * as THREE from 'three'
import type { VisualState } from '../../shared/types'
import { STATE_META } from './meta'

// Personagem low-poly com poses procedurais. Toda animação é local (sem IA) e
// determinada pelo estado real recebido da API. Nada se move "por enfeite": um
// agente ocioso fica sentado, respirando, sem passear.

const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac]
const HAIR = [0x1f2937, 0x3b2f2f, 0x6b4f3a, 0x111827, 0x9ca3af]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function badgeTexture(icon: string, color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.beginPath()
  g.arc(64, 64, 54, 0, Math.PI * 2)
  g.fillStyle = '#071634'
  g.fill()
  g.lineWidth = 10
  g.strokeStyle = color
  g.stroke()
  g.fillStyle = '#ffffff'
  g.font = 'bold 62px system-ui, "Segoe UI Emoji", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(icon, 64, 70)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const badgeCache = new Map<VisualState, THREE.SpriteMaterial>()
function badgeMaterial(state: VisualState): THREE.SpriteMaterial {
  let m = badgeCache.get(state)
  if (!m) {
    const meta = STATE_META[state]
    m = new THREE.SpriteMaterial({ map: badgeTexture(meta.icon, meta.color), depthTest: false, transparent: true })
    badgeCache.set(state, m)
  }
  return m
}

/** Estados que exibem um selo flutuante sobre a cabeça. */
const BADGE_STATES: VisualState[] = ['queued', 'awaiting_approval', 'review', 'blocked', 'done', 'error', 'offline', 'delegating', 'meeting']

export interface Seat {
  x: number
  z: number
  rot: number
}

export class Avatar {
  readonly root = new THREE.Group()
  readonly pickables: THREE.Object3D[] = []
  state: VisualState = 'idle'
  progress: number | null = null
  private flip = new THREE.Group()
  private body = new THREE.Group()
  private hips = new THREE.Group()
  private torso = new THREE.Group()
  private head = new THREE.Group()
  private armL = new THREE.Group()
  private armR = new THREE.Group()
  private foreL = new THREE.Group()
  private foreR = new THREE.Group()
  private legL = new THREE.Group()
  private legR = new THREE.Group()
  private shinL = new THREE.Group()
  private shinR = new THREE.Group()
  private prop = new THREE.Group()
  private chart = new THREE.Group()
  private chartBars: THREE.Mesh[] = []
  private badge = new THREE.Sprite()
  private ring: THREE.Mesh
  private materials: THREE.MeshStandardMaterial[] = []
  private path: THREE.Vector3[] = []
  private seat: Seat = { x: 0, z: 0, rot: 0 }
  private standing = false
  private t = Math.random() * 10
  private stateSince = 0
  private lookAt: THREE.Vector3 | null = null

  constructor(readonly key: string, shirt: string) {
    const h = hash(key)
    const mat = (color: number | string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...extra })
      this.materials.push(m)
      return m
    }
    const skin = mat(SKIN[h % SKIN.length])
    const hair = mat(HAIR[(h >>> 3) % HAIR.length])
    const cloth = mat(shirt)
    const pants = mat(0x1f2430)
    const shoe = mat(0x0b0f17)

    const box = (w: number, hgt: number, d: number, m: THREE.Material, y = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), m)
      mesh.position.y = y
      mesh.castShadow = true
      return mesh
    }

    // Pernas (pivô no quadril) e canelas (pivô no joelho)
    for (const [leg, shin, x] of [
      [this.legL, this.shinL, -0.11],
      [this.legR, this.shinR, 0.11],
    ] as const) {
      leg.position.set(x, 0, 0)
      leg.add(box(0.16, 0.42, 0.18, pants, -0.21))
      shin.position.y = -0.42
      shin.add(box(0.14, 0.4, 0.16, pants, -0.2))
      const foot = box(0.15, 0.08, 0.26, shoe, -0.42)
      foot.position.z = 0.05
      shin.add(foot)
      leg.add(shin)
      this.hips.add(leg)
    }
    this.hips.position.y = 0.9
    this.body.add(this.hips)

    // Tronco
    this.torso.add(box(0.44, 0.56, 0.26, cloth, 0.28))
    const collar = box(0.2, 0.05, 0.27, mat(0xf2f6fb), 0.55)
    this.torso.add(collar)
    this.hips.add(this.torso)

    // Cabeça
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skin)
    skull.castShadow = true
    this.head.add(skull)
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.1), hair)
    cap.rotation.x = -0.25
    this.head.add(cap)
    const eyeM = mat(0x0b0f17)
    for (const x of [-0.055, 0.055]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), eyeM)
      eye.position.set(x, 0.02, 0.15)
      this.head.add(eye)
    }
    this.head.position.y = 0.76
    this.torso.add(this.head)

    // Braços (pivô no ombro) e antebraços (pivô no cotovelo)
    for (const [arm, fore, x] of [
      [this.armL, this.foreL, -0.28],
      [this.armR, this.foreR, 0.28],
    ] as const) {
      arm.position.set(x, 0.52, 0)
      arm.add(box(0.12, 0.3, 0.13, cloth, -0.15))
      fore.position.y = -0.3
      fore.add(box(0.11, 0.28, 0.12, cloth, -0.14))
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), skin)
      hand.position.y = -0.3
      fore.add(hand)
      arm.add(fore)
      this.torso.add(arm)
    }

    // Objeto na mão (documento/prancheta), visível em pesquisa e proposta
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.3), mat(0xffffff, { emissive: 0x222222 }))
    this.prop.add(paper)
    this.prop.visible = false
    this.prop.position.set(0, 0.95, 0.38)
    this.body.add(this.prop)

    // Gráfico holográfico sobre a mesa (análise de dados)
    const holo = new THREE.MeshBasicMaterial({ color: 0x5cc3dd, transparent: true, opacity: 0.75 })
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.07), holo)
      bar.position.x = -0.15 + i * 0.1
      this.chartBars.push(bar)
      this.chart.add(bar)
    }
    this.chart.position.set(0, 1.45, 0.75)
    this.chart.visible = false
    this.body.add(this.chart)

    this.badge.scale.set(0.42, 0.42, 1)
    this.badge.position.y = 2.15
    this.badge.renderOrder = 10
    this.badge.visible = false
    this.root.add(this.badge)

    // Anel de seleção
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), new THREE.MeshBasicMaterial({ color: 0x5cc3dd, transparent: true, opacity: 0.9, side: THREE.DoubleSide }))
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.y = 0.02
    this.ring.visible = false
    this.root.add(this.ring)

    // O modelo é construído olhando para +z; o giro de 180° faz o agente olhar para -z,
    // a convenção da planta (direção = (-sin rot, -cos rot)).
    this.flip.rotation.y = Math.PI
    this.flip.add(this.body)
    this.root.add(this.flip)
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o !== this.ring) {
        o.userData.agentKey = key
        this.pickables.push(o)
      }
    })
  }

  get position(): THREE.Vector3 {
    return this.root.position
  }

  setSelected(v: boolean): void {
    this.ring.visible = v
  }

  /** Teleporta para o assento (primeira aparição). */
  placeAt(seat: Seat): void {
    this.seat = seat
    this.path = []
    this.root.position.set(seat.x, 0, seat.z)
    this.root.rotation.y = seat.rot
  }

  /** Caminha até o assento passando pelos pontos dados (portas/corredores). */
  walkTo(seat: Seat, waypoints: THREE.Vector3[]): void {
    this.seat = seat
    this.path = [...waypoints, new THREE.Vector3(seat.x, 0, seat.z)]
  }

  get walking(): boolean {
    return this.path.length > 0
  }

  setState(state: VisualState, progress: number | null, lookAt: THREE.Vector3 | null): void {
    if (state !== this.state) this.stateSince = this.t
    this.state = state
    this.progress = progress
    this.lookAt = lookAt
    const offline = state === 'offline'
    for (const m of this.materials) {
      m.transparent = offline
      m.opacity = offline ? 0.35 : 1
    }
    if (BADGE_STATES.includes(state)) {
      this.badge.material = badgeMaterial(state)
      this.badge.visible = true
    } else this.badge.visible = false
  }

  update(dt: number): void {
    this.t += dt
    const t = this.t
    const s = this.state

    // Deslocamento
    if (this.path.length) {
      const target = this.path[0]
      const pos = this.root.position
      const d = target.clone().sub(pos)
      d.y = 0
      const dist = d.length()
      const step = 1.7 * dt
      if (dist <= step) {
        pos.copy(target)
        this.path.shift()
      } else {
        pos.addScaledVector(d.normalize(), step)
        const yaw = Math.atan2(-d.x, -d.z)
        this.root.rotation.y = lerpAngle(this.root.rotation.y, yaw, Math.min(1, dt * 10))
      }
      if (!this.path.length) this.root.rotation.y = this.seat.rot
      this.poseWalk(t)
      this.prop.visible = false
      this.chart.visible = false
      return
    }

    this.root.rotation.y = lerpAngle(this.root.rotation.y, this.seat.rot, Math.min(1, dt * 6))
    this.standing = s === 'delegating'
    this.resetPose()
    if (this.standing) this.poseStand()
    else this.poseSit()

    const breath = Math.sin(t * 1.6) * 0.012
    this.torso.position.y = breath
    this.prop.visible = s === 'researching' || s === 'proposal'
    this.chart.visible = s === 'analyzing'
    this.badge.position.y = 2.05 + Math.sin(t * 2.4) * 0.04

    switch (s) {
      case 'working':
      case 'writing': {
        const speed = s === 'writing' ? 22 : 15
        this.armsForward()
        this.foreL.rotation.x += Math.sin(t * speed) * 0.08
        this.foreR.rotation.x += Math.sin(t * speed + 1.7) * 0.08
        this.head.rotation.x = 0.12
        break
      }
      case 'researching':
        this.armsForward()
        this.armR.rotation.x = -1.2
        this.foreR.rotation.x = -0.9
        this.head.rotation.x = 0.35 + Math.sin(t * 0.7) * 0.05
        this.head.rotation.y = Math.sin(t * 0.4) * 0.25
        this.prop.position.set(0.12, 0.98, 0.42)
        this.prop.rotation.x = -0.6
        break
      case 'analyzing': {
        this.armsForward()
        this.armR.rotation.x = -1.5 + Math.sin(t * 2) * 0.1
        this.head.rotation.x = -0.25
        const p = this.progress ?? 50
        this.chartBars.forEach((b, i) => {
          const hgt = 0.12 + (i === 3 ? p / 100 : (Math.sin(t * 1.3 + i) + 1.4) * 0.18) * 0.5
          b.scale.y = hgt
          b.position.y = hgt / 2
        })
        break
      }
      case 'proposal':
        this.armsForward()
        this.armL.rotation.x = -1.0
        this.prop.position.set(-0.1, 0.92, 0.4)
        this.prop.rotation.z = Math.sin(t * 1.5) * 0.15
        this.head.rotation.x = 0.4
        break
      case 'delegating': {
        this.armR.rotation.x = -1.4
        this.armR.rotation.z = 0.2 + Math.sin(t * 3) * 0.05
        if (this.lookAt) {
          const local = this.root.worldToLocal(this.lookAt.clone())
          this.body.rotation.y = Math.atan2(-local.x, -local.z) * 0.8
        }
        break
      }
      case 'meeting':
        this.armL.rotation.x = -0.5
        this.armR.rotation.x = -0.5
        this.head.rotation.y = Math.sin(t * 0.5 + this.key.length) * 0.5
        if (Math.sin(t * 0.9 + this.key.length) > 0.6) this.armR.rotation.x = -1.0 + Math.sin(t * 6) * 0.15
        break
      case 'review':
        this.armsForward()
        this.torso.rotation.x = 0.18
        this.head.rotation.x = 0.1
        this.armR.rotation.x = -1.6
        this.foreR.rotation.x = -1.2
        break
      case 'awaiting_approval':
      case 'queued':
        this.armL.rotation.set(-0.9, 0, 0.7)
        this.armR.rotation.set(-0.9, 0, -0.7)
        this.foreL.rotation.x = -1.3
        this.foreR.rotation.x = -1.3
        this.head.rotation.y = Math.sin(t * 0.6) * 0.15
        break
      case 'blocked':
        this.armL.rotation.set(-2.6, 0, 0.4)
        this.armR.rotation.set(-2.6, 0, -0.4)
        this.foreL.rotation.x = -1.6
        this.foreR.rotation.x = -1.6
        this.head.rotation.x = 0.25
        this.badge.scale.setScalar(0.42 + Math.abs(Math.sin(t * 4)) * 0.08)
        break
      case 'done': {
        const k = Math.max(0, 1 - (t - this.stateSince) / 1.5)
        this.armR.rotation.x = -0.4 - 2.2 * k
        this.armL.rotation.x = -0.4 - 2.2 * k
        break
      }
      case 'error':
        this.head.rotation.x = 0.45
        this.torso.rotation.x = 0.12
        break
      case 'offline':
        this.torso.rotation.x = 0.25
        this.head.rotation.x = 0.6
        this.torso.position.y = 0
        break
      case 'idle':
      default:
        this.torso.rotation.x = -0.12
        this.armL.rotation.x = -0.25
        this.armR.rotation.x = -0.25
        this.head.rotation.y = Math.sin(t * 0.25 + this.key.length) * 0.2
    }
    if (s !== 'blocked') this.badge.scale.setScalar(0.42)
  }

  private resetPose(): void {
    for (const g of [this.torso, this.head, this.armL, this.armR, this.foreL, this.foreR, this.legL, this.legR, this.shinL, this.shinR]) g.rotation.set(0, 0, 0)
    this.body.rotation.y = 0
    this.prop.rotation.set(0, 0, 0)
  }

  private poseSit(): void {
    this.hips.position.y = 0.52
    this.legL.rotation.x = -1.45
    this.legR.rotation.x = -1.45
    this.shinL.rotation.x = 1.45
    this.shinR.rotation.x = 1.45
    this.body.position.z = -0.12
  }

  private poseStand(): void {
    this.hips.position.y = 0.9
    this.body.position.z = -0.6
  }

  private armsForward(): void {
    this.armL.rotation.x = -0.9
    this.armR.rotation.x = -0.9
    this.foreL.rotation.x = -0.6
    this.foreR.rotation.x = -0.6
    this.armL.rotation.z = -0.15
    this.armR.rotation.z = 0.15
  }

  private poseWalk(t: number): void {
    this.resetPose()
    this.hips.position.y = 0.9 + Math.abs(Math.sin(t * 8)) * 0.03
    this.body.position.z = 0
    const a = Math.sin(t * 8) * 0.6
    this.legL.rotation.x = a
    this.legR.rotation.x = -a
    this.shinL.rotation.x = Math.max(0, -a) * 0.8
    this.shinR.rotation.x = Math.max(0, a) * 0.8
    this.armL.rotation.x = -a * 0.7
    this.armR.rotation.x = a * 0.7
  }

  dispose(): void {
    this.root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.geometry.dispose()
    })
    for (const m of this.materials) m.dispose()
  }
}

function lerpAngle(a: number, b: number, k: number): number {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}
