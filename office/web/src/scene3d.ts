import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { CORRIDORS, DESKS, MEETING_SEATS, ROOMS, OFFICE_BOUNDS, roomAt, type Desk, type Room } from '../../shared/layout'
import type { DepartmentId, OfficeAgent } from '../../shared/types'
import { Avatar, type Seat } from './avatar'
import { BRAND, DEPT_COLOR, STATE_META, esc } from './meta'

// Cena 3D do escritório. Recebe a lista de agentes (já com estado real) e só
// renderiza. Nenhuma chamada de IA, nenhum estado inventado.

type Quality = 'high' | 'low'

interface DeskView {
  desk: Desk
  screen: THREE.MeshStandardMaterial
}

const DOOR_GAP = 2.2

function doorOf(room: Room): THREE.Vector3 {
  return new THREE.Vector3(room.door.x, 0, room.door.z)
}

export class Office3D {
  private renderer: THREE.WebGLRenderer
  private labels: CSS2DRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private clock = new THREE.Clock()
  private avatars = new Map<string, { avatar: Avatar; label: CSS2DObject; seatKey: string }>()
  private desks = new Map<string, DeskView>()
  private arcs: { mesh: THREE.Mesh; dot: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; born: number }[] = []
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private running = false
  private followKey: string | null = null
  private selectedKey: string | null = null
  private camGoal: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null
  private meetingSeats = new Map<string, number>()
  private filter: DepartmentId | null = null
  onSelect: (key: string | null) => void = () => {}

  constructor(private host: HTMLElement, quality: Quality) {
    this.renderer = new THREE.WebGLRenderer({ antialias: quality === 'high', powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 1.75 : 1))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = quality === 'high'
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(this.renderer.domElement)

    this.labels = new CSS2DRenderer()
    this.labels.domElement.className = 'labels-layer'
    host.appendChild(this.labels.domElement)

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400)
    this.camera.position.set(0, 52, 50)
    this.controls = new OrbitControls(this.camera, this.labels.domElement)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI * 0.46
    this.controls.minDistance = 6
    this.controls.maxDistance = 110
    this.controls.target.set(0, 0, 0)
    this.controls.addEventListener('start', () => {
      this.camGoal = null
    })

    this.scene.background = new THREE.Color(BRAND.navy)
    this.scene.fog = new THREE.Fog(BRAND.navy, 90, 190)
    this.buildLights(quality)
    this.buildBuilding()
    this.buildFurniture()

