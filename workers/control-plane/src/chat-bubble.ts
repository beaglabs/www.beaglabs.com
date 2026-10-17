/**
 * The Beag Labs chat bubble on papyrus.beaglabs.com: the same conversations, inbox and API as the bubble in Papyrus
 * (papyrus/apps/web/src/ChatBubble.tsx, built on @papyrus/chat-ui). That package is React and lives in the papyrus repo,
 * so this is a small dependency-free port of its text-chat behaviour that reuses its `pcu-*` class names and styles.
 * Huddles and uploads stay in Papyrus; attachments sent from there still display here.
 *
 * The page renders an empty mount point; the script asks this Worker for a chat session (`POST /chat/session`) and
 * then talks to the license Worker's chat API directly, like Papyrus does.
 */

export const CHAT_SESSION_PATH = '/chat/session'
export const CHAT_SCRIPT_PATH = '/assets/chat-bubble.js'

/** Mount point plus script; only rendered for signed-in pages. */
export const chatBubbleMarkup = () =>
  `<div id="beag-chat" class="beag-chat pcu-root" data-session="${CHAT_SESSION_PATH}"></div><script src="${CHAT_SCRIPT_PATH}" defer></script>`

/** Trimmed from @papyrus/chat-ui styles.css and apps/web chat-bubble.css, on this site's fonts. */
export const CHAT_STYLES = `
.pcu-root{--pcu-accent:var(--accent,#ff5f1f);--pcu-ink:#111;--pcu-surface:#fff;--pcu-canvas:#f4f0e5;--pcu-muted:#68655f;--pcu-shadow-sm:2px 2px 0 #111;--pcu-radius:12px;--pcu-radius-sm:8px;--pcu-live:#e5213b;font-family:var(--sans);color:var(--pcu-ink)}
.pcu-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 12px;border:2px solid var(--pcu-ink);border-radius:var(--pcu-radius-sm);background:var(--pcu-surface);color:var(--pcu-ink);box-shadow:var(--pcu-shadow-sm);font:800 13px/1 var(--sans);cursor:pointer;transition:transform .08s,box-shadow .08s}
.pcu-button:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pcu-ink)}
.pcu-button:disabled{opacity:.5;cursor:not-allowed}
.pcu-button-accent{background:var(--pcu-accent)}.pcu-button-sm{min-height:28px;padding:4px 9px;font-size:12px}.pcu-button-block{width:100%}
.pcu-button:focus-visible,.pcu-conversation:focus-visible,.pcu-doc-chip:focus-visible{outline:3px solid var(--pcu-accent);outline-offset:2px}
.pcu-avatar{flex:none;display:inline-grid;place-items:center;overflow:hidden;width:40px;height:40px;border:2px solid var(--pcu-ink);border-radius:10px;background:var(--pcu-surface);font-weight:900;font-size:14px}
.pcu-avatar img{width:100%;height:100%;object-fit:cover}.pcu-avatar-sm{width:28px;height:28px;font-size:11px;border-radius:8px;background:var(--pcu-accent)}
.pcu-thread{list-style:none;margin:0;padding:14px 12px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;min-height:0;flex:1;background:var(--pcu-canvas)}
.pcu-thread-empty{display:grid;place-items:center;text-align:center;color:var(--pcu-muted);font-weight:700}
.pcu-thread-older{display:flex;justify-content:center}
.pcu-row{display:flex;align-items:flex-end;gap:8px;margin-top:6px}.pcu-row-grouped{margin-top:0}.pcu-row-own{justify-content:flex-end}.pcu-row-avatar{width:28px;flex:none}
.pcu-bubble-stack{display:flex;flex-direction:column;gap:4px;max-width:78%;min-width:0}.pcu-row-own .pcu-bubble-stack{align-items:flex-end}
.pcu-sender{font-size:11px;font-weight:800;color:var(--pcu-muted)}
.pcu-sender-tag{margin-left:6px;padding:1px 5px;border:1.5px solid var(--pcu-ink);border-radius:4px;background:var(--pcu-accent);color:#111;font:800 9px var(--mono);font-style:normal;text-transform:uppercase}
.pcu-bubble{padding:9px 12px;border:2px solid var(--pcu-ink);border-radius:14px 14px 14px 4px;background:var(--pcu-surface);box-shadow:var(--pcu-shadow-sm);font-size:14px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.pcu-bubble-own{border-radius:14px 14px 4px 14px;background:var(--pcu-accent)}
.pcu-meta{font:700 10px var(--mono);color:var(--pcu-muted)}.pcu-row-pending{opacity:.65}.pcu-row-pending[data-failed] .pcu-meta{color:var(--pcu-live)}
.pcu-system{align-self:center;margin:8px 0;padding:6px 10px;border:2px dashed var(--pcu-ink);border-radius:var(--pcu-radius-sm);background:var(--pcu-surface);font-size:12px;font-weight:700;text-align:center}
.pcu-typing{color:var(--pcu-muted);font-size:12px;font-weight:700}
.pcu-media{display:block;max-width:100%;max-height:260px;border:2px solid var(--pcu-ink);border-radius:var(--pcu-radius-sm);box-shadow:var(--pcu-shadow-sm);background:var(--pcu-surface)}
.pcu-doc-chip{display:inline-flex;align-items:center;gap:8px;max-width:280px;padding:6px 10px;border:2px solid var(--pcu-ink);border-radius:var(--pcu-radius-sm);background:var(--pcu-surface);box-shadow:var(--pcu-shadow-sm);font:800 13px var(--sans);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pcu-composer{display:flex;align-items:flex-end;gap:6px;padding:10px;border-top:3px solid var(--pcu-ink);background:var(--pcu-surface)}
.pcu-composer textarea{flex:1;min-width:0;min-height:36px;max-height:140px;padding:8px 10px;border:2px solid var(--pcu-ink);border-radius:var(--pcu-radius-sm);font:14px/1.35 var(--sans);resize:none}
.pcu-composer textarea:focus{outline:none;box-shadow:var(--pcu-shadow-sm)}
.pcu-conversations{display:flex;flex-direction:column;gap:10px;padding:12px}
.pcu-conversations ul{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.pcu-conversation{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;border:2px solid var(--pcu-ink);border-radius:var(--pcu-radius);background:var(--pcu-surface);box-shadow:var(--pcu-shadow-sm);font:800 14px var(--sans);text-align:left;cursor:pointer}
.pcu-conversation:hover{background:var(--pcu-canvas)}
.pcu-conversation-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pcu-badge{min-width:22px;height:22px;display:inline-grid;place-items:center;padding:0 6px;border:2px solid var(--pcu-ink);border-radius:999px;background:var(--pcu-live);color:#fff;font:900 11px/1 var(--mono)}
.pcu-tag{padding:2px 6px;border:2px solid var(--pcu-ink);border-radius:6px;font:900 9px var(--mono);text-transform:uppercase;background:#ffd36e}
.beag-chat{position:fixed;right:20px;bottom:20px;z-index:90;display:flex;flex-direction:column;align-items:flex-end;gap:14px;pointer-events:none}
.beag-chat>*{pointer-events:auto}
.beag-chat-launcher{position:relative;width:58px;height:58px;display:grid;place-items:center;border:3px solid #111;border-radius:18px;background:var(--pcu-accent);color:#111;box-shadow:4px 4px 0 #111;font-size:26px;line-height:1;cursor:pointer;transition:transform .1s,box-shadow .1s}
.beag-chat-launcher:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #111}
.beag-chat-launcher:focus-visible{outline:3px solid #111;outline-offset:3px}
.beag-chat-launcher .pcu-badge{position:absolute;top:-9px;right:-9px}
.beag-chat-panel{width:min(400px,calc(100vw - 24px));height:min(640px,calc(100vh - 110px));display:flex;flex-direction:column;overflow:hidden;border:3px solid #111;border-radius:18px;background:#fff;box-shadow:6px 6px 0 #111}
.beag-chat-header{flex:none;display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:3px solid #111;background:#000;color:#fff}
.beag-chat-header .pcu-avatar{border-color:#fff}
.beag-chat-manager{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.beag-chat-manager strong{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.beag-chat-manager small{font-size:12px;font-weight:600;opacity:.85}
.beag-chat-back,.beag-chat-close{width:32px;height:32px;flex:none;display:grid;place-items:center;border:2px solid #fff;border-radius:9px;background:#fff;color:#111;font-size:18px;font-weight:900;line-height:1;cursor:pointer}
.beag-chat-home{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;background:var(--pcu-canvas)}
.beag-chat-help{margin:4px 12px 12px;padding:12px;border:2px dashed #111;border-radius:12px;background:#fff}
.beag-chat-help p{margin:0 0 8px;font-size:13px;font-weight:700}
.beag-chat-notice{margin:8px 12px;padding:8px 10px;border:2px solid #111;border-radius:8px;background:#ffd36e;font-size:12px;font-weight:700}
.beag-chat-conversation{flex:1;min-height:0;display:flex;flex-direction:column}
.beag-chat-subheader{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:8px 12px;border-bottom:2px solid #111}
.beag-chat-subheader strong{font-size:13px}.beag-chat-subheader small{flex-basis:100%;order:3;color:var(--pcu-muted);font-size:11px;font-weight:700}
.beag-chat-subheader .pcu-button{margin-left:auto}
@media (max-width:520px){.beag-chat{right:12px;bottom:12px}.beag-chat-panel{height:calc(100vh - 96px)}}
@media (prefers-reduced-motion:reduce){.pcu-button,.beag-chat-launcher{transition:none}}
`

