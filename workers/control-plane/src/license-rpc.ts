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
  /** Deleted: from now on signStatus says suspended and the deployment key no longer verifies. True if it was a control-plane deployment. */
  revokeDeployment(deploymentId: string): Promise<boolean>
  /** `{ [keyId]: pem }` for the current signing key (keyId = versioned Key Vault key URI). Goes in PAPYRUS_LICENSE_AUTHORITIES. */
  authorities(): Promise<Record<string, string>>
}
