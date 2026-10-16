import { createClient, type Client } from '@libsql/client/web'
import type { Bindings } from './env'

let cache: { url: string; client: Client } | undefined

/**
 * Looks a Papyrus deployment up in the license service's `managed_deployments` (read-only token). A Marketplace VM is
 * there once its customer claimed it in provisioning; `organization_id` is the same `organizations.id` organization
 * licenses carry.
 */
export async function managedDeployment(env: Bindings, deploymentId: string): Promise<{ organizationId: string; status: string; publicOrigin?: string | undefined } | undefined> {
  const url = env.LICENSE_DATABASE_URL?.trim(), authToken = env.LICENSE_DATABASE_TOKEN?.trim()
  if (!url || !authToken) return undefined
  if (cache?.url !== url) cache = { url, client: createClient({ url, authToken }) }
  const result = await cache.client.execute({ sql: 'SELECT organization_id, status, public_origin FROM managed_deployments WHERE papyrus_deployment_id=? LIMIT 1', args: [deploymentId] })
  const row = result.rows[0] as unknown as { organization_id?: string; status?: string; public_origin?: string | null } | undefined
  return row?.organization_id ? { organizationId: String(row.organization_id), status: String(row.status), ...(row.public_origin ? { publicOrigin: String(row.public_origin) } : {}) } : undefined
}
