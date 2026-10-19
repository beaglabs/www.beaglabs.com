import type { Bindings } from './env'
import { scheduledLinear } from './app'

/** One singleton coordinator per control plane. D1 remains the durable event ledger. */
export class LinearSync extends DurableObject<Bindings> {
  private async schedule(delayMs = 0) {
    const due = Date.now() + Math.max(1000, delayMs)
    const current = await this.ctx.storage.getAlarm()
    if (current === null || due < current) await this.ctx.storage.setAlarm(due)
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    await this.schedule()
    return new Response(null, { status: 202 })
  }

  async alarm(): Promise<void> {
    try {
      await scheduledLinear(this.env)
    } catch (err) {
      console.error('LinearSync alarm failed', err instanceof Error ? err.message : String(err))
    } finally {
      // Fall back even when D1 or Linear is unavailable; reconcile and retries are idempotent.
      await this.schedule(5 * 60_000)
    }
  }
}

export const wakeLinearSync = async (env: Bindings): Promise<void> => {
  if (!env.LINEAR_SYNC) return
  const id = env.LINEAR_SYNC.idFromName('control-plane')
  await env.LINEAR_SYNC.get(id).fetch('https://linear-sync.internal/wake', { method: 'POST' })
}
