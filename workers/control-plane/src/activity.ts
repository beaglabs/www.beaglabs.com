import { LIVE_PATH } from './activity-hub'
import { EVENT_FILTERS, type EventFilter, type EventRow } from './events'

/**
 * The Activity card: server-rendered first page, then /assets/activity.js
 * - opens a WebSocket to LIVE_PATH (the account's ActivityHub) and prepends each new event that matches the current
 *   filter and deployment scope; "● Live" shows the socket state;
 * - falls back to polling GET /api/events (every 5s while setup is in progress, every 30s otherwise) while the socket is
 *   down, reconnecting with exponential backoff;
 * - refreshes the setup checklist when a setup event arrives, switches filters and pages back.
 * Long messages clamp to two lines with a More/Less control. Untrusted text only ever becomes text nodes.
 */

/** Sources whose events change the setup checklist. */
export const STEP_SOURCES = ['deploy', 'address', 'dns', 'health', 'microsoft', 'registration', 'connect'] as const

export const ACTIVITY_SCRIPT_PATH = '/assets/activity.js'

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const LEVEL_LABEL: Record<string, { label: string; className: string }> = {
  ok: { label: 'OK', className: 'ok' },
  info: { label: 'INFO', className: 'info' },
  wait: { label: 'WAIT', className: 'warn' },
  error: { label: 'ERROR', className: 'err' },
}

const FILTER_LABELS: Record<EventFilter, string> = { all: 'All', deploy: 'Deploy', billing: 'Billing', team: 'Team', errors: 'Errors' }

export const eventRow = (event: EventRow) => {
  const level = LEVEL_LABEL[event.level] ?? LEVEL_LABEL.info!
  return `<tr data-id="${event.id}"><td class="t"><time datetime="${esc(event.at)}">${esc(event.at.slice(11, 19))}</time></td><td class="s"><span class="lv ${level.className}">${level.label}</span></td><td class="src">${esc(event.source)}</td><td class="msg"><span class="txt">${esc(event.message)}</span><button type="button" class="xp" data-expand aria-expanded="false" hidden>More</button></td></tr>`
}

const EMPTY_ROW = '<tr class="empty"><td colspan="4">No activity yet.</td></tr>'

