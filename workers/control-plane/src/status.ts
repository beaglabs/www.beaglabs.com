import * as Effect from 'effect/Effect'
import { license } from './runner'
import { UserError, first } from './services'

/**
 * GET /api/deployments/status — Papyrus's hourly check-in.
 * `Authorization: Bearer <deploymentKey>` + `X-Papyrus-Deployment-Id: <id>` → 200 SignedStatus; bad key → 401.
 * The signature comes from the license Worker's Key Vault signer; this Worker only decides active vs suspended.
 */
/** Papyrus's own calls: `Authorization: Bearer <deploymentKey>` + `X-Papyrus-Deployment-Id`. The license deployment id, or 401. */
export const authenticateDeployment = (authorization: string | null | undefined, deploymentId: string | null | undefined) =>
  Effect.gen(function* () {
    const key = /^Bearer\s+(\S+)$/i.exec(authorization ?? '')?.[1]
    const id = deploymentId?.trim()
    if (!key || !id) return yield* new UserError({ message: 'Deployment key required', status: 401 })
    const valid = yield* license('Verifying the deployment key failed', (rpc) => rpc.verifyDeploymentKey(id, key))
    if (!valid) return yield* new UserError({ message: 'Invalid deployment key', status: 401 })
    return id
  })

export const deploymentStatus = (authorization: string | null | undefined, deploymentId: string | null | undefined) =>
  Effect.gen(function* () {
    const id = yield* authenticateDeployment(authorization, deploymentId)
    const row = yield* first<{ billing_state: string }>('SELECT billing_state FROM deployments WHERE license_deployment_id = ?', id)
    // A valid key without a control-plane row is not ours to suspend (e.g. a legacy Marketplace install).
    if (!row) return yield* new UserError({ message: 'Not a control-plane deployment', status: 404 })
    const state = row.billing_state === 'active' ? 'active' : 'suspended'
    return yield* license('Signing the status failed', (rpc) => rpc.signStatus({ deploymentId: id, state }))
  })