    this.labels.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e))
    this.labels.domElement.addEventListener('pointerup', (e) => this.onPointerUp(e))
    new ResizeObserver(() => this.resize()).observe(host)
    document.addEventListener('visibilitychange', () => (document.hidden ? this.pause() : this.resume()))
    this.resize()
  }

  /* ----------------------------------------------------------- construção -- */

  private buildLights(quality: Quality): void {
    this.scene.add(new THREE.HemisphereLight(0xdbe7ff, BRAND.navy2, 1.1))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(18, 40, 22)
    if (quality === 'high') {
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      const c = sun.shadow.camera
      c.left = -40
      c.right = 40
      c.top = 26
      c.bottom = -26
      c.far = 100
      sun.shadow.bias = -0.0005
    }
    this.scene.add(sun)
    const fill = new THREE.DirectionalLight(BRAND.cyan, 0.35)
    fill.position.set(-20, 15, -10)
    this.scene.add(fill)
  }

  private mat(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...extra })
  }

  private box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.scene): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  private buildBuilding(): void {
    // Piso geral grafite e base
    const W = OFFICE_BOUNDS.x1 - OFFICE_BOUNDS.x0 + 4
    const D = OFFICE_BOUNDS.z1 - OFFICE_BOUNDS.z0 + 4
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), this.mat(BRAND.graphite, { roughness: 0.6 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
    floor.position.z = (OFFICE_BOUNDS.z0 + OFFICE_BOUNDS.z1) / 2
    this.box(W + 1, 0.6, D + 1, this.mat(0x0b1630), 0, -0.31, floor.position.z).receiveShadow = false

    const floorColor: Partial<Record<DepartmentId, number>> = {
      executive: 0x13264f,
      reception: 0xe9eef6,
      meeting: 0x1a2c55,
      management: 0x223a66,
      lounge: 0x3a4250,
    }
    for (const r of ROOMS) {
      const w = r.x1 - r.x0
      const d = r.z1 - r.z0
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, d - 0.1), this.mat(floorColor[r.id] ?? 0x343a44, { roughness: 0.9 }))
      tile.rotation.x = -Math.PI / 2
      tile.position.set((r.x0 + r.x1) / 2, 0.01, (r.z0 + r.z1) / 2)
      tile.receiveShadow = true
      tile.userData.room = r.id
      this.scene.add(tile)
      this.buildWalls(r)

      const el = document.createElement('div')
      el.className = 'room-label'
      el.style.setProperty('--accent', DEPT_COLOR[r.id])
      el.textContent = r.code ? `${r.code} ${r.short}` : r.short
      el.title = r.label
      el.addEventListener('click', () => this.focusDepartment(r.id))
      const lbl = new CSS2DObject(el)
      lbl.position.set((r.x0 + r.x1) / 2, r.glass ? 2.9 : 1.4, (r.z0 + r.z1) / 2)
      this.scene.add(lbl)
    }

    // Faixa ciano no corredor (identidade Inter-Cool)
    const stripe = this.mat(BRAND.cyan, { emissive: BRAND.cyan, emissiveIntensity: 0.6 })
    this.box(68, 0.02, 0.12, stripe, 0, 0.02, CORRIDORS.north)
    this.box(68, 0.02, 0.12, stripe, 0, 0.02, CORRIDORS.south)
    for (const x of CORRIDORS.aisles) this.box(0.12, 0.02, CORRIDORS.south - CORRIDORS.north, stripe, x, 0.02, (CORRIDORS.north + CORRIDORS.south) / 2)
  }

  private buildWalls(r: Room): void {
    if (r.open) return
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fdcf0, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, transmission: 0 })
    const solid = this.mat(0xe6ebf2, { roughness: 0.9 })
    const frame = this.mat(BRAND.graphite2, { metalness: 0.4, roughness: 0.4 })
    const h = r.glass ? 2.6 : 1.15
    const m = r.glass ? glass : solid
    const door = doorOf(r)
    const segs: [number, number, number, number][] = [
      [r.x0, r.z0, r.x1, r.z0],
      [r.x1, r.z0, r.x1, r.z1],
      [r.x1, r.z1, r.x0, r.z1],
      [r.x0, r.z1, r.x0, r.z0],
    ]
    for (const [ax, az, bx, bz] of segs) {
      const horizontal = az === bz
      const onDoor = horizontal && Math.abs(az - door.z) < 0.01
      const pieces: [number, number][] = []
      const a = horizontal ? Math.min(ax, bx) : Math.min(az, bz)
      const b = horizontal ? Math.max(ax, bx) : Math.max(az, bz)
      const c = horizontal ? door.x : 0
      if (onDoor) {
        pieces.push([a, c - DOOR_GAP / 2], [c + DOOR_GAP / 2, b])
      } else pieces.push([a, b])
      for (const [p0, p1] of pieces) {
        const len = p1 - p0
        if (len <= 0.05) continue
        const mid = (p0 + p1) / 2
        const x = horizontal ? mid : ax
        const z = horizontal ? az : mid
        const wall = this.box(horizontal ? len : 0.1, h, horizontal ? 0.1 : len, m, x, h / 2, z)
        wall.castShadow = !r.glass
        if (r.glass) this.box(horizontal ? len : 0.12, 0.06, horizontal ? 0.12 : len, frame, x, h, z)
      }
    }
  }

  private buildFurniture(): void {
    const top = this.mat(0xf2f6fb, { roughness: 0.5 })
    const leg = this.mat(BRAND.graphite2, { metalness: 0.6, roughness: 0.35 })
    const chairM = this.mat(BRAND.navy2, { roughness: 0.6 })
    const monitorM = this.mat(0x111827, { metalness: 0.3, roughness: 0.4 })

    for (const desk of DESKS) {
      const g = new THREE.Group()
      g.position.set(desk.x, 0, desk.z)
      g.rotation.y = desk.rot
      const big = desk.reservedFor === 'ceo'
      const w = big ? 2.2 : 1.5
      // Mesa à frente do agente (direção -z local)
      this.box(w, 0.06, 0.8, big ? this.mat(0x2b2f36, { roughness: 0.3, metalness: 0.2 }) : top, 0, 0.76, -0.75, g)
      for (const sx of [-1, 1]) this.box(0.05, 0.74, 0.7, leg, sx * (w / 2 - 0.05), 0.37, -0.75, g)
      // Monitor
      this.box(0.06, 0.32, 0.06, leg, 0, 0.95, -0.95, g)
      this.box(0.9, 0.52, 0.04, monitorM, 0, 1.3, -0.97, g)
      const screen = new THREE.MeshStandardMaterial({ color: 0x050a14, emissive: 0x050a14, emissiveIntensity: 1, roughness: 0.3 })
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.46), screen)
      scr.position.set(0, 1.3, -0.945)
      g.add(scr)
      // Teclado
      this.box(0.5, 0.02, 0.16, monitorM, 0, 0.8, -0.55, g)
      // Cadeira
      this.box(0.55, 0.08, 0.55, chairM, 0, 0.48, 0.1, g)
      this.box(0.55, 0.6, 0.08, chairM, 0, 0.82, 0.38, g)
      this.box(0.06, 0.44, 0.06, leg, 0, 0.22, 0.1, g)
      this.scene.add(g)
      this.desks.set(desk.id, { desk, screen })
    }

    this.buildReception()
    this.buildMeetingRoom()
    this.buildExecutive()
    this.buildPlanning()
    this.buildPlants()
  }

  private logoTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#071634'
    g.fillRect(0, 0, c.width, c.height)
    g.strokeStyle = '#5CC3DD'
    g.lineWidth = 14
    g.lineCap = 'round'
    const cx = 130, cy = 128
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3
      g.beginPath()
      g.moveTo(cx - Math.cos(a) * 80, cy - Math.sin(a) * 80)
      g.lineTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80)
      g.stroke()
    }
    g.fillStyle = '#ffffff'
    g.font = '700 120px system-ui, sans-serif'
    g.textBaseline = 'middle'
    g.fillText('INTER-COOL', 250, 118)
    g.fillStyle = '#5CC3DD'
    g.font = '500 40px system-ui, sans-serif'
    g.fillText('AI COMPANY', 256, 205)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }

  private buildReception(): void {
    // Painel com a marca atrás do balcão, voltado para a entrada.
    this.box(9, 3.2, 0.12, this.mat(BRAND.navy), 0, 1.6, 4.2)
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshBasicMaterial({ map: this.logoTexture() }))
    logo.position.set(0, 2.15, 4.27)
    this.scene.add(logo)
    const counter = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.05, 40, 1, true, -Math.PI / 3.2, Math.PI / 1.6), this.mat(0xf2f6fb, { side: THREE.DoubleSide }))
    counter.position.set(0, 0.52, 4.6)
    counter.castShadow = true
    this.scene.add(counter)
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.22, 3.22, 0.08, 40, 1, true, -Math.PI / 3.2, Math.PI / 1.6), this.mat(BRAND.cyan, { emissive: BRAND.cyan, emissiveIntensity: 0.8, side: THREE.DoubleSide }))
    band.position.set(0, 0.85, 4.6)
    this.scene.add(band)
    const sofa = this.mat(BRAND.blue)
    for (const x of [-3.6, 3.6]) {
      this.box(1, 0.45, 2.6, sofa, x, 0.23, 12.5)
      this.box(0.25, 0.5, 2.6, sofa, x + (x < 0 ? -0.4 : 0.4), 0.6, 12.5)
    }
    // Painel de situação geral na recepção
    this.box(3.6, 1.9, 0.1, this.mat(0x0b1220, { emissive: BRAND.navy2, emissiveIntensity: 0.7 }), 0, 1.9, 15.8)
  }

  private buildMeetingRoom(): void {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 48), this.mat(0xf2f6fb, { roughness: 0.3 }))
    table.scale.set(3.6, 1, 1.7)
    table.position.set(-5, 0.76, -15.5)
    table.castShadow = true
    this.scene.add(table)
    this.box(0.4, 0.74, 0.4, this.mat(BRAND.graphite2), -5, 0.37, -15.5)
    const chairM = this.mat(BRAND.navy2)
    for (const s of MEETING_SEATS) {
      const g = new THREE.Group()
      g.position.set(s.x, 0, s.z)
      g.rotation.y = s.rot
      this.box(0.5, 0.08, 0.5, chairM, 0, 0.48, 0.1, g)
      this.box(0.5, 0.5, 0.08, chairM, 0, 0.78, 0.36, g)
      this.scene.add(g)
    }
    this.box(6, 2.4, 0.08, this.mat(0x0b1220, { emissive: BRAND.navy2, emissiveIntensity: 0.6 }), -5, 1.8, -19.85)
  }

  private buildExecutive(): void {
    const sofa = this.mat(0xe6ebf2)
    this.box(1, 0.45, 2.6, sofa, 33.6, 0.23, -13.8)
    this.box(0.25, 0.6, 2.6, sofa, 34.1, 0.6, -13.8)
    this.box(0.8, 0.4, 1.4, this.mat(BRAND.graphite2), 32.2, 0.2, -13.8)
    const shelf = this.mat(BRAND.graphite)
    this.box(3.4, 2.2, 0.4, shelf, 30, 1.1, -19.7)
    const books = [BRAND.cyan, BRAND.blue2, 0xf2f6fb, BRAND.blue]
    for (let i = 0; i < 14; i++) this.box(0.18, 0.4, 0.3, this.mat(books[i % 4]), 28.6 + (i % 7) * 0.42, 0.7 + Math.floor(i / 7) * 0.8, -19.6)
  }

  private buildPlanning(): void {
    const board = this.mat(0xf8fafc, { roughness: 0.4 })
    const colors = [0xfacc15, 0x5cc3dd, 0x4ade80, 0xf472b6]
    for (const [x, z, rot] of [[5.1, -15.5, Math.PI / 2], [14.9, -15.5, -Math.PI / 2]] as const) {
      const g = new THREE.Group()
      g.position.set(x, 0, z)
      g.rotation.y = rot
      this.box(3.6, 1.6, 0.06, board, 0, 1.6, 0, g)
      for (let i = 0; i < 9; i++) this.box(0.32, 0.32, 0.02, this.mat(colors[i % 4]), -1.2 + (i % 3) * 1.2, 1.2 + Math.floor(i / 3) * 0.42, 0.05, g)
      this.scene.add(g)
    }
    // Copa: sofás, mesa e máquina de café
    const sofa = this.mat(BRAND.blue2)
    this.box(4, 0.45, 1, sofa, 22, 0.23, 11.8)
    this.box(4, 0.6, 0.25, sofa, 22, 0.6, 12.3)
    this.box(2, 0.4, 1, this.mat(0xf2f6fb), 22, 0.2, 10)
    this.box(2.4, 1, 0.7, this.mat(BRAND.graphite2), 31, 0.5, 5)
    this.box(0.6, 0.7, 0.5, this.mat(0x111827), 31, 1.35, 5)
    for (const [x, z] of [[27, 9], [29, 9]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 20), this.mat(0xf2f6fb))
      t.position.set(x, 0.75, z)
      this.scene.add(t)
      this.box(0.08, 0.74, 0.08, this.mat(BRAND.graphite2), x, 0.37, z)
    }
  }

  private buildPlants(): void {
    const pot = this.mat(0xf2f6fb)
    const leaf = this.mat(0x2f855a)
    for (const [x, z] of [[-34, -19], [34, -19], [-34, 12], [34, 12], [-4.5, 15], [4.5, 15], [-15, CORRIDORS.north], [15, CORRIDORS.south], [17, 6], [33, 10]]) {
      this.box(0.5, 0.5, 0.5, pot, x, 0.25, z)
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), leaf)
      bush.position.set(x, 0.95, z)
      bush.castShadow = true
      this.scene.add(bush)
    }
  }

  /* ------------------------------------------------------------- agentes -- */

  private seatFor(a: OfficeAgent): { seat: Seat; key: string } {
    if (a.state === 'meeting') {
      let idx = this.meetingSeats.get(a.key)
      if (idx === undefined) {
        const used = new Set(this.meetingSeats.values())
        idx = MEETING_SEATS.findIndex((_, i) => !used.has(i))
        if (idx < 0) idx = 0
        this.meetingSeats.set(a.key, idx)
      }
      const s = MEETING_SEATS[idx]
      return { seat: s, key: `meeting-${idx}` }
    }
    this.meetingSeats.delete(a.key)
    const d = this.desks.get(a.deskId)?.desk
    if (!d) return { seat: { x: 0, z: 14, rot: 0 }, key: 'overflow' }
    return { seat: { x: d.x, z: d.z, rot: d.rot }, key: d.id }
  }

  private route(from: THREE.Vector3, to: Seat): THREE.Vector3[] {
    const a = roomAt(from.x, from.z)
    const b = roomAt(to.x, to.z)
    if (a && b && a.id === b.id) return []
    const pts: THREE.Vector3[] = []
    const za = a ? a.corridorZ : from.z
    const zb = b ? b.corridorZ : to.z
    if (a) pts.push(doorOf(a), new THREE.Vector3(a.door.x, 0, za))
    if (za !== zb) {
      const mid = (from.x + to.x) / 2
      const aisle = CORRIDORS.aisles.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best))
      pts.push(new THREE.Vector3(aisle, 0, za), new THREE.Vector3(aisle, 0, zb))
    }
    if (b) pts.push(new THREE.Vector3(b.door.x, 0, zb), doorOf(b))
    return pts
  }

  update(agents: OfficeAgent[]): void {
    const present = new Set(agents.map((a) => a.key))
    for (const [k, v] of this.avatars) {
      if (!present.has(k)) {
        this.scene.remove(v.avatar.root)
        v.label.element.remove()
        v.avatar.root.remove(v.label)
        v.avatar.dispose()
        this.avatars.delete(k)
        this.meetingSeats.delete(k)
      }
    }
    const occupied = new Map<string, OfficeAgent>()
    for (const a of agents) {
      let v = this.avatars.get(a.key)
      const { seat, key: seatKey } = this.seatFor(a)
      if (!v) {
        const avatar = new Avatar(a.key, DEPT_COLOR[a.department])
        avatar.placeAt(seat)
        const el = document.createElement('div')
        el.className = 'agent-label'
        el.addEventListener('click', () => this.onSelect(a.key))
        const label = new CSS2DObject(el)
        // Alturas alternadas para que rótulos de mesas vizinhas não se sobreponham.
        label.position.y = 2.45 + (Math.abs(Math.round(seat.x / 1.6)) % 2 === 0 ? 0 : 0.85)
        avatar.root.add(label)
        this.scene.add(avatar.root)
        v = { avatar, label, seatKey }
        this.avatars.set(a.key, v)
      } else if (v.seatKey !== seatKey) {
        v.avatar.walkTo(seat, this.route(v.avatar.position, seat))
        v.seatKey = seatKey
      }
      const lookAt = a.delegation?.to?.[0] ? this.avatars.get(a.delegation.to[0])?.avatar.position ?? null : null
      v.avatar.setState(a.state, a.progress, lookAt)
      v.avatar.setSelected(a.key === this.selectedKey)
      const meta = STATE_META[a.state]
      const el = v.label.element
      el.style.setProperty('--state', meta.color)
      el.classList.toggle('dim', this.filter !== null && a.department !== this.filter)
      el.classList.toggle('sel', a.key === this.selectedKey)
      el.classList.toggle('alert', ['blocked', 'error', 'awaiting_approval'].includes(a.state))
      // De longe, especialistas ociosos ficam sem rótulo; líderes e quem tem atividade continuam visíveis.
      el.classList.toggle('quiet', a.state === 'idle' && !['ceo', 'manager', 'director'].includes(a.role))
      el.innerHTML = `<b>${esc(a.name)}</b><span>${esc(a.title)}</span><i>${meta.icon} ${esc(meta.label)}${a.progress != null && a.progress > 0 && a.progress < 100 ? ` · ${a.progress}%` : ''}</i>`
      v.avatar.root.visible = this.filter === null || a.department === this.filter || a.state === 'meeting'
      if (v.avatar.root.visible === false) v.label.element.style.display = 'none'
      else v.label.element.style.display = ''
      if (seatKey !== 'overflow' && !seatKey.startsWith('meeting')) occupied.set(seatKey, a)
    }
    // Monitores refletem o estado do ocupante; mesa vazia = monitor desligado.
    for (const [id, dv] of this.desks) {
      const a = occupied.get(id)
      const color = !a || a.state === 'offline' ? 0x050a14 : a.state === 'idle' ? 0x0f2f72 : new THREE.Color(STATE_META[a.state].color).getHex()
      dv.screen.emissive.setHex(color)
      dv.screen.emissiveIntensity = !a || a.state === 'offline' ? 0.2 : a.state === 'idle' ? 0.6 : 1.4
    }
  }

  /** Arco animado de delegação/comunicação entre dois agentes (evento real). */
  showDelegation(fromKey: string, toKey: string): void {
    const a = this.avatars.get(fromKey)?.avatar.position
    const b = this.avatars.get(toKey)?.avatar.position
    if (!a || !b) return
    const p0 = a.clone().setY(1.9)
    const p2 = b.clone().setY(1.9)
    const mid = p0.clone().add(p2).multiplyScalar(0.5)
    mid.y += 2 + p0.distanceTo(p2) * 0.18
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2)
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.035, 6, false), new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.85 }))
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    this.scene.add(mesh, dot)
    this.arcs.push({ mesh, dot, curve, born: this.clock.elapsedTime })
  }

  /* ------------------------------------------------------------- câmera -- */

  select(key: string | null): void {
    this.selectedKey = key
    for (const [k, v] of this.avatars) v.avatar.setSelected(k === key)
  }

  follow(key: string | null): void {
    this.followKey = key
    if (key) {
      const p = this.avatars.get(key)?.avatar.position
      if (p) this.camGoal = { pos: p.clone().add(new THREE.Vector3(5, 7, 8)), target: p.clone().setY(1) }
    }
  }

  focusDepartment(id: DepartmentId | null): void {
    this.filter = id
    if (!id) {
      this.camGoal = { pos: new THREE.Vector3(0, 52, 50), target: new THREE.Vector3(0, 0, -2) }
      return
    }
    const r = ROOMS.find((x) => x.id === id)!
    const c = new THREE.Vector3((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2)
    this.camGoal = { pos: c.clone().add(new THREE.Vector3(0, 14, 13)), target: c }
  }

  zoom(factor: number): void {
    const dir = this.camera.position.clone().sub(this.controls.target)
    const len = THREE.MathUtils.clamp(dir.length() * factor, this.controls.minDistance, this.controls.maxDistance)
    this.camGoal = { pos: this.controls.target.clone().add(dir.setLength(len)), target: this.controls.target.clone() }
  }

  rotate(angle: number): void {
    const dir = this.camera.position.clone().sub(this.controls.target)
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
    this.camGoal = { pos: this.controls.target.clone().add(dir), target: this.controls.target.clone() }
  }

  private downAt = { x: 0, y: 0 }
  private onPointerDown(e: PointerEvent): void {
    this.downAt = { x: e.clientX, y: e.clientY }
  }

  private onPointerUp(e: PointerEvent): void {
    if (Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 6) return
    if ((e.target as HTMLElement).closest('.agent-label, .room-label')) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const objs = [...this.avatars.values()].filter((v) => v.avatar.root.visible).flatMap((v) => v.avatar.pickables)
    const hit = this.raycaster.intersectObjects(objs, false)[0]
    this.onSelect(hit ? (hit.object.userData.agentKey as string) : null)
  }

  /* -------------------------------------------------------------- render -- */

  private resize(): void {
    const w = this.host.clientWidth || 1
    const h = this.host.clientHeight || 1
    this.renderer.setSize(w, h)
    this.labels.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.clock.getDelta()
    this.renderer.setAnimationLoop(() => this.frame())
  }

  pause(): void {
    this.renderer.setAnimationLoop(null)
  }

  resume(): void {
    if (this.running) {
      this.clock.getDelta()
      this.renderer.setAnimationLoop(() => this.frame())
    }
  }

  stop(): void {
    this.running = false
    this.renderer.setAnimationLoop(null)
  }

  private frame(): void {
    const dt = Math.min(0.05, this.clock.getDelta())
    for (const v of this.avatars.values()) v.avatar.update(dt)

    const now = this.clock.elapsedTime
    this.arcs = this.arcs.filter((arc) => {
      const age = now - arc.born
      if (age > 4) {
        this.scene.remove(arc.mesh, arc.dot)
        arc.mesh.geometry.dispose()
        return false
      }
      arc.dot.position.copy(arc.curve.getPoint(Math.min(1, age / 1.6)))
      ;(arc.mesh.material as THREE.MeshBasicMaterial).opacity = age < 3 ? 0.85 : 0.85 * (4 - age)
      return true
    })

    if (this.followKey) {
      const p = this.avatars.get(this.followKey)?.avatar.position
      if (p) {
        const delta = p.clone().setY(1).sub(this.controls.target)
        this.controls.target.add(delta.multiplyScalar(Math.min(1, dt * 3)))
        this.camera.position.add(delta)
      }
    }
    if (this.camGoal) {
      const k = Math.min(1, dt * 3.5)
      this.camera.position.lerp(this.camGoal.pos, k)
      this.controls.target.lerp(this.camGoal.target, k)
      if (this.camera.position.distanceTo(this.camGoal.pos) < 0.05) this.camGoal = null
    }
    this.controls.update()
    // De longe, rótulos compactos (nome + cor do estado); detalhes ao aproximar ou passar o mouse.
    this.labels.domElement.classList.toggle('far', this.camera.position.distanceTo(this.controls.target) > 34)
    this.renderer.render(this.scene, this.camera)
    this.labels.render(this.scene, this.camera)
  }

  dispose(): void {
    this.stop()
    this.renderer.dispose()
    this.host.innerHTML = ''
  }
}