/** Full-width Activity card. `endpoint` is GET /api/events with any fixed scope (e.g. ?deployment=…). */
export const activityCard = (input: { endpoint: string; events: EventRow[]; next: number | null; fast: boolean; deploymentId?: string | null }) => `<section class="card log" data-activity data-endpoint="${esc(input.endpoint)}" data-live-url="${LIVE_PATH}" data-filters="${esc(
  JSON.stringify(EVENT_FILTERS),
)}" data-step-sources="${STEP_SOURCES.join(',')}"${input.deploymentId ? ` data-deployment="${esc(input.deploymentId)}"` : ''} data-interval="${input.fast ? 5000 : 30000}"${input.next ? ` data-next="${input.next}"` : ''}>
<h4><span>Activity</span><span class="filters" role="group" aria-label="Filter activity">${(Object.keys(FILTER_LABELS) as EventFilter[])
  .map((filter) => `<button type="button" data-filter="${filter}"${filter === 'all' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>${FILTER_LABELS[filter]}</button>`)
  .join('')}<span class="live off" data-live role="status" aria-live="polite">○ Connecting</span></span></h4>
<div class="scroll"><table><tbody>${input.events.length ? input.events.map(eventRow).join('') : EMPTY_ROW}</tbody></table></div>
<div class="more"${input.next ? '' : ' hidden'}><button type="button" class="btn" data-more>Load older</button></div>
</section>`

/** Served at ACTIVITY_SCRIPT_PATH. Plain ES2020. */
export const ACTIVITY_JS = String.raw`(function () {
  'use strict'
  var card = document.querySelector('[data-activity]')
  if (!card || !window.fetch) return
  var endpoint = card.getAttribute('data-endpoint')
  var liveUrl = card.getAttribute('data-live-url')
  var scope = card.getAttribute('data-deployment')
  var FILTERS = {}
  try { FILTERS = JSON.parse(card.getAttribute('data-filters') || '{}') } catch (e) {}
  var STEP_SOURCES = (card.getAttribute('data-step-sources') || '').split(',')
  var interval = Number(card.getAttribute('data-interval')) || 30000
  var body = card.querySelector('tbody')
  var live = card.querySelector('[data-live]')
  var moreWrap = card.querySelector('.more')
  var moreButton = card.querySelector('[data-more]')
  var LEVELS = { ok: ['OK', 'ok'], info: ['INFO', 'info'], wait: ['WAIT', 'warn'], error: ['ERROR', 'err'] }
  var filter = 'all'
  var next = card.getAttribute('data-next') ? Number(card.getAttribute('data-next')) : null
  var timer = null
  var seq = 0
  var socket = null
  var attempts = 0
  var retryTimer = null
  var pingTimer = null
  var stepsTimer = null

  function pad(n) { return (n < 10 ? '0' : '') + n }
  function when(iso) {
    var d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    var clock = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
    return d.toDateString() === new Date().toDateString() ? clock : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + clock
  }
  function cell(className, child) {
    var td = document.createElement('td')
    td.className = className
    if (typeof child === 'string') td.textContent = child
    else td.appendChild(child)
    return td
  }
  function message(text) {
    var td = document.createElement('td')
    td.className = 'msg'
    var span = document.createElement('span')
    span.className = 'txt'
    span.textContent = text
    var button = document.createElement('button')
    button.type = 'button'
    button.className = 'xp'
    button.setAttribute('data-expand', '')
    button.setAttribute('aria-expanded', 'false')
    button.hidden = true
    button.textContent = 'More'
    td.appendChild(span)
    td.appendChild(button)
    return td
  }
  function row(e) {
    var tr = document.createElement('tr')
    tr.setAttribute('data-id', String(e.id))
    var time = document.createElement('time')
    time.setAttribute('datetime', e.at)
    time.textContent = when(e.at)
    var level = LEVELS[e.level] || LEVELS.info
    var badge = document.createElement('span')
    badge.className = 'lv ' + level[1]
    badge.textContent = level[0]
    tr.appendChild(cell('t', time))
    tr.appendChild(cell('s', badge))
    tr.appendChild(cell('src', e.source))
    tr.appendChild(message(e.message))
    return tr
  }
  /** Show "More" only on messages the two-line clamp actually cuts. */
  function fit(tr) {
    var td = tr.querySelector('td.msg')
    if (!td) return
    var txt = td.querySelector('.txt')
    var button = td.querySelector('.xp')
    if (!txt || !button) return
    if (td.classList.contains('open')) { button.hidden = false; return }
    button.hidden = txt.scrollHeight <= txt.clientHeight + 1
  }
  function fitAll() { Array.prototype.forEach.call(body.querySelectorAll('tr[data-id]'), fit) }
  function empty() {
    var tr = document.createElement('tr')
    tr.className = 'empty'
    var td = document.createElement('td')
    td.colSpan = 4
    td.textContent = 'No activity yet.'
    tr.appendChild(td)
    return tr
  }
  function url(params) {
    var query = 'filter=' + encodeURIComponent(filter)
    for (var key in params) if (params[key] != null) query += '&' + key + '=' + encodeURIComponent(params[key])
    return endpoint + (endpoint.indexOf('?') < 0 ? '?' : '&') + query
  }
  function get(params) {
    return fetch(url(params), { credentials: 'same-origin', headers: { accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('Activity unavailable')
      return r.json()
    })
  }
  function newest() {
    var first = body.querySelector('tr[data-id]')
    return first ? Number(first.getAttribute('data-id')) : null
  }
  function setMore() { moreWrap.hidden = next == null }
  function append(e) {
    var tr = row(e)
    body.appendChild(tr)
    fit(tr)
  }
  function replace(result) {
    body.replaceChildren()
    result.events.forEach(append)
    if (!result.events.length) body.appendChild(empty())
    next = result.next
    setMore()
  }
  /** Insert newest-first, skipping rows already shown (the socket and a poll can both deliver one event). */
  function prepend(e) {
    if (body.querySelector('tr[data-id="' + Number(e.id) + '"]')) return
    var placeholder = body.querySelector('tr.empty')
    if (placeholder) placeholder.remove()
    var tr = row(e)
    var rows = body.querySelectorAll('tr[data-id]')
    var before = null
    for (var i = 0; i < rows.length; i++) if (Number(rows[i].getAttribute('data-id')) < Number(e.id)) { before = rows[i]; break }
    body.insertBefore(tr, before)
    fit(tr)
  }
  function matches(e) {
    if (scope && e.deploymentId && e.deploymentId !== scope) return false
    var preset = FILTERS[filter] || {}
    if (preset.sources && preset.sources.indexOf(e.source) < 0) return false
    if (preset.levels && preset.levels.indexOf(e.level) < 0) return false
    return true
  }
  function poll() {
    var mine = seq
    var after = newest()
    var request = after == null ? get({}) : get({ after: after })
    return request.then(function (result) {
      if (mine !== seq) return
      if (after == null) return replace(result)
      result.events.slice().reverse().forEach(prepend)
    }).catch(function () {})
  }
  /** Poll often while the socket is down; only as a slow safety net while it is up. */
  function schedule() {
    clearTimeout(timer)
    if (document.visibilityState === 'hidden') return
    var every = socket && socket.readyState === 1 ? Math.max(interval, 60000) : interval
    timer = setTimeout(function () { poll().then(schedule) }, every)
  }
  function setLive(on) {
    live.textContent = on ? '● Live' : '○ Reconnecting'
    live.classList.toggle('off', !on)
    live.setAttribute('data-state', on ? 'open' : 'closed')
  }

  // Setup checklist: re-render it from the server when a setup event arrives (debounced).
  function refreshSteps() {
    var steps = document.querySelector('.checklist')
    if (!steps || !window.DOMParser) return
    clearTimeout(stepsTimer)
    stepsTimer = setTimeout(function () {
      fetch(location.pathname, { credentials: 'same-origin', headers: { accept: 'text/html' } }).then(function (r) {
        if (!r.ok) throw new Error('Page unavailable')
        return r.text()
      }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html')
        ;['.checklist', '.top', '.plan-card'].forEach(function (selector) {
          var fresh = doc.querySelector(selector)
          var current = document.querySelector(selector)
          if (fresh && current) current.replaceWith(document.importNode(fresh, true))
        })
      }).catch(function () {})
    }, 400)
  }
  function onEvent(e) {
    if (!e || e.id == null) return
    if (scope && e.deploymentId && e.deploymentId !== scope) return
    if (matches(e)) prepend(e)
    if (STEP_SOURCES.indexOf(e.source) >= 0 || e.source === 'billing') refreshSteps()
  }

  // Live socket with exponential backoff (1s → 30s, jittered).
  function connect() {
    if (!liveUrl || !window.WebSocket || socket || document.visibilityState === 'hidden') return
    var ws
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + liveUrl) } catch (e) { return retry() }
    socket = ws
    ws.onopen = function () {
      attempts = 0
      setLive(true)
      poll()
      schedule()
      clearInterval(pingTimer)
      pingTimer = setInterval(function () { if (ws.readyState === 1) ws.send('ping') }, 30000)
    }
    ws.onmessage = function (m) {
      if (m.data === 'pong') return
      var data
      try { data = JSON.parse(m.data) } catch (e) { return }
      if (data && data.type === 'event') onEvent(data.event)
    }
    ws.onclose = function () {
      if (socket === ws) socket = null
      clearInterval(pingTimer)
      setLive(false)
      schedule()
      retry()
    }
  }
  function retry() {
    clearTimeout(retryTimer)
    if (document.visibilityState === 'hidden') return
    var delay = Math.min(30000, 1000 * Math.pow(2, attempts++)) * (0.5 + Math.random() / 2)
    retryTimer = setTimeout(connect, delay)
  }

  Array.prototype.forEach.call(card.querySelectorAll('time[datetime]'), function (t) { t.textContent = when(t.getAttribute('datetime')) || t.textContent })
  Array.prototype.forEach.call(card.querySelectorAll('[data-filter]'), function (button) {
    button.addEventListener('click', function () {
      filter = button.getAttribute('data-filter')
      Array.prototype.forEach.call(card.querySelectorAll('[data-filter]'), function (b) {
        var on = b === button
        b.classList.toggle('on', on)
        b.setAttribute('aria-pressed', String(on))
      })
      var mine = ++seq
      get({}).then(function (result) { if (mine === seq) replace(result) }).catch(function () {})
    })
  })
  body.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-expand]') : null
    if (!button) return
    var td = button.parentNode
    var open = !td.classList.contains('open')
    td.classList.toggle('open', open)
    button.textContent = open ? 'Less' : 'More'
    button.setAttribute('aria-expanded', String(open))
  })
  moreButton.addEventListener('click', function () {
    if (next == null) return
    var mine = seq
    moreButton.disabled = true
    get({ before: next }).then(function (result) {
      if (mine !== seq) return
      result.events.forEach(append)
      next = result.next
      setMore()
    }).catch(function () {}).then(function () { moreButton.disabled = false })
  })
  var resizeTimer = null
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitAll, 150) })
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      clearTimeout(timer)
      clearTimeout(retryTimer)
      if (socket) socket.close()
      return
    }
    poll()
    schedule()
    connect()
  })
  fitAll()
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll)
  schedule()
  connect()
})()
`
