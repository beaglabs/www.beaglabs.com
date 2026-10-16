import { createConnectApp, deliverDue } from './app'
import { getDb } from './db'
import type { Bindings } from './env'
import { stripeGateway } from './gateway'
import { managedDeployment } from './marketplace'
import { plaidGateway } from './plaid'

const deps = { database: getDb, gateway: stripeGateway, plaid: plaidGateway, managedDeployment }
const app = createConnectApp(deps)

export default {
  fetch: app.fetch,
  // Retries pushes that failed (an install briefly down); installs that never take pushes poll /v1/events instead.
  async scheduled(_controller: unknown, env: Bindings, ctx: { waitUntil(promise: Promise<unknown>): void }) {
    ctx.waitUntil(deliverDue(env, deps).then(count => { if (count) console.log(JSON.stringify({ event: 'connect.redelivered', count })) }))
  },
}
