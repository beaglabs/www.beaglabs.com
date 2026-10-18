import { HOSTED_DOMAIN, HOSTED_PROVIDER } from './hosted'
import { HOSTED_TEARDOWN_STEPS } from './providers/aws-hosted'
import { STACK_NAME, CONTROL_PLANE_ROLE, TASK_EXECUTION_ROLE, serviceName } from './providers/aws'
import type { Deployment } from './services'

/**
 * Stop/Start and Delete, the pure parts (shared by the routes, the runner in src/lifecycle.ts and the views).
 *
 * Teardown steps run in order. Billing and the license go first, so a teardown that stalls never keeps charging the
 * customer or lets Papyrus keep running. Hosted deployments then delete their own AWS resources and release the org
 * name; BYOC deployments delete nothing in the customer's cloud (the page lists what they should remove).
 */

export type TeardownStep = 'billing' | 'license' | (typeof HOSTED_TEARDOWN_STEPS)[number] | 'release'

export const TEARDOWN_LABELS: Record<TeardownStep, string> = {
  billing: 'Cancel the subscription (prorated)',
  license: 'Revoke the license',
  service: 'Scale to 0 and delete the ECS service',
  taskDefinitions: 'Deregister task definitions',
  routing: 'Remove the listener rule and target group',
  data: 'Delete the data (EFS access point, then the data directory)',
  secrets: 'Delete secrets',
  logs: 'Delete the log group',
  release: 'Release the organization name',
}

export const isHosted = (deployment: Pick<Deployment, 'provider'>) => !deployment.provider || deployment.provider === HOSTED_PROVIDER

/** Something was created in AWS for this hosted deployment (a deploy ran). */
const deployedOnce = (deployment: Pick<Deployment, 'steps' | 'resources'>) => Boolean(deployment.steps.deploy.at) || Object.keys(deployment.resources).length > 0

export const teardownSteps = (deployment: Pick<Deployment, 'provider' | 'steps' | 'resources'>): TeardownStep[] => {
  if (!isHosted(deployment)) return ['billing', 'license']
  return deployment.provider === HOSTED_PROVIDER && deployedOnce(deployment) ? ['billing', 'license', ...HOSTED_TEARDOWN_STEPS, 'release'] : ['billing', 'license', 'release']
}

/** What the customer types to confirm a delete: the org name (hosted), else the hostname, else the deployment id. */
export const confirmNameFor = (deployment: Pick<Deployment, 'id' | 'provider' | 'hostname'>) => {
  if (deployment.provider === HOSTED_PROVIDER && deployment.hostname?.endsWith(`.${HOSTED_DOMAIN}`)) return deployment.hostname.slice(0, -HOSTED_DOMAIN.length - 1)
  return deployment.hostname ?? deployment.id
}

/** Stop/Start exists where the recipe runs an ECS service: hosted and AWS BYOC. */
export const supportsStop = (deployment: Pick<Deployment, 'provider'>) => deployment.provider === HOSTED_PROVIDER || deployment.provider === 'aws'

/** Stop is offered once the service exists and the deployment is running. */
export const canStop = (deployment: Pick<Deployment, 'provider' | 'lifecycle' | 'steps' | 'resources'>) =>
  supportsStop(deployment) && deployment.lifecycle === 'running' && deployment.steps.deploy.status === 'pass' && typeof deployment.resources.serviceArn === 'string'

export interface CleanupItem {
  what: string
  name: string
  note?: string
}

const str = (value: unknown) => (typeof value === 'string' && value ? value : null)

/**
 * BYOC delete: what the customer should remove from their own cloud, with the exact names and ids we stored, in a
 * safe order. Beag Labs deletes nothing there.
 */
export const byocCleanupList = (deployment: Pick<Deployment, 'id' | 'provider' | 'hostname' | 'license_deployment_id' | 'resources' | 'dnsRecords'>): CleanupItem[] => {
  const r = deployment.resources
  const items: CleanupItem[] = []
  const add = (what: string, name: string | null, note?: string) => {
    if (name) items.push({ what, name, ...(note ? { note } : {}) })
  }
  if (deployment.provider === 'aws') {
    const name = serviceName(deployment.id)
    const prefix = deployment.license_deployment_id ? `papyrus/${deployment.license_deployment_id}` : null
    add('ECS service', str(r.serviceArn) ?? (r.clusterArn ? name : null), `In cluster ${name}. Set desired tasks to 0, then delete it.`)
    add('ECS cluster', str(r.clusterArn) ?? null, `${name}, after the service is gone.`)
    add('ECS task definitions', r.taskDefinitionArn ? `${name} (all revisions)` : null, 'Deregister, then delete.')
    add('Application Load Balancer', str(r.loadBalancerArn), `${name}-alb, with its listeners.`)
    add('Target group', str(r.targetGroupArn), `${name}-tg, after the load balancer.`)
    add('ACM certificate', str(r.certificateArn), deployment.hostname ? `For ${deployment.hostname}.` : undefined)
    add('EFS access point', str(r.accessPointId))
    add('EFS file system', str(r.fileSystemId), 'Holds all Papyrus data. Back it up first if you need it; delete its mount targets, then the file system.')
    add('Security group', str(r.albSecurityGroup), `${name}-albSecurityGroup, after the load balancer.`)
    add('Security group', str(r.taskSecurityGroup), `${name}-taskSecurityGroup.`)
    add('Security group', str(r.efsSecurityGroup), `${name}-efsSecurityGroup, after the file system.`)
    add('Secret', str(r.bootstrapSecretArn) ?? (prefix && `${prefix}/bootstrap-token`))
    add('Secret', str(r.licenseSecretArn) ?? (prefix && `${prefix}/license`))
    add('Secret', str(r.masterKeySecretArn) ?? (prefix && `${prefix}/master-key`), 'The data master key: once deleted, the data cannot be decrypted.')
    add('CloudWatch log group', str(r.logGroup) ?? (deployment.license_deployment_id ? `/papyrus/${deployment.license_deployment_id}` : null))
  } else {
    for (const [key, value] of Object.entries(r)) if (typeof value === 'string' && value) add(key, value)
  }
  for (const record of deployment.dnsRecords) add(`DNS ${record.type} record`, record.name, `→ ${record.value}`)
  if (deployment.provider === 'aws')
    add('CloudFormation stack', STACK_NAME, `Removes Beag Labs' access (roles ${CONTROL_PLANE_ROLE} and ${TASK_EXECUTION_ROLE}). Delete it last, and only if no other Papyrus deployment uses this AWS account.`)
  return items
}
