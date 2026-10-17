/** Named entrypoint for the control plane's `LICENSE` service binding. Deployment rows, keys and signing stay owned here. */
import { WorkerEntrypoint } from 'cloudflare:workers'
import * as controlPlane from './control-plane'
import type { ChatSessionInput, ChatSessionResult, CreateDeploymentInput, CreateDeploymentResult, DeploymentState, RegistrationState, SignedStatus } from './control-plane'
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

  registrationState(deploymentId: string): Promise<RegistrationState> {
    return controlPlane.registrationState(this.env, deploymentId)
  }

  /** Customer chat session for a signed-in control-plane user (same shape as `POST /api/papyrus/session`). */
  chatSession(input: ChatSessionInput): Promise<ChatSessionResult> {
    return controlPlane.chatSession(this.env, input)
  }
}
