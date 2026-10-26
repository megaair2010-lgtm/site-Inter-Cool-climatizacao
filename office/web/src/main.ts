import './styles.css'
import { ROOMS } from '../../shared/layout'
import type { AgentDetail, DepartmentId, OfficeAgent, OfficeEvent, OfficeTask } from '../../shared/types'
import { STATE_META, TASK_META, ago, esc } from './meta'
import { store } from './store'
import { renderKanban, renderList, renderPlan } from './view2d'
import { PixelOffice } from './viewPixel'
import type { Office3D } from './scene3d'

type View = '3d' | '2d' | 'list' | 'kanban' | 'pixel'

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T
const ui = {
  metrics: $('#metrics'),
  search: $<HTMLInputElement>('#search'),
  results: $('#search-results'),
  dept: $<HTMLSelectElement>('#dept'),
  views: $('#views'),
  conn: $('#conn'),
  stageMsg: $('#state-msg'),
  panel: $('#panel'),
  modal: $<HTMLDialogElement>('#modal'),
  login: $<HTMLDialogElement>('#login'),
  cam: $('#cam'),
  banner: $('#demo-banner'),
}

let view: View = initialView()
let office: Office3D | null = null
let pixelOffice: PixelOffice | null = null
let loading3d: Promise<void> | null = null
let filter: DepartmentId | null = null
let selected: string | null = null
let detail: AgentDetail | null = null
let detailAt = 0
let openTaskKey: string | null = null

function canWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function initialView(): View {
  try {
    const saved = localStorage.getItem('office_view') as View | null
    if (saved) return saved
  } catch {
    /* sem storage */
  }
  const weak = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (!canWebGL() || window.innerWidth < 760 || (weak !== undefined && weak < 4)) return '2d'
  return '3d'
}

/* ------------------------------------------------------------------ views -- */

async function setView(v: View) {
  if (v === '3d' && !canWebGL()) {
    toast('Este dispositivo não suporta WebGL. Use a visão 2D.')
    v = '2d'
  }
  view = v
  try {
    localStorage.setItem('office_view', v)
  } catch {
    /* ok */
  }
  for (const b of ui.views.querySelectorAll('button')) b.classList.toggle('on', b.dataset.view === v)
  for (const id of ['3d', '2d', 'list', 'kanban', 'pixel']) $(`#view${id}`).hidden = id !== v
  ui.cam.hidden = v !== '3d'
  if (v === '3d') {
    await ensure3d()
    office?.start()
  } else office?.stop()
  if (v === 'pixel') ensurePixel()
  render()
}

function ensurePixel() {
  if (pixelOffice) return
  pixelOffice = new PixelOffice($('#viewpixel'))
  pixelOffice.onSelect = (k) => (k ? openAgent(k) : closePanel())
}

function ensure3d(): Promise<void> {
  if (office) return Promise.resolve()
  if (!loading3d) {
    showMsg('Carregando escritório 3D…')
    // Carregamento sob demanda: quem usa só a visão 2D não baixa o three.js.
    loading3d = import('./scene3d').then(({ Office3D }) => {
      const quality = window.innerWidth < 1100 || (navigator.hardwareConcurrency ?? 8) < 4 ? 'low' : 'high'
      office = new Office3D($('#view3d'), quality)
      office.onSelect = (k) => (k ? openAgent(k) : closePanel())
      hideMsg()
    }).catch((e) => {
      showMsg(`Falha ao iniciar o 3D (${e.message}). Use a visão 2D.`)
    })
  }
  return loading3d
}

function visibleAgents(): OfficeAgent[] {
  return [...store.agents.values()]
}

