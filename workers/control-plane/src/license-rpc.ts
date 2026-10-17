/**
 * The `LicenseRpc` named entrypoint of workers/license, reached through the `LICENSE` service binding.
 * Shapes follow "Contract between the three pieces" in
 * docs/superpowers/specs/2026-10-17-papyrus-control-plane-design.md. The license Worker owns deployment rows,
 * deployment keys and the Key Vault signer; this Worker never sees a deployment key's hash or a signing key.
 */

export type StatusState = 'active' | 'suspended'

/** A signed Papyrus license document (canonical JSON payload fields + keyId + signature). */
export type SignedLicense = Record<string, unknown> & { keyId: string; signature: string }

export interface SignedStatus {
  payload: { deploymentId: string; state: StatusState; issuedAt: string; expiresAt: string }
  keyId: string
  signature: string
}

export interface LicenseRpcApi {
  createDeployment(input: { accountId: string; hostname: string; provider: string; organization: string }): Promise<{
    deploymentId: string
    bootstrapToken: string
    license: SignedLicense
  }>
  verifyDeploymentKey(deploymentId: string, deploymentKey: string): Promise<boolean>
  signStatus(input: { deploymentId: string; state: StatusState }): Promise<SignedStatus>
  registrationState(deploymentId: string): Promise<'pending' | 'registered'>
  /** Customer chat session for a signed-in user; same shape as the license Worker's `POST /api/papyrus/session`. */
  chatSession(input: { accountId: string; userId: string; email: string; name: string; deploymentId?: string; tenantId?: string }): Promise<ChatSession>
}

export interface ChatSession {
  token: string
  expiresAt: string
  tenantId: string
  user: { oid: string; name: string }
}
