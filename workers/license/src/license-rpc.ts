/** Named entrypoint for the control plane's `LICENSE` service binding. Deployment rows, keys and signing stay owned here. */
import { WorkerEntrypoint } from 'cloudflare:workers'
import { licenseAuthorities } from './azure-key-vault-signer'
import * as controlPlane from './control-plane'
import type { CreateDeploymentInput, CreateDeploymentResult, DeploymentState, IdentityPayload, RegistrationState, SignedIdentity, SignedStatus } from './control-plane'
import type { Bindings } from './env'

export class LicenseRpc extends WorkerEntrypoint<Bindings> {
  createDeployment(input: CreateDeploymentInput): Promise<CreateDeploymentResult> {
    return controlPlane.createDeployment(this.env, input)
  }

  verifyDeploymentKey(deploymentId: string, deploymentKey: string): Promise<boolean> {
    return controlPlane.verifyDeploymentKey(this.env, deploymentId, deploymentKey)
  }

  signStatus(input: { deploymentId: string; state: DeploymentState }): Promise<SignedStatus> {
    return controlPlane.signStatus(this.env, input)
  }

  /** A brokered Microsoft sign-in for Papyrus, signed with the license key. Refused for revoked deployments. */
  signIdentity(payload: IdentityPayload): Promise<SignedIdentity> {
    return controlPlane.signIdentity(this.env, payload)
  }

  registrationState(deploymentId: string): Promise<RegistrationState> {
    return controlPlane.registrationState(this.env, deploymentId)
  }

  revokeDeployment(deploymentId: string): Promise<boolean> {
    return controlPlane.revokeDeployment(this.env, deploymentId)
  }

  /** `{ [keyId]: pem }` for the current signing key: what deployments put in PAPYRUS_LICENSE_AUTHORITIES. */
  authorities(): Promise<Record<string, string>> {
    return licenseAuthorities(this.env)
  }

}