function render() {
  const agents = visibleAgents()
  renderMetrics()
  ui.banner.hidden = store.mode !== 'demo'
  if (!agents.length && store.conn === 'live') {
    const down = store.sources.filter((s) => !s.ok)
    showMsg(down.length ? `Fonte indisponível: ${down.map((s) => `${s.name} (${s.error ?? 'sem resposta'})`).join(', ')}` : 'Nenhum agente cadastrado nas fontes conectadas. Crie agentes no Ruflo para vê-los aqui.')
  } else if (store.conn === 'live') hideMsg()

  if (view === '3d') office?.update(agents)
  else if (view === '2d') renderPlan($('#view2d'), agents, filter, selected)
  else if (view === 'list') renderList($('#viewlist'), filter ? agents.filter((a) => a.department === filter) : agents, store.tasks)
  else if (view === 'pixel') pixelOffice?.update(filter ? agents.filter((a) => a.department === filter) : agents, selected)
  else renderKanban($('#viewkanban'), [...store.tasks.values()].filter((t) => !filter || t.assignees.some((k) => store.agents.get(k)?.department === filter)), store.agents)

  renderSide()
  if (selected) refreshPanel()
  if (openTaskKey && ui.modal.open) void openTask(openTaskKey, true)
}

function renderMetrics() {
  const m = store.metrics
  if (!m) return
  const item = (label: string, value: number, cls = '') => `<div class="metric ${cls}"><b>${value}</b><span>${label}</span></div>`
  ui.metrics.innerHTML =
    item('Agentes ativos', m.agentsActive) +
    item('Trabalhando', m.agentsWorking, 'cyan') +
    item('Ociosos', m.agentsIdle) +
    item('Concluídas', m.tasksCompleted, 'ok') +
    item('Bloqueadas', m.tasksBlocked, m.tasksBlocked ? 'warn' : '') +
    item('Na fila', m.tasksQueued) +
    item('Reuniões', m.meetingsRunning) +
    item('Alertas', m.alerts, m.alerts ? 'bad' : '')
  const n = $('#alert-count')
  n.textContent = m.alerts ? String(m.alerts) : ''
}

/* ------------------------------------------------------------ painel lateral -- */

function renderSide() {
  const feed = $('#tab-activity')
  const evs = store.events.slice(-80).reverse()
  feed.innerHTML = evs.map(eventRow).join('') || '<p class="muted">Sem atividade registrada ainda.</p>'

  const queue = [...store.tasks.values()].filter((t) => t.status === 'queued' || t.status === 'running')
  $('#tab-queue').innerHTML = queue.length ? queue.map(taskRow).join('') : '<p class="muted">Fila vazia.</p>'

  const alerts: string[] = []
  for (const s of store.sources) if (!s.ok) alerts.push(`<div class="alert bad"><b>Fonte ${esc(s.name)} indisponível</b><span>${esc(s.error)}</span></div>`)
  for (const t of store.tasks.values()) {
    if (t.status === 'blocked' || t.status === 'awaiting_approval' || t.status === 'failed') {
      alerts.push(`<div class="alert ${t.status === 'failed' ? 'bad' : 'warn'}" data-task="${esc(t.key)}"><b>${TASK_META[t.status].label}: ${esc(t.title)}</b><span>${esc(t.reason ?? t.error ?? '')}</span></div>`)
    }
  }
  $('#tab-alerts').innerHTML = alerts.join('') || '<p class="muted">Nenhum alerta operacional.</p>'
}

function agentName(k?: string | null) {
  return k ? store.agents.get(k)?.name ?? k.split(':').slice(1).join(':') : ''
}

function eventRow(e: OfficeEvent) {
  const cls = e.type.startsWith('task.failed') || e.type === 'source.down' ? 'bad' : e.type === 'task.blocked' || e.type === 'task.awaiting_approval' ? 'warn' : e.type === 'task.completed' ? 'ok' : e.type === 'task.delegated' ? 'del' : ''
  return `<div class="ev ${cls}" ${e.taskKey ? `data-task="${esc(e.taskKey)}"` : e.agentKey ? `data-agent="${esc(e.agentKey)}"` : ''}><time>${new Date(e.at).toLocaleTimeString('pt-BR')}</time><span>${esc(e.summary)}</span></div>`
}

function taskRow(t: OfficeTask) {
  const meta = TASK_META[t.status]
  return `<div class="trow" data-task="${esc(t.key)}"><span class="chip" style="--c:${meta.color}">${meta.label}</span><p>${esc(t.title)}</p><small>${esc(t.assignees.map(agentName).join(', ') || 'sem responsável')}${t.progress != null && t.status === 'running' ? ` · ${t.progress}%` : ''}</small></div>`
}

