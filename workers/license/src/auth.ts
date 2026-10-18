/** Deployment-key authentication for Papyrus deployments (registration, analytics). */
import { first, getDb } from './db'
import type { Bindings } from './env'
import { ApiError, randomToken, sha256Hex } from './util'

export type DeploymentActor = {
  kind: 'deployment'
  deploymentId: string
  tenantId: string | null
  entraClientId: string | null
  subscriptionId: string | null
}

type Row = Record<string, unknown>

export function authorizationParts(request: Request): { scheme: string; credentials: string } | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = /^(\S+)\s+(\S+)$/.exec(header.trim())
  return match ? { scheme: match[1].toLowerCase(), credentials: match[2] } : null
}

// ---------------------------------------------------------------------------
// Deployment keys

export function newDeploymentKey(): string {
  return `pdk_${randomToken(32)}`
}

export async function deploymentKeyHash(key: string): Promise<string> {
  return sha256Hex(key)
}

export async function authenticateDeployment(env: Bindings, key: string): Promise<DeploymentActor> {
  if (!/^pdk_[A-Za-z0-9_-]{20,128}$/.test(key)) throw new ApiError(401, 'invalid_deployment_key', 'Deployment key is invalid.')
  const row = first<Row>(await getDb(env).execute({
    sql: 'SELECT id, tenant_id, entra_client_id, subscription_id FROM papyrus_deployments WHERE key_sha256=?',
    args: [await deploymentKeyHash(key)],
  }))
  if (!row) throw new ApiError(401, 'invalid_deployment_key', 'Deployment key is invalid.')
  return {
    kind: 'deployment',
    deploymentId: String(row.id),
    tenantId: row.tenant_id ? String(row.tenant_id) : null,
    entraClientId: row.entra_client_id ? String(row.entra_client_id) : null,
    subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
  }
}

export async function requireDeployment(env: Bindings, request: Request): Promise<DeploymentActor> {
  const parts = authorizationParts(request)
  if (parts?.scheme !== 'deployment') throw new ApiError(401, 'unauthorized', 'Deployment authentication is required.')
  return authenticateDeployment(env, parts.credentials)
}
