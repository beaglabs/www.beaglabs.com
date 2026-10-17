/**
 * Cloudflare RealtimeKit REST client.
 * https://developers.cloudflare.com/api/resources/realtime_kit/subresources/meetings/
 *   POST  /accounts/{account}/realtime/kit/{app}/meetings                         → data.id
 *   POST  /accounts/{account}/realtime/kit/{app}/meetings/{id}/participants       → data.token
 *   PATCH /accounts/{account}/realtime/kit/{app}/meetings/{id}  { status: 'INACTIVE' }
 */
import type { Bindings } from './env'
import { ApiError } from './util'

export const DEFAULT_PRESET = 'group_call_participant'

export function realtimeKitConfigured(env: Bindings): boolean {
  return Boolean(env.CF_ACCOUNT_ID && env.REALTIMEKIT_APP_ID && env.REALTIMEKIT_API_TOKEN)
}

function base(env: Bindings): string {
  if (!realtimeKitConfigured(env)) throw new ApiError(503, 'huddles_not_configured', 'Huddles are not configured.')
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID!)}/realtime/kit/${encodeURIComponent(env.REALTIMEKIT_APP_ID!)}`
}

async function call<T>(env: Bindings, method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${base(env)}${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.REALTIMEKIT_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
  const json = (await response.json().catch(() => null)) as { success?: boolean; data?: T } | null
  if (!response.ok || !json || json.success === false || !json.data) {
    console.error('realtimekit request failed', { method, path: path.replace(/[0-9a-f-]{36}/g, ':id'), status: response.status })
    throw new ApiError(502, 'realtimekit_failed', 'The huddle service did not respond as expected.')
  }
  return json.data
}

export async function createMeeting(env: Bindings, title: string): Promise<{ id: string }> {
  const data = await call<{ id: string }>(env, 'POST', '/meetings', { title: title.slice(0, 120) })
  if (!data.id) throw new ApiError(502, 'realtimekit_failed', 'The huddle service did not return a meeting id.')
  return { id: data.id }
}

export async function addParticipant(env: Bindings, meetingId: string, participant: { customId: string; name: string; picture?: string | null }): Promise<{ id: string; token: string }> {
  const data = await call<{ id: string; token: string }>(env, 'POST', `/meetings/${encodeURIComponent(meetingId)}/participants`, {
    custom_participant_id: participant.customId,
    preset_name: env.REALTIMEKIT_PRESET_NAME || DEFAULT_PRESET,
    name: participant.name,
    ...(participant.picture ? { picture: participant.picture } : {}),
  })
  if (!data.token) throw new ApiError(502, 'realtimekit_failed', 'The huddle service did not return a participant token.')
  return { id: data.id, token: data.token }
}

/** Best effort: marks the meeting inactive so stale tokens cannot rejoin. */
export async function deactivateMeeting(env: Bindings, meetingId: string): Promise<void> {
  if (!realtimeKitConfigured(env)) return
  try {
    await call(env, 'PATCH', `/meetings/${encodeURIComponent(meetingId)}`, { status: 'INACTIVE' })
  } catch {
    // already logged
  }
}