/* -------------------------------------------------------------- painel do agente -- */

async function openAgent(key: string) {
  selected = key
  office?.select(key)
  ui.panel.hidden = false
  document.body.classList.add('panel-open')
  detail = null
  refreshPanel(true)
}

function closePanel() {
  selected = null
  detail = null
  office?.select(null)
  office?.follow(null)
  ui.panel.hidden = true
  document.body.classList.remove('panel-open')
  if (view === '2d') render()
}

async function refreshPanel(force = false) {
  if (!selected) return
  const key = selected
  if (force || Date.now() - detailAt > 2000) {
    detailAt = Date.now()
    try {
      detail = await store.api<AgentDetail>(`/api/office/agents/${encodeURIComponent(key)}`)
    } catch (e) {
      ui.panel.innerHTML = `<button class="close" data-act="close">×</button><p class="muted">Agente indisponível: ${esc((e as Error).message)}</p>`
      return
    }
  }
  if (!detail || selected !== key) return
  const a = store.agents.get(key) ?? detail.agent
  const meta = STATE_META[a.state]
  const cur = a.currentTaskKey ? store.tasks.get(a.currentTaskKey) : null
  const results = detail.tasks.filter((t) => t.status === 'done' && t.result && t.assignees.includes(key)).slice(0, 5)
  const problems = detail.tasks.filter((t) => (t.status === 'failed' || t.status === 'blocked' || t.status === 'awaiting_approval') && t.assignees.includes(key)).slice(0, 5)
  const op = store.canOperate()
  const caps = detail.capabilities
  const dept = ROOMS.find((r) => r.id === a.department)?.label ?? a.department

  ui.panel.innerHTML = `
    <button class="close" data-act="close" aria-label="Fechar">×</button>
    <header class="ph">
      <div class="avatar-dot" style="--c:${meta.color}">${esc(a.name.slice(0, 1))}</div>
      <div><h2>${esc(a.name)}</h2><p>${esc(a.title)}${a.title !== dept ? ` · ${esc(dept)}` : ''}</p></div>
    </header>
    <div class="state-line"><span class="chip big" style="--c:${meta.color}">${meta.icon} ${esc(meta.label)}</span><small>atualizado ${ago(a.updatedAt)}</small></div>
    <p class="evidence" title="Dado da fonte que sustenta o estado exibido">${esc(a.evidence)}</p>
    <p class="ids">ID ${esc(a.source)}: <code>${esc(a.id)}</code></p>

    ${a.role === 'ceo' ? ceoChat(a) : ''}

    <section><h3>Tarefa em andamento</h3>
      ${cur ? `<div class="task-card" data-task="${esc(cur.key)}"><p>${esc(cur.title)}</p>
        <small>${TASK_META[cur.status].label}${cur.fromAgent ? ` · delegada por ${esc(agentName(cur.fromAgent))}` : ''}</small>
        ${cur.progress != null ? `<div class="bar"><i style="width:${cur.progress}%"></i></div><small>${cur.progress}%</small>` : '<small class="muted">Progresso não informado pela fonte</small>'}
        ${cur.reason ? `<em>${esc(cur.reason)}</em>` : ''}</div>` : '<p class="muted">Nenhuma tarefa ativa registrada.</p>'}
      ${a.delegation?.to?.length ? `<p class="deleg">➜ Delegou para ${esc(a.delegation.to.map(agentName).join(', '))}</p>` : ''}
      <div class="actions">
        ${cur ? `<button data-act="follow">Acompanhar tarefa</button><button data-act="evidence" data-task="${esc(cur.key)}">Abrir evidências</button>` : ''}
        ${cur && op && caps.intervene ? `<button data-act="intervene" data-task="${esc(cur.key)}">Solicitar intervenção</button>` : ''}
        ${cur && op && caps.approve && (cur.status === 'awaiting_approval' || cur.status === 'blocked') ? `<button class="primary" data-act="approve" data-task="${esc(cur.key)}">Aprovar</button>` : ''}
        ${cur && op && caps.cancel && (cur.status === 'running' || cur.status === 'queued') ? `<button class="danger" data-act="cancel" data-task="${esc(cur.key)}">Cancelar</button>` : ''}
      </div>
    </section>

    <section><h3>Erros e bloqueios</h3>
      ${problems.length ? problems.map((t) => `<div class="alert ${t.status === 'failed' ? 'bad' : 'warn'}" data-task="${esc(t.key)}"><b>${TASK_META[t.status].label}: ${esc(t.title)}</b><span>${esc(t.error ?? t.reason ?? '')}</span>${op && caps.retry && t.status === 'failed' ? `<button data-act="retry" data-task="${esc(t.key)}">Repetir</button>` : ''}</div>`).join('') : '<p class="muted">Nenhum erro ou bloqueio.</p>'}
    </section>

    <section><h3>Resultados produzidos</h3>
      ${results.length ? results.map((t) => `<div class="result" data-task="${esc(t.key)}"><b>${esc(t.title)}</b><pre>${esc((t.result ?? '').slice(0, 400))}</pre></div>`).join('') : '<p class="muted">Nenhum resultado registrado ainda.</p>'}
    </section>

    <section><h3>Histórico recente</h3>
      <div class="feed">${detail.history.slice(0, 30).map(eventRow).join('') || '<p class="muted">Sem eventos desde que o escritório foi iniciado.</p>'}</div>
    </section>`
}

