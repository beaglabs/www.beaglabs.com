import { createApp, scheduled, scheduledLinear } from './app'
import { wakeLinearSync } from './linear-sync'
import type { Bindings } from './env'

export { LinearSync } from './linear-sync'
export { ActivityHub } from './activity-hub'

const app = createApp()

export default {
  fetch: app.fetch,
  scheduled: (controller: ScheduledController, env: Bindings, ctx: ExecutionContext) => ctx.waitUntil(controller.cron === '*/5 * * * *' ? scheduledLinear(env).then(() => wakeLinearSync(env).catch(error => console.error('Linear alarm wake failed', String(error)))) : scheduled(env)),
} satisfies ExportedHandler<Bindings>