/** Served at CHAT_SCRIPT_PATH. Plain ES2020, no template literals (this file holds it in one). */
export const CHAT_BUBBLE_JS = String.raw`(function () {
  'use strict'
  var root = document.getElementById('beag-chat')
  if (!root || !window.fetch || !window.WebSocket) return
  var POLL_MS = 30000, PING_MS = 25000, REFRESH_MARGIN_MS = 5 * 60000, TYPING_TTL_MS = 4000, TYPING_THROTTLE_MS = 3000

  // ---- Session (refreshed through this site, like Papyrus's ChatSessionTokens) ----
  var session = null, inflight = null
  function ensureSession() {
    if (session && Date.parse(session.expiresAt) - REFRESH_MARGIN_MS > Date.now()) return Promise.resolve(session)
    if (!inflight) {
      inflight = fetch(root.getAttribute('data-session'), { method: 'POST', credentials: 'same-origin', headers: { accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('Chat is unavailable right now.'); return r.json() })
        .then(function (next) { session = next; return next })
        .finally(function () { inflight = null })
    }
    return inflight
  }
  function token() { return ensureSession().then(function (s) { return s.token }) }
  function api(path) { return /^https?:/i.test(path) ? path : session.apiOrigin.replace(/\/+$/, '') + path }
  function request(method, path, body) {
    return token().then(function (t) {
      var headers = { accept: 'application/json', authorization: 'Bearer ' + t }
      if (body !== undefined) headers['content-type'] = 'application/json'
      return fetch(api(path), { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body) })
    }).then(function (r) {
      if (r.ok) return r.status === 204 ? null : r.text().then(function (text) { return text ? JSON.parse(text) : null })
      return r.json().catch(function () { return {} }).then(function (e) { throw new Error(e.message || 'Request failed (' + r.status + ')') })
    })
  }

  // ---- DOM helpers (untrusted values only ever become text nodes) ----
  function h(tag, attrs, children) {
    var el = document.createElement(tag)
    for (var key in attrs || {}) {
      var value = attrs[key]
      if (value == null || value === false) continue
      if (key === 'text') el.textContent = value
      else if (key.slice(0, 2) === 'on') el.addEventListener(key.slice(2), value)
      else el.setAttribute(key, value === true ? '' : value)
    }
    ;(children || []).forEach(function (child) { if (child) el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child) })
    return el
  }
  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/).filter(Boolean)
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '?').slice(0, 2)).toUpperCase()
  }
  function avatar(name, photoUrl, size) {
    return h('span', { class: 'pcu-avatar' + (size === 'sm' ? ' pcu-avatar-sm' : '') }, [photoUrl ? h('img', { src: api(photoUrl), alt: name }) : h('span', { 'aria-hidden': 'true', text: initials(name) })])
  }
  function time(value) { var d = new Date(value); return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }

  // ---- State ----
  var state = { open: false, conversations: [], manager: null, notice: null, busy: false }
  var thread = null

  function reload() {
    return request('GET', '/api/chat/conversations').then(function (list) {
      state.conversations = list
      if (thread) thread.conversation = list.find(function (c) { return c.id === thread.conversation.id }) || thread.conversation
      render()
    }).catch(function () { /* keep the last list */ })
  }
  function sorted() {
    return state.conversations.slice().sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === 'team' ? -1 : 1
      return String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || ''))
    })
  }
  function title(c) {
    if (c.kind === 'team') return 'Team thread'
    return c.ownerOid === session.user.oid ? 'Private · you and Beag Labs' : c.ownerName ? 'Private · ' + c.ownerName : 'Private conversation'
  }
  function setNotice(text) { state.notice = text; render() }

  // ---- Conversation socket (mirrors chat-ui useConversationSocket) ----
  function openThread(conversation) {
    closeThread()
    state.notice = null
    conversation.unread = 0
    var t = thread = { conversation: conversation, messages: [], pending: [], typing: {}, hasOlder: false, status: 'connecting', ws: null, attempt: 0, disposed: false, lastTyping: 0, lastRead: null, support: conversation.support }
    function history() {
      request('GET', '/api/chat/conversations/' + encodeURIComponent(conversation.id) + '/messages?limit=50').then(function (page) {
        if (t.disposed) return
        var known = {}; page.forEach(function (m) { known[m.id] = true })
        t.messages = page.concat(t.messages.filter(function (m) { return !known[m.id] }))
        t.hasOlder = page.length >= 50
        render(true)
      }).catch(function (e) { if (!t.disposed) setNotice(e.message) })
    }
    function connect() {
      token().then(function (tok) {
        if (t.disposed) return
        var url = new URL(api('/api/chat/conversations/' + encodeURIComponent(conversation.id) + '/ws'))
        url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:'
        url.searchParams.set('token', tok)
        var ws = t.ws = new WebSocket(url.toString())
        var keepalive
        ws.onopen = function () {
          t.attempt = 0; t.status = 'open'; history()
          keepalive = setInterval(function () { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' })) }, PING_MS)
          render()
        }
        ws.onmessage = function (event) {
          var frame; try { frame = JSON.parse(event.data) } catch (e) { return }
          if (!frame || frame.type === 'pong') return
          if (frame.type === 'message') {
            var m = frame.message
            t.messages = t.messages.some(function (x) { return x.id === m.id }) ? t.messages.map(function (x) { return x.id === m.id ? m : x }) : t.messages.concat([m])
            if (frame.clientId) t.pending = t.pending.filter(function (p) { return p.clientId !== frame.clientId })
            delete t.typing[m.sender.id]
            render(true)
          } else if (frame.type === 'typing') {
            var id = frame.sender.id
            clearTimeout((t.typing[id] || {}).timer)
            t.typing[id] = { name: frame.sender.name, timer: setTimeout(function () { delete t.typing[id]; render() }, TYPING_TTL_MS) }
            render(true)
          } else if (frame.type === 'support') { t.support = frame.status; render() }
          else if (frame.type === 'error') {
            if (frame.clientId) t.pending.forEach(function (p) { if (p.clientId === frame.clientId) p.failed = true })
            else state.notice = frame.message
            render()
          }
        }
        ws.onclose = function () { clearInterval(keepalive); if (t.ws === ws) t.ws = null; schedule() }
      }).catch(schedule)
    }
    function schedule() {
      if (t.disposed) return
      t.status = 'reconnecting'
      var delay = Math.min(30000, 1000 * Math.pow(2, t.attempt)) * (0.8 + Math.random() * 0.4)
      t.attempt += 1
      t.retry = setTimeout(connect, delay)
    }
    t.write = function (frame) { if (!t.ws || t.ws.readyState !== 1) return false; t.ws.send(JSON.stringify(frame)); return true }
    t.loadOlder = function () {
      var oldest = t.messages[0]; if (!oldest) return
      request('GET', '/api/chat/conversations/' + encodeURIComponent(conversation.id) + '/messages?limit=50&before=' + encodeURIComponent(oldest.id)).then(function (page) {
        var known = {}; t.messages.forEach(function (m) { known[m.id] = true })
        t.messages = page.filter(function (m) { return !known[m.id] }).concat(t.messages)
        t.hasOlder = page.length >= 50
        render()
      })
    }
    connect()
    render(true)
  }
  function closeThread() {
    if (!thread) return
    thread.disposed = true
    clearTimeout(thread.retry)
    if (thread.ws) thread.ws.close(1000, 'conversation closed')
    thread = null
  }

  function send(body) {
    var t = thread
    if (!t || !body.trim()) return
    var clientId = (crypto.randomUUID && crypto.randomUUID()) || 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2)
    var delivered = t.write({ type: 'message', clientId: clientId, body: body, attachmentIds: [] })
    t.pending.push({ clientId: clientId, body: body, failed: !delivered })
    render(true)
  }

  function newPrivate() {
    state.busy = true; render()
    return request('POST', '/api/chat/conversations', { kind: 'private' }).then(function (created) {
      state.conversations = state.conversations.filter(function (c) { return c.id !== created.id }).concat([created])
      openThread(created)
      return created
    }).catch(function (e) { setNotice(e.message) }).finally(function () { state.busy = false; render() })
  }

  function getHelp() {
    var target = thread ? Promise.resolve(thread.conversation) : newPrivate()
    target.then(function (conversation) {
      if (!conversation) return
      return request('POST', '/api/chat/conversations/' + encodeURIComponent(conversation.id) + '/support', { status: 'open' }).then(function () {
        conversation.support = 'open'
        if (thread && thread.conversation.id === conversation.id) thread.support = 'open'
        setNotice('Your account manager has been asked to help. You can keep writing here.')
      })
    }).catch(function (e) { setNotice(e.message) })
  }

  function openAttachment(attachment, into) {
    token().then(function (tok) { return fetch(api(attachment.url || '/api/chat/attachments/' + encodeURIComponent(attachment.id)), { headers: { authorization: 'Bearer ' + tok } }) })
      .then(function (r) { if (!r.ok) throw new Error('Could not load ' + attachment.name); return r.blob() })
      .then(function (blob) {
        var url = URL.createObjectURL(blob)
        if (into) { into.replaceWith(h('img', { class: 'pcu-media', src: url, alt: attachment.name })); return }
        var a = h('a', { href: url, download: attachment.name }); document.body.appendChild(a); a.click(); a.remove()
        setTimeout(function () { URL.revokeObjectURL(url) }, 60000)
      }).catch(function (e) { setNotice(e.message) })
  }

  // ---- Rendering ----
  function threadView(t) {
    var me = session.user.oid
    var list = h('ol', { class: 'pcu-thread', 'aria-live': 'polite' })
    if (!t.messages.length && !t.pending.length) return h('div', { class: 'pcu-thread pcu-thread-empty', text: 'No messages yet. Say hello 👋' })
    if (t.hasOlder) list.appendChild(h('li', { class: 'pcu-thread-older' }, [h('button', { type: 'button', class: 'pcu-button pcu-button-sm', text: 'Load earlier messages', onclick: t.loadOlder })]))
    t.messages.forEach(function (m, i) {
      if (m.sender.type === 'system') { list.appendChild(h('li', { class: 'pcu-system', text: m.huddle ? (m.huddle.endedAt ? 'Huddle ended' : m.huddle.startedBy.name + ' started a huddle (join from Papyrus)') : m.body })); return }
      var own = m.sender.id === me, prev = t.messages[i - 1]
      var grouped = prev && prev.sender.id === m.sender.id && prev.sender.type !== 'system'
      var stack = h('div', { class: 'pcu-bubble-stack' })
      if (!own && !grouped) stack.appendChild(h('span', { class: 'pcu-sender' }, [m.sender.name, m.sender.type === 'staff' ? h('em', { class: 'pcu-sender-tag', text: 'Beag Labs' }) : null]))
      if (m.body) stack.appendChild(h('div', { class: 'pcu-bubble' + (own ? ' pcu-bubble-own' : ''), text: m.body }))
      ;(m.attachments || []).forEach(function (a) {
        var chip = h('button', { type: 'button', class: 'pcu-doc-chip', text: (a.kind === 'image' ? '🖼 ' : a.kind === 'video' ? '🎬 ' : '📄 ') + a.name })
        chip.addEventListener('click', function () { openAttachment(a, a.kind === 'image' ? chip : null) })
        stack.appendChild(chip)
      })
      stack.appendChild(h('span', { class: 'pcu-meta' }, [h('time', { datetime: m.createdAt, text: time(m.createdAt) })]))
      list.appendChild(h('li', { class: 'pcu-row' + (own ? ' pcu-row-own' : '') + (grouped ? ' pcu-row-grouped' : '') }, [
        own ? null : h('span', { class: 'pcu-row-avatar' }, [grouped ? null : avatar(m.sender.name, m.sender.photoUrl, 'sm')]), stack,
      ]))
    })
    t.pending.forEach(function (p) {
      list.appendChild(h('li', { class: 'pcu-row pcu-row-own pcu-row-pending', 'data-failed': p.failed || null }, [h('div', { class: 'pcu-bubble-stack' }, [
        h('div', { class: 'pcu-bubble pcu-bubble-own', text: p.body }), h('span', { class: 'pcu-meta', text: p.failed ? 'Not sent — reconnecting' : 'Sending…' }),
      ])]))
    })
    var typing = Object.keys(t.typing).map(function (id) { return t.typing[id].name })
    if (typing.length) list.appendChild(h('li', { class: 'pcu-typing', text: typing.length === 1 ? typing[0] + ' is typing…' : typing.length + ' people are typing…' }))
    var newestOther = t.messages.slice().reverse().find(function (m) { return m.sender.id !== me && m.sender.type !== 'system' })
    if (newestOther && newestOther.id !== t.lastRead && t.write({ type: 'read', messageId: newestOther.id })) t.lastRead = newestOther.id
    return list
  }

  function composer(t) {
    var input = h('textarea', { rows: 1, 'aria-label': 'Message', placeholder: t.conversation.kind === 'team' ? 'Message your team and Beag Labs…' : 'Message Beag Labs…' })
    function submit() { var body = input.value; if (!body.trim()) return; input.value = ''; draft = ''; send(body) }
    input.value = draft
    input.addEventListener('input', function () {
      draft = input.value
      if (Date.now() - t.lastTyping >= TYPING_THROTTLE_MS && t.write({ type: 'typing' })) t.lastTyping = Date.now()
    })
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } })
    return h('form', { class: 'pcu-composer', onsubmit: function (e) { e.preventDefault(); submit() } }, [input, h('button', { type: 'submit', class: 'pcu-button pcu-button-accent', text: 'Send', disabled: t.status === 'connecting' })])
  }
  var draft = ''

  function render(scroll) {
    var focused = document.activeElement && root.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA'
    var unread = state.conversations.reduce(function (n, c) { return n + (c.unread || 0) }, 0)
    var children = []
    if (state.open) {
      var t = thread
      var header = h('header', { class: 'beag-chat-header' }, [
        t ? h('button', { type: 'button', class: 'beag-chat-back', 'aria-label': 'Back to conversations', text: '←', onclick: function () { closeThread(); reload(); render() } }) : null,
        avatar(state.manager ? state.manager.name : 'Beag Labs', state.manager && state.manager.photoUrl),
        h('span', { class: 'beag-chat-manager' }, [
          h('strong', { text: state.manager ? state.manager.name : 'Beag Labs team' }),
          h('small', { text: state.manager ? state.manager.title || 'Your account manager' : 'We usually reply within a business day' }),
        ]),
        h('button', { type: 'button', class: 'beag-chat-close', 'aria-label': 'Close chat', text: '×', onclick: toggle }),
      ])
      var notice = state.notice ? h('p', { class: 'beag-chat-notice', role: 'status', text: state.notice }) : null
      var body
      if (!t) {
        body = h('div', { class: 'beag-chat-home' }, [
          h('nav', { class: 'pcu-conversations', 'aria-label': 'Conversations' }, [
            h('ul', {}, sorted().map(function (c) {
              return h('li', {}, [h('button', { type: 'button', class: 'pcu-conversation', onclick: function () { openThread(c) } }, [
                h('span', { 'aria-hidden': 'true', text: c.kind === 'team' ? '👥' : '🔒' }), h('span', { class: 'pcu-conversation-title', text: title(c) }),
                c.support === 'open' ? h('span', { class: 'pcu-tag', text: 'Help' }) : null,
                c.unread > 0 ? h('span', { class: 'pcu-badge', 'aria-label': c.unread + ' unread', text: c.unread > 99 ? '99+' : String(c.unread) }) : null,
              ])])
            })),
            h('button', { type: 'button', class: 'pcu-button pcu-button-block', disabled: state.busy, text: '＋ New private conversation', onclick: newPrivate }),
          ]),
          h('div', { class: 'beag-chat-help' }, [h('p', { text: 'Stuck on setup? We will jump in.' }), h('button', { type: 'button', class: 'pcu-button pcu-button-accent pcu-button-block', disabled: state.busy, text: 'Get help', onclick: getHelp })]),
          notice,
        ])
      } else {
        var helpOpen = t.support === 'open'
        body = h('div', { class: 'beag-chat-conversation' }, [
          h('div', { class: 'beag-chat-subheader' }, [
            h('strong', { text: t.conversation.kind === 'team' ? 'Team thread' : 'Private conversation' }),
            t.conversation.kind === 'team' ? h('small', { text: 'Everyone in your organization can see this.' }) : null,
            h('button', { type: 'button', class: 'pcu-button pcu-button-sm', disabled: helpOpen, text: helpOpen ? 'Help requested' : 'Get help', onclick: getHelp }),
          ]),
          notice, threadView(t), composer(t),
        ])
      }
      children.push(h('section', { class: 'beag-chat-panel', role: 'dialog', 'aria-label': 'Chat with Beag Labs' }, [header, body]))
    }
    children.push(h('button', { type: 'button', class: 'beag-chat-launcher', 'aria-expanded': String(state.open), 'aria-label': state.open ? 'Close chat' : unread ? 'Open chat, ' + unread + ' unread' : 'Open chat', onclick: toggle }, [
      h('span', { 'aria-hidden': 'true', text: state.open ? '×' : '💬' }),
      !state.open && unread > 0 ? h('span', { class: 'pcu-badge', 'aria-hidden': 'true', text: unread > 99 ? '99+' : String(unread) }) : null,
    ]))
    var previous = root.querySelector('.pcu-thread')
    var keepScroll = previous && !scroll ? previous.scrollTop : null
    root.replaceChildren.apply(root, children)
    var list = root.querySelector('.pcu-thread')
    if (list) list.scrollTop = keepScroll == null ? list.scrollHeight : keepScroll
    if (focused) { var ta = root.querySelector('textarea'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) } }
  }

  function toggle() {
    state.open = !state.open
    if (state.open) {
      reload()
      request('GET', '/api/chat/account-manager').then(function (m) { state.manager = m; render() }, function () { state.manager = null })
    } else closeThread()
    render()
  }

  ensureSession().then(function () { render(); reload(); setInterval(reload, POLL_MS) }).catch(function () { root.remove() })
})()
`
