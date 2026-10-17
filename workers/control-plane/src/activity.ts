import type { EventFilter, EventRow } from './events'

/**
 * The Activity card: server-rendered first page, then /assets/activity.js polls GET /api/events (every 5s while setup is
 * in progress, every 30s otherwise), switches filters and pages back. Untrusted text only ever becomes text nodes.
 */

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
  return `<tr data-id="${event.id}"><td class="t"><time datetime="${esc(event.at)}">${esc(event.at.slice(11, 19))}</time></td><td class="s"><span class="lv ${level.className}">${level.label}</span></td><td class="src">${esc(event.source)}</td><td class="msg">${esc(event.message)}</td></tr>`
}

const EMPTY_ROW = '<tr class="empty"><td colspan="4">No activity yet.</td></tr>'

/** Full-width Activity card. `endpoint` is GET /api/events with any fixed scope (e.g. ?deployment=…). */
export const activityCard = (input: { endpoint: string; events: EventRow[]; next: number | null; fast: boolean }) => `<section class="card log" data-activity data-endpoint="${esc(input.endpoint)}" data-interval="${input.fast ? 5000 : 30000}"${input.next ? ` data-next="${input.next}"` : ''}>
<h4><span>Activity</span><span class="filters" role="group" aria-label="Filter activity">${(Object.keys(FILTER_LABELS) as EventFilter[])
  .map((filter) => `<button type="button" data-filter="${filter}"${filter === 'all' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>${FILTER_LABELS[filter]}</button>`)
  .join('')}<span class="live" data-live hidden>● Live</span></span></h4>
<div class="scroll"><table><tbody>${input.events.length ? input.events.map(eventRow).join('') : EMPTY_ROW}</tbody></table></div>
<div class="more"${input.next ? '' : ' hidden'}><button type="button" class="btn" data-more>Load older</button></div>
</section>`

/** Served at ACTIVITY_SCRIPT_PATH. Plain ES2020. */
export const ACTIVITY_JS = String.raw`(function () {
  'use strict'
  var card = document.querySelector('[data-activity]')
  if (!card || !window.fetch) return
  var endpoint = card.getAttribute('data-endpoint')
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
    tr.appendChild(cell('msg', e.message))
    return tr
  }
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
  function replace(result) {
    body.replaceChildren()
    result.events.forEach(function (e) { body.appendChild(row(e)) })
    if (!result.events.length) body.appendChild(empty())
    next = result.next
    setMore()
  }
  function poll() {
    var mine = seq
    var after = newest()
    var request = after == null ? get({}) : get({ after: after })
    return request.then(function (result) {
      if (mine !== seq) return
      if (after == null) return replace(result)
      if (!result.events.length) return
      var placeholder = body.querySelector('tr.empty')
      if (placeholder) placeholder.remove()
      var anchor = body.firstChild
      result.events.forEach(function (e) { body.insertBefore(row(e), anchor) })
    }).catch(function () {})
  }
  function schedule() {
    clearTimeout(timer)
    var visible = document.visibilityState !== 'hidden'
    live.hidden = !visible
    if (visible) timer = setTimeout(function () { poll().then(schedule) }, interval)
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
  moreButton.addEventListener('click', function () {
    if (next == null) return
    var mine = seq
    moreButton.disabled = true
    get({ before: next }).then(function (result) {
      if (mine !== seq) return
      result.events.forEach(function (e) { body.appendChild(row(e)) })
      next = result.next
      setMore()
    }).catch(function () {}).then(function () { moreButton.disabled = false })
  })
  document.addEventListener('visibilitychange', function () { if (document.visibilityState !== 'hidden') poll(); schedule() })
  schedule()
})()
`
