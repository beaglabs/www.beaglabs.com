/**
 * Remote push to the admin app: FCM HTTP v1 (Android) and APNs token auth (macOS).
 * A provider whose configuration is missing is skipped; failures never fail the caller.
 */
import { getDb, rows } from './db'
import type { Bindings } from './env'
import { signEs256Pem, signRs256Pem } from './jwt'

export type PushData = {
  kind: string
  inboxId: string
  conversationId?: string | null
  leadId?: string | null
  tenantId?: string | null
}

export type PushPayload = { title: string; body: string; data: PushData }

export type PushChannel = 'leads' | 'messages' | 'alerts'

export function channelForKind(kind: string): PushChannel {
  if (kind === 'lead.new') return 'leads'
  if (kind === 'chat.message' || kind === 'support.requested' || kind === 'huddle.started') return 'messages'
  return 'alerts'
}

/** macOS sound file names bundled with the admin app (Android uses channel sounds). */
const MAC_SOUNDS: Record<PushChannel, string> = { leads: 'lead.caf', messages: 'message.caf', alerts: 'default' }

type Device = { id: string; platform: 'android' | 'macos'; token: string }

function stringData(payload: PushPayload): Record<string, string> {
  const data: Record<string, string> = { channel: channelForKind(payload.data.kind) }
  for (const [key, value] of Object.entries(payload.data)) if (value != null) data[key] = String(value)
  return data
}

// ---------------------------------------------------------------------------
// FCM

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string }
let fcmToken: { value: string; expiresAt: number; email: string } | null = null

export function fcmConfigured(env: Bindings): boolean {
  return Boolean(env.FCM_PROJECT_ID && env.FCM_SERVICE_ACCOUNT_JSON)
}

async function fcmAccessToken(env: Bindings): Promise<string> {
  const account = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON!) as ServiceAccount
  if (fcmToken && fcmToken.email === account.client_email && fcmToken.expiresAt > Date.now() + 60_000) return fcmToken.value
  const iat = Math.floor(Date.now() / 1000)
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token'
  const assertion = await signRs256Pem({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat,
    exp: iat + 3600,
  }, account.private_key)
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`FCM OAuth token request failed: HTTP ${response.status}`)
  const body = (await response.json()) as { access_token: string; expires_in?: number }
  fcmToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000, email: account.client_email }
  return body.access_token
}

/** Returns false when the token is permanently invalid and should be removed. */
async function sendFcm(env: Bindings, device: Device, payload: PushPayload): Promise<boolean> {
  const channel = channelForKind(payload.data.kind)
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(env.FCM_PROJECT_ID!)}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await fcmAccessToken(env)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: device.token,
        notification: { title: payload.title, body: payload.body },
        data: stringData(payload),
        android: { priority: 'high', notification: { channel_id: channel } },
      },
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (response.ok) return true
  const text = await response.text().catch(() => '')
  if (response.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(text)) return false
  throw new Error(`FCM send failed: HTTP ${response.status}`)
}

// ---------------------------------------------------------------------------
// APNs

let apnsJwt: { value: string; issuedAt: number; keyId: string } | null = null

export function apnsConfigured(env: Bindings): boolean {
  return Boolean(env.APNS_KEY_ID && env.APNS_TEAM_ID && env.APNS_BUNDLE_ID && env.APNS_PRIVATE_KEY)
}

async function apnsToken(env: Bindings): Promise<string> {
  // Apple accepts a provider token for up to an hour and rejects refreshes more often than every 20 min.
  if (apnsJwt && apnsJwt.keyId === env.APNS_KEY_ID && Date.now() - apnsJwt.issuedAt < 40 * 60_000) return apnsJwt.value
  const issuedAt = Date.now()
  const value = await signEs256Pem({ iss: env.APNS_TEAM_ID, iat: Math.floor(issuedAt / 1000) }, env.APNS_PRIVATE_KEY!, { kid: env.APNS_KEY_ID })
  apnsJwt = { value, issuedAt, keyId: env.APNS_KEY_ID! }
  return value
}

async function sendApns(env: Bindings, device: Device, payload: PushPayload): Promise<boolean> {
  const host = env.APNS_ENVIRONMENT === 'sandbox' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com'
  const channel = channelForKind(payload.data.kind)
  const response = await fetch(`https://${host}/3/device/${encodeURIComponent(device.token)}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${await apnsToken(env)}`,
      'apns-topic': env.APNS_BUNDLE_ID!,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      aps: { alert: { title: payload.title, body: payload.body }, sound: MAC_SOUNDS[channel], 'thread-id': payload.data.conversationId ?? channel },
      ...stringData(payload),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (response.ok) return true
  const text = await response.text().catch(() => '')
  if (response.status === 410 || /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/.test(text)) return false
  throw new Error(`APNs send failed: HTTP ${response.status}`)
}

// ---------------------------------------------------------------------------

export async function sendPush(env: Bindings, accountManagerIds: readonly string[], payload: PushPayload): Promise<{ sent: number; skipped: number }> {
  const ids = [...new Set(accountManagerIds)]
  if (!ids.length) return { sent: 0, skipped: 0 }
  const db = getDb(env)
  const devices = rows<Device>(await db.execute({
    sql: `SELECT id, platform, token FROM staff_devices WHERE account_manager_id IN (${ids.map(() => '?').join(',')})`,
    args: ids,
  }))
  let sent = 0
  let skipped = 0
  await Promise.all(devices.map(async (device) => {
    const configured = device.platform === 'android' ? fcmConfigured(env) : apnsConfigured(env)
    if (!configured) { skipped += 1; return }
    try {
      const ok = device.platform === 'android' ? await sendFcm(env, device, payload) : await sendApns(env, device, payload)
      if (ok) sent += 1
      else await db.execute({ sql: 'DELETE FROM staff_devices WHERE id=?', args: [device.id] })
    } catch (error) {
      console.error('push send failed', { platform: device.platform, message: error instanceof Error ? error.message : String(error) })
    }
  }))
  return { sent, skipped }
}