function ceoChat(ceo: OfficeAgent): string {
  const orders = [...store.tasks.values()].filter((t) => t.assignees.includes(ceo.key) && !t.parentKey).slice(0, 8)
  const tree = (t: OfficeTask, depth: number): string => {
    const kids = [...store.tasks.values()].filter((c) => c.parentKey === t.key)
    const meta = TASK_META[t.status]
    return `<li style="--d:${depth}" data-task="${esc(t.key)}"><span class="chip" style="--c:${meta.color}">${meta.label}</span> <b>${esc(t.assignees.map(agentName).join(', ') || '—')}</b> ${esc(t.title)}${t.progress != null && t.status === 'running' ? ` · ${t.progress}%` : ''}</li>${kids.map((k) => tree(k, depth + 1)).join('')}`
  }
  return `<section class="ceo-chat"><h3>Chat executivo</h3>
    <div class="orders">${orders.length ? orders.map((o) => `<div class="order"><p class="me">${esc(o.title)}</p><ul class="tree">${tree(o, 0)}</ul></div>`).join('') : '<p class="muted">Nenhuma ordem enviada ainda. A delegação aparece aqui conforme os agentes criam as subtarefas no Ruflo.</p>'}</div>
    ${store.canOperate() ? `<form class="send" data-act="order"><textarea name="text" rows="3" maxlength="2000" required placeholder="Escreva uma ordem para o CEO…"></textarea><div><select name="priority"><option value="normal">Prioridade normal</option><option value="high">Alta</option><option value="critical">Crítica</option><option value="low">Baixa</option></select><button class="primary">Enviar ordem</button></div></form>` : '<p class="muted">Seu papel é somente leitura.</p>'}
  </section>`
}

/* ------------------------------------------------------------- evidências -- */

