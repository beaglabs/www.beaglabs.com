import { createHash } from 'node:crypto'
import { harness } from './harness'

const TOKEN = 'session-token'

/** A harness with acct_1 signed in; get/post send its session cookie. */
export function signedIn(options: Parameters<typeof harness>[0] = {}) {
  const h = harness(options)
  h.insertAccount('acct_1', 'owner@example.com')
  h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update(TOKEN).digest('hex'), 'acct_1', '2999-01-01T00:00:00.000Z')
  const cookie = `cp_session=${TOKEN}`
  const get = (path: string, headers: Record<string, string> = {}) => h.call(path, { headers: { cookie, ...headers } })
  const post = (path: string, form: Record<string, string> = {}) =>
    h.call(path, { method: 'POST', headers: { cookie, origin: h.env.BASE_URL, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() })
  return { h, get, post, cookie }
}
