import { createApp, scheduled } from './app'
import type { Bindings } from './env'

export { ActivityHub } from './activity-hub'

const app = createApp()

export default {
  fetch: app.fetch,
  scheduled: (_controller: ScheduledController, env: Bindings, ctx: ExecutionContext) => ctx.waitUntil(scheduled(env)),
} satisfies ExportedHandler<Bindings>