async function openTask(key: string, silent = false) {
  openTaskKey = key
  try {
    const d = await store.api<{ task: OfficeTask; events: OfficeEvent[]; children: OfficeTask[] }>(`/api/office/tasks/${encodeURIComponent(key)}`)
    const t = d.task
    const meta = TASK_META[t.status]
    ui.modal.innerHTML = `<div class="modal-body">
      <button class="close" data-act="close-modal">×</button>
      <h2>${esc(t.title)}</h2>
      <p><span class="chip" style="--c:${meta.color}">${meta.label}</span> <small>${esc(t.source)} · <code>${esc(t.id)}</code> · tipo ${esc(t.type)}</small></p>
      <dl>
        <dt>Responsáveis</dt><dd>${esc(t.assignees.map(agentName).join(', ') || '—')}</dd>
        <dt>Delegada por</dt><dd>${esc(agentName(t.fromAgent) || '—')}</dd>
        <dt>Tarefa-mãe</dt><dd>${t.parentKey ? `<a href="#" data-task="${esc(t.parentKey)}">${esc(store.tasks.get(t.parentKey)?.title ?? t.parentKey)}</a>` : '—'}</dd>
        <dt>Criada</dt><dd>${t.createdAt ? new Date(t.createdAt).toLocaleString('pt-BR') : '—'}</dd>
        <dt>Iniciada</dt><dd>${t.startedAt ? new Date(t.startedAt).toLocaleString('pt-BR') : '—'}</dd>
        <dt>Concluída</dt><dd>${t.completedAt ? new Date(t.completedAt).toLocaleString('pt-BR') : '—'}</dd>
        <dt>Progresso</dt><dd>${t.progress != null ? `${t.progress}%` : 'não informado'}</dd>
      </dl>
      ${t.reason ? `<h3>Motivo</h3><p>${esc(t.reason)}</p>` : ''}
      ${t.error ? `<h3>Erro</h3><pre class="err">${esc(t.error)}</pre>` : ''}
      <h3>Resultado / evidências</h3>${t.result ? `<pre>${esc(t.result)}</pre>` : '<p class="muted">Nenhum resultado registrado pela fonte.</p>'}
      <p class="muted small">Senhas, tokens, cartões, CPF, e-mails e telefones são removidos antes de chegar à tela.</p>
      ${d.children.length ? `<h3>Subtarefas</h3>${d.children.map(taskRow).join('')}` : ''}
      <h3>Linha do tempo</h3><div class="feed">${d.events.map(eventRow).join('') || '<p class="muted">Sem eventos registrados desde o início do escritório.</p>'}</div>
    </div>`
    if (!silent && !ui.modal.open) ui.modal.showModal()
  } catch (e) {
    if (!silent) toast(`Não foi possível abrir a tarefa: ${(e as Error).message}`)
  }
}

/* -------------------------------------------------------------- comandos -- */

async function command(body: Record<string, unknown>, ok: string) {
  try {
    await store.api('/api/office/commands', { method: 'POST', body: JSON.stringify(body) })
    toast(ok)
    refreshPanel(true)
  } catch (e) {
    toast(`Comando recusado: ${(e as Error).message}`)
  }
}

document.addEventListener('click', (e) => {
  const el = e.target as HTMLElement
  const actEl = el.closest<HTMLElement>('[data-act]')
  const act = actEl?.dataset.act
  if (act === 'close') return closePanel()
  if (act === 'close-modal') {
    openTaskKey = null
    return ui.modal.close()
  }
  if (act === 'follow' && selected) {
    if (view !== '3d') void setView('3d').then(() => office?.follow(selected))
    else office?.follow(selected)
    const cur = store.agents.get(selected)?.currentTaskKey
    if (cur) void openTask(cur)
    return
  }
  if (act === 'evidence' && actEl?.dataset.task) return void openTask(actEl.dataset.task)
  if (act === 'intervene' && actEl?.dataset.task) {
    const note = prompt('Descreva a intervenção (será registrada na tarefa e na auditoria):')
    if (note && note.trim().length >= 3) void command({ type: 'intervene', taskKey: actEl.dataset.task, note }, 'Intervenção registrada')
    return
  }
  if (act === 'approve' && actEl?.dataset.task) return void command({ type: 'approve_task', taskKey: actEl.dataset.task }, 'Tarefa aprovada')
  if (act === 'cancel' && actEl?.dataset.task) {
    if (confirm('Cancelar esta tarefa no orquestrador?')) void command({ type: 'cancel_task', taskKey: actEl.dataset.task }, 'Tarefa cancelada')
    return
  }
  if (act === 'retry' && actEl?.dataset.task) return void command({ type: 'retry_task', taskKey: actEl.dataset.task }, 'Tarefa reenviada')

  const agentEl = el.closest<HTMLElement>('[data-agent]')
  if (agentEl && !el.closest('form')) {
    ui.results.hidden = true
    return void openAgent(agentEl.dataset.agent!)
  }
  const taskEl = el.closest<HTMLElement>('[data-task]')
  if (taskEl && !el.closest('form')) {
    e.preventDefault()
    return void openTask(taskEl.dataset.task!)
  }
  const room = el.closest<SVGElement>('[data-room]')
  if (room) {
    ui.dept.value = room.dataset.room!
    ui.dept.dispatchEvent(new Event('change'))
  }
})

document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement
  if (form.dataset.act !== 'order') return
  e.preventDefault()
  const data = new FormData(form)
  const text = String(data.get('text') ?? '').trim()
  if (text.length < 3) return
  void command({ type: 'order_ceo', text, priority: data.get('priority') }, 'Ordem enviada ao CEO').then(() => form.reset())
})

ui.views.addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest('button')?.dataset.view as View | undefined
  if (v) void setView(v)
})

ui.cam.addEventListener('click', (e) => {
  const c = (e.target as HTMLElement).closest('button')?.dataset.cam
  if (!office || !c) return
  if (c === 'in') office.zoom(0.75)
  if (c === 'out') office.zoom(1.33)
  if (c === 'left') office.rotate(0.5)
  if (c === 'right') office.rotate(-0.5)
  if (c === 'home') {
    office.follow(null)
    office.focusDepartment(filter)
  }
})

for (const r of ROOMS) ui.dept.insertAdjacentHTML('beforeend', `<option value="${r.id}">${esc(r.label)}</option>`)
ui.dept.addEventListener('change', () => {
  filter = (ui.dept.value || null) as DepartmentId | null
  office?.focusDepartment(filter)
  render()
})

ui.search.addEventListener('input', () => {
  const q = ui.search.value.trim().toLowerCase()
  if (!q) {
    ui.results.hidden = true
    return
  }
  const hits = visibleAgents().filter((a) => `${a.name} ${a.title} ${a.id}`.toLowerCase().includes(q)).slice(0, 8)
  ui.results.hidden = false
  ui.results.innerHTML = hits.length
    ? hits.map((a) => `<button data-agent="${esc(a.key)}"><span class="dot" style="background:${STATE_META[a.state].color}"></span>${esc(a.name)} <small>${esc(a.title)}</small></button>`).join('')
    : '<p class="muted">Nenhum agente encontrado.</p>'
})
ui.search.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') ui.results.querySelector<HTMLButtonElement>('button')?.click()
})

for (const b of document.querySelectorAll<HTMLButtonElement>('.side-tabs button')) {
  b.addEventListener('click', () => {
    for (const x of document.querySelectorAll<HTMLButtonElement>('.side-tabs button')) x.classList.toggle('on', x === b)
    for (const id of ['activity', 'queue', 'alerts']) $(`#tab-${id}`).hidden = id !== b.dataset.tab
  })
}

ui.modal.addEventListener('close', () => (openTaskKey = null))

/* ----------------------------------------------------------- utilidades -- */

function showMsg(text: string) {
  ui.stageMsg.textContent = text
  ui.stageMsg.hidden = false
}
function hideMsg() {
  ui.stageMsg.hidden = true
}

let toastTimer: number | undefined
function toast(text: string) {
  let el = document.querySelector<HTMLElement>('.toast')
  if (!el) {
    el = document.createElement('div')
    el.className = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = text
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el!.classList.remove('show'), 3500)
}

const CONN_LABEL = { connecting: 'Conectando…', live: 'Ao vivo', reconnecting: 'Reconectando…', offline: 'Sem conexão', unauthorized: 'Sem acesso' }

store.on({
  change: () => render(),
  event: (e, replay) => {
    if (replay) return
    if (e.type === 'task.delegated' && e.fromAgentKey && e.agentKey) office?.showDelegation(e.fromAgentKey, e.agentKey)
  },
  conn: (c) => {
    ui.conn.dataset.state = c
    ui.conn.textContent = CONN_LABEL[c]
    if (c === 'unauthorized') ui.login.showModal()
    if (c === 'reconnecting' || c === 'offline') showMsg(c === 'offline' ? 'Sem conexão com o servidor. Tentando de novo…' : 'Conexão perdida. Reconectando e recuperando o estado…')
  },
})

$('#login-form').addEventListener('submit', () => {
  store.setToken($<HTMLInputElement>('#token').value.trim())
  store.conn = 'connecting'
  void store.connect()
})

void setView(view)
void store.connect()
