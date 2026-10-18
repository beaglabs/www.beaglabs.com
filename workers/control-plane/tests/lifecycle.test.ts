import * as Effect from 'effect/Effect'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scheduled } from '../src/app'
import { encryptJson } from '../src/crypto'
import { hostedProviderContext, type HostedInfra } from '../src/hosted'
import { connectTemplate } from '../src/providers/aws'
import { hostedTeardownStep } from '../src/providers/aws-hosted'
import { signedIn } from './helpers/session'
import { confirmedBy } from '../src/ui/actions'
import type { ActionResult } from '../src/ui/types'
import { fakeStripe } from './helpers/stripe'

/** Mocked Distilled AWS calls. Every call is recorded in order in `log` as `name` (with its input in the mock). */
const aws = vi.hoisted(() => {
  const log: string[] = []
  const mk = (name: string, impl: (input: any) => Promise<unknown> = async () => ({})) =>
    vi.fn(async (input: any) => {
      log.push(name)
      return impl(input)
    })
  const mocks = {
    assumeRole: mk('assumeRole', async () => ({ Credentials: { AccessKeyId: 'ASIA', SecretAccessKey: 's', SessionToken: 't' } })),
    updateService: mk('updateService'),
    deleteService: mk('deleteService'),
    listTaskDefinitions: mk('listTaskDefinitions', async () => ({ taskDefinitionArns: ['arn:aws:ecs:us-east-2:222:task-definition/papyrus-abc:1', 'arn:aws:ecs:us-east-2:222:task-definition/papyrus-abc:2'] })),
    deregisterTaskDefinition: mk('deregisterTaskDefinition'),
    registerTaskDefinition: mk('registerTaskDefinition', async () => ({ taskDefinition: { taskDefinitionArn: 'arn:task/papyrus-hosted-cleanup:1' } })),
    runTask: mk('runTask', async () => ({ tasks: [{ taskArn: 'arn:ecs-task/cleanup-1' }] })),
    describeTasks: mk('describeTasks', async () => ({ tasks: [{ taskArn: 'arn:ecs-task/cleanup-1', lastStatus: 'STOPPED', containers: [{ name: 'cleanup', exitCode: 0 }] }] })),
    deleteRule: mk('deleteRule'),
    deleteTargetGroup: mk('deleteTargetGroup'),
    deleteAccessPoint: mk('deleteAccessPoint'),
    deleteSecret: mk('deleteSecret'),
    deleteLogGroup: mk('deleteLogGroup'),
  }
  ;(globalThis as any).__awsMocks = mocks
  return { ...mocks, log }
})

const ops = vi.hoisted(() => async (...names: string[]) => {
  const E = await import('effect/Effect')
  const fns = (globalThis as any).__awsMocks as Record<string, (input: unknown) => Promise<unknown>>
  return Object.fromEntries(names.map((name) => [name, (input: unknown) => E.tryPromise({ try: () => fns[name]!(input), catch: (error) => error })]))
})

vi.mock('@distilled.cloud/aws/sts', () => ops('assumeRole'))
vi.mock('@distilled.cloud/aws/ecs', () => ops('updateService', 'deleteService', 'listTaskDefinitions', 'deregisterTaskDefinition', 'registerTaskDefinition', 'runTask', 'describeTasks'))
vi.mock('@distilled.cloud/aws/elastic-load-balancing-v2', () => ops('deleteRule', 'deleteTargetGroup'))
vi.mock('@distilled.cloud/aws/efs', () => ops('deleteAccessPoint'))
vi.mock('@distilled.cloud/aws/secrets-manager', () => ops('deleteSecret'))
vi.mock('@distilled.cloud/aws/cloudwatch-logs', () => ops('deleteLogGroup'))

const READY: HostedInfra = {
  vpcId: 'vpc-1',
  subnetIds: ['sn-a', 'sn-b'],
  albSecurityGroup: 'sg-alb',
  taskSecurityGroup: 'sg-task',
  efsSecurityGroup: 'sg-efs',
  securityRules: true,
  clusterArn: 'arn:cluster/papyrus-hosted',
  fileSystemId: 'fs-1',
  mountTargets: true,
  certificateArn: 'arn:cert/wildcard',
  loadBalancerArn: 'arn:alb/papyrus-hosted',
  loadBalancerDns: 'papyrus-hosted-1.us-east-2.elb.amazonaws.com',
  httpListenerArn: 'arn:listener/80',
  httpsListenerArn: 'arn:listener/443',
}

const STEPS_LIVE = JSON.stringify(
  Object.fromEntries(['connect', 'deploy', 'dns', 'health', 'microsoft', 'registration'].map((id) => [id, { status: 'pass', at: '2026-10-17T10:00:00.000Z' }])),
)

const HOSTED_RESOURCES = {
  accessPointId: 'fsap-1',
  targetGroupArn: 'arn:tg/acme',
  listenerRuleArn: 'arn:rule/acme',
  serviceArn: 'arn:service/acme',
  taskDefinitionArn: 'arn:aws:ecs:us-east-2:222:task-definition/papyrus-abc:2',
  bootstrapSecretArn: 'arn:aws:secretsmanager:us-east-2:222:secret:papyrus/pd_123/bootstrap-token-AbC',
  licenseSecretArn: 'arn:aws:secretsmanager:us-east-2:222:secret:papyrus/pd_123/license-AbC',
  masterKeySecretArn: 'arn:aws:secretsmanager:us-east-2:222:secret:papyrus/pd_123/master-key-AbC',
  logGroup: '/papyrus/pd_123',
  hostname: 'acme.papyrus.beaglabs.com',
}

function setup() {
  const stripe = fakeStripe()
  const session = signedIn({ fetch: stripe.fetch })
  const { h } = session
  h.sql.prepare("INSERT INTO hosted_infra (id, data, updated_at) VALUES ('aws', ?, 'now')").run(JSON.stringify(READY))
  /** A live hosted deployment at acme.papyrus.beaglabs.com (slot 1). */
  const hosted = (id = 'dep_abc', org = 'acme', license = 'pd_123', slot = 1) => {
    h.insertDeployment({ id, billing_state: 'active', license_deployment_id: license, stripe_subscription_id: `sub_${id}` })
    h.sql
      .prepare("UPDATE deployments SET provider = 'hosted', hostname = ?, steps = ?, resources = ?, stripe_customer_id = ?, stripe_status = 'active' WHERE id = ?")
      .run(`${org}.papyrus.beaglabs.com`, STEPS_LIVE, JSON.stringify(HOSTED_RESOURCES), `cus_${id}`, id)
    h.sql.prepare("INSERT INTO hosted_orgs (org_name, deployment_id, account_id, slot, created_at) VALUES (?, ?, 'acct_1', ?, 'now')").run(org, id, slot)
  }
  /** A live BYOC deployment on AWS, credentials saved (encrypted) like /provision does. */
  const byoc = async (id = 'dep_byoc') => {
    h.insertDeployment({ id, billing_state: 'active', license_deployment_id: 'pd_123', stripe_subscription_id: `sub_${id}` })
    const sealed = await Effect.runPromise(encryptJson(h.env.CREDENTIALS_KEY, 'acct_1', { roleArn: 'arn:aws:iam::333333333333:role/BeagLabsPapyrusControlPlane', region: 'us-east-1' }))
    h.sql
      .prepare(
        "UPDATE deployments SET provider = 'aws', hostname = 'papyrus.contoso.com', aws_external_id = 'beag-customer', credentials_ciphertext = ?, steps = ?, resources = ?, dns_records = ?, stripe_customer_id = ?, stripe_status = 'active' WHERE id = ?",
      )
      .run(
        sealed,
        STEPS_LIVE,
        JSON.stringify({
          clusterArn: 'arn:aws:ecs:us-east-1:333:cluster/papyrus-byoc',
          serviceArn: 'arn:aws:ecs:us-east-1:333:service/papyrus-byoc/papyrus-byoc',
          loadBalancerArn: 'arn:alb/customer',
          targetGroupArn: 'arn:tg/customer',
          fileSystemId: 'fs-customer',
          accessPointId: 'fsap-customer',
          certificateArn: 'arn:cert/customer',
          albSecurityGroup: 'sg-c1',
          taskSecurityGroup: 'sg-c2',
          efsSecurityGroup: 'sg-c3',
          logGroup: '/papyrus/pd_123',
        }),
        JSON.stringify([{ type: 'CNAME', name: 'papyrus.contoso.com', value: 'papyrus-byoc-alb.elb.amazonaws.com' }]),
        `cus_${id}`,
        id,
      )
  }
  const lifecycle = (id: string) => h.sql.prepare('SELECT state, changed_at, teardown FROM deployment_lifecycle WHERE deployment_id = ?').get(id) as { state: string; changed_at: string; teardown: string } | undefined
  return { ...session, stripe, hosted, byoc, lifecycle }
}

const DELETE_CALLS = ['deleteService', 'deregisterTaskDefinition', 'deleteRule', 'deleteTargetGroup', 'deleteAccessPoint', 'deleteSecret', 'deleteLogGroup', 'runTask'] as const

beforeEach(() => {
  aws.log.length = 0
  for (const [name, mock] of Object.entries(aws)) if (name !== 'log') (mock as ReturnType<typeof vi.fn>).mockClear()
})

describe('Stop / Start', () => {
  it('stop scales the hosted service to 0; the page shows Stopped, a Start banner and a disabled Open Papyrus', async () => {
    const { h, post, get, hosted, lifecycle } = setup()
    hosted()
    expect(await (await get('/deploy/dep_abc')).text()).toContain('"confirmLabel":"Stop deployment"')

    const response = await post('/deploy/dep_abc/stop')
    expect(response.status).toBe(303)
    expect(aws.updateService).toHaveBeenCalledWith({ cluster: 'arn:cluster/papyrus-hosted', service: 'papyrus-abc', desiredCount: 0 })
    expect(lifecycle('dep_abc')?.state).toBe('stopped')
    for (const name of DELETE_CALLS) expect(aws[name], name).not.toHaveBeenCalled()
    // Kept: routing, data, secrets, registration.
    expect(JSON.parse(h.deployment('dep_abc').resources as string)).toMatchObject({ targetGroupArn: 'arn:tg/acme', accessPointId: 'fsap-1' })

    const html = await (await get('/deploy/dep_abc')).text()
    expect(html).toContain('data-tone="off"><span class="pill-dot" aria-hidden="true"></span>Stopped</span>')
    expect(html).toContain('data-action="start"')
    expect(html).not.toContain('data-action="stop"')
    expect(html).not.toContain('data-action="redeploy"')
    expect(html).toMatch(/role="link" aria-disabled="true"[^>]*>Open environment/)
    expect(html).toContain('Scaled to zero. Start brings it back.')
    // Steps can't run while stopped.
    expect((await post('/deploy/dep_abc/steps/health')).status).toBe(409)
  })

  it('JSON stop/start: pending until the backend confirms, refusals and provider errors are actionable', async () => {
    const { h, hosted, cookie, lifecycle } = setup()
    hosted()
    const post = async (action: string) => {
      const response = await h.call(`/api/deployments/dep_abc/actions/${action}`, { method: 'POST', headers: { cookie, origin: h.env.BASE_URL, 'content-type': 'application/json' }, body: '{}' })
      return { status: response.status, body: (await response.json()) as ActionResult }
    }
    const stopped = await post('stop')
    expect(stopped.status).toBe(200)
    expect(stopped.body).toMatchObject({ ok: true, deployment: { status: 'stopped', health: 'stopped' } })
    expect(confirmedBy.stop(stopped.body.deployment!)).toBe(true)
    expect(stopped.body.deployment!.actions.map((a) => a.id)).toEqual(['start'])
    expect(lifecycle('dep_abc')?.state).toBe('stopped')
    // A second stop is refused by the backend, whatever the page shows.
    expect((await post('stop')).status).toBe(409)

    const started = await post('start')
    expect(started.body).toMatchObject({ ok: true, deployment: { status: 'starting', health: 'starting' } })
    expect(confirmedBy.start(started.body.deployment!)).toBe(true)

    // The provider says no: the state is unchanged and the message is shown.
    aws.updateService.mockRejectedValueOnce(new Error('ECS: service papyrus-abc is draining'))
    const failed = await post('stop')
    expect(failed.status).toBe(502)
    expect(failed.body).toMatchObject({ ok: false, message: expect.stringContaining('draining'), deployment: { status: 'starting' } })
    expect(lifecycle('dep_abc')?.state).toBe('running')
  })

  it('the Stop confirm says the platform fee continues', async () => {
    const { get, hosted } = setup()
    hosted()
    expect(await (await get('/deploy/dep_abc')).text()).toContain('the $250/month platform fee continues while stopped')
  })

  it('start scales back to 1, puts health back to pending and re-checks it', async () => {
    const { h, post, hosted, lifecycle } = setup()
    hosted()
    await post('/deploy/dep_abc/stop')
    aws.updateService.mockClear()
    expect((await post('/deploy/dep_abc/start')).status).toBe(303)
    expect(aws.updateService).toHaveBeenCalledWith({ cluster: 'arn:cluster/papyrus-hosted', service: 'papyrus-abc', desiredCount: 1 })
    expect(lifecycle('dep_abc')?.state).toBe('running')
    const steps = JSON.parse(h.deployment('dep_abc').steps as string)
    expect(steps.deploy.status).toBe('pass')
    // Checked straight away; within the startup grace a no-answer is "still starting", not a failure.
    expect(steps.health).toMatchObject({ status: 'pending', reason: expect.stringContaining('still starting') })
  })

  it('BYOC stop/start goes through the customer role and only changes desiredCount', async () => {
    const { post, byoc, lifecycle } = setup()
    await byoc()
    await post('/deploy/dep_byoc/stop')
    expect(aws.assumeRole).toHaveBeenCalledWith(expect.objectContaining({ RoleArn: 'arn:aws:iam::333333333333:role/BeagLabsPapyrusControlPlane', ExternalId: 'beag-customer' }))
    expect(aws.updateService).toHaveBeenCalledWith({ cluster: 'papyrus-byoc', service: 'papyrus-byoc', desiredCount: 0 })
    expect(lifecycle('dep_byoc')?.state).toBe('stopped')
    await post('/deploy/dep_byoc/start')
    expect(aws.updateService).toHaveBeenLastCalledWith({ cluster: 'papyrus-byoc', service: 'papyrus-byoc', desiredCount: 1 })
    for (const name of DELETE_CALLS) expect(aws[name], name).not.toHaveBeenCalled()
  })

  it('the hourly VM-hour cron skips deployments stopped before the hour', async () => {
    const { h, stripe, hosted } = setup()
    hosted('dep_run', 'running-org', 'pd_run', 1)
    hosted('dep_stop', 'stopped-org', 'pd_stop', 2)
    h.sql.prepare("INSERT INTO deployment_lifecycle (deployment_id, state, changed_at) VALUES ('dep_stop', 'stopped', '2026-10-17T12:30:00.000Z')").run()
    await scheduled(h.env, Date.parse('2026-10-17T15:05:00.000Z'), { fetch: stripe.fetch })
    expect(stripe.meterEvents().map((e) => e.form.get('identifier'))).toEqual(['pd_run:2026-10-17T14:00:00.000Z'])
  })
})

describe('Delete (hosted teardown)', () => {
  it('requires the exact org name', async () => {
    const { post, hosted, lifecycle, stripe } = setup()
    hosted()
    for (const typed of ['', 'Acme', 'acm', 'acme.papyrus.beaglabs.com']) {
      const response = await post('/deploy/dep_abc/delete', { confirm: typed })
      expect(response.status, typed).toBe(400)
      expect(await response.text()).toContain('Type acme exactly to confirm.')
    }
    expect(lifecycle('dep_abc')).toBeUndefined()
    expect(aws.log).toEqual([])
    expect(stripe.calls.filter((c) => c.method === 'DELETE')).toEqual([])
  })

  it('cancels Stripe, revokes the license, deletes AWS resources in order, resumes after a failure, releases the org name', async () => {
    const { h, post, get, hosted, lifecycle, stripe } = setup()
    hosted()
    aws.deleteTargetGroup.mockImplementationOnce(async () => {
      aws.log.push('deleteTargetGroup')
      throw Object.assign(new Error('Target group is in use'), { _tag: 'ResourceInUseException' })
    })

    expect((await post('/deploy/dep_abc/delete', { confirm: 'acme' })).status).toBe(303)
    // Billing first: the subscription is canceled now, prorated, with a final invoice for usage.
    const cancel = stripe.calls.find((c) => c.method === 'DELETE')!
    expect(cancel.path).toBe('/v1/subscriptions/sub_dep_abc')
    expect(cancel.form.get('prorate')).toBe('true')
    expect(cancel.form.get('invoice_now')).toBe('true')
    expect(h.license.revokeDeployment).toHaveBeenCalledWith('pd_123')
    // Stopped at the failing step.
    expect(aws.log).toEqual(['assumeRole', 'updateService', 'deleteService', 'assumeRole', 'listTaskDefinitions', 'deregisterTaskDefinition', 'deregisterTaskDefinition', 'assumeRole', 'deleteRule', 'deleteTargetGroup'])
    expect(aws.updateService).toHaveBeenCalledWith({ cluster: 'arn:cluster/papyrus-hosted', service: 'papyrus-abc', desiredCount: 0 })
    expect(aws.deleteService).toHaveBeenCalledWith({ cluster: 'arn:cluster/papyrus-hosted', service: 'papyrus-abc', force: true })
    expect(lifecycle('dep_abc')?.state).toBe('deleting')
    expect(JSON.parse(lifecycle('dep_abc')!.teardown)).toMatchObject({ billing: { status: 'pass' }, license: { status: 'pass' }, service: { status: 'pass' }, routing: { status: 'fail' } })
    const page = await (await get('/deploy/dep_abc')).text()
    expect(page).toContain('data-tone="err"><span class="pill-dot" aria-hidden="true"></span>Failed</span>')
    expect(page).toContain('Failed at Remove the listener rule and target group')
    expect(page).toMatch(/data-action="teardown">.*Retry teardown/)
    // Still deleting: the org name is not free yet.
    expect((await (await get('/api/org-names/check?name=acme')).json()) as any).toMatchObject({ available: false })

    // Retry resumes at the failed step; nothing before it runs again.
    aws.log.length = 0
    await post('/deploy/dep_abc/teardown')
    expect(aws.log).toEqual(['assumeRole', 'deleteTargetGroup', 'assumeRole', 'deleteAccessPoint', 'registerTaskDefinition', 'runTask'])
    expect(aws.deleteRule).toHaveBeenCalledTimes(1)
    expect(aws.deleteService).toHaveBeenCalledTimes(1)
    expect(stripe.calls.filter((c) => c.method === 'DELETE')).toHaveLength(1)
    // The data directory goes with a one-off task that mounts the file system root and removes /tenants/<id>.
    const cleanup = aws.registerTaskDefinition.mock.calls[0]![0]
    expect(cleanup.family).toBe('papyrus-hosted-cleanup')
    expect(cleanup.volumes[0].efsVolumeConfiguration).toMatchObject({ fileSystemId: 'fs-1', rootDirectory: '/' })
    expect(cleanup.containerDefinitions[0].command.join(' ')).toContain('rm -rf -- "/efs/tenants/$TENANT"')
    expect(aws.runTask.mock.calls[0]![0]).toMatchObject({
      cluster: 'arn:cluster/papyrus-hosted',
      overrides: { containerOverrides: [{ name: 'cleanup', environment: [{ name: 'TENANT', value: 'dep_abc' }] }] },
    })
    expect(JSON.parse(lifecycle('dep_abc')!.teardown).data).toMatchObject({ status: 'pending' })

    // The cleanup task finished: secrets (no recovery window), logs, then the org name is released.
    aws.log.length = 0
    await post('/deploy/dep_abc/teardown')
    expect(aws.log).toEqual(['assumeRole', 'describeTasks', 'assumeRole', 'deleteSecret', 'deleteSecret', 'deleteSecret', 'assumeRole', 'deleteLogGroup'])
    expect(aws.deleteSecret.mock.calls.map(([input]) => input)).toEqual([
      { SecretId: HOSTED_RESOURCES.bootstrapSecretArn, ForceDeleteWithoutRecovery: true },
      { SecretId: HOSTED_RESOURCES.licenseSecretArn, ForceDeleteWithoutRecovery: true },
      { SecretId: HOSTED_RESOURCES.masterKeySecretArn, ForceDeleteWithoutRecovery: true },
    ])
    expect(aws.deleteLogGroup).toHaveBeenCalledWith({ logGroupName: '/papyrus/pd_123' })
    expect(lifecycle('dep_abc')?.state).toBe('deleted')

    // Gone from the list, kept in D1 for audit; Activity has one line per step.
    expect(h.deployment('dep_abc')).toMatchObject({ billing_state: 'suspended', hostname: 'acme.papyrus.beaglabs.com' })
    const list = await (await get('/deploy')).text()
    expect(list).not.toContain('acme.papyrus.beaglabs.com')
    const lines = h.sql.prepare("SELECT level, message FROM events WHERE source = 'lifecycle' ORDER BY id").all() as Array<{ level: string; message: string }>
    expect(lines.at(-1)).toEqual({ level: 'ok', message: 'Deleted acme.papyrus.beaglabs.com.' })
    expect(lines.some((line) => line.level === 'error' && line.message.startsWith('Remove the listener rule and target group'))).toBe(true)

    // The org name can be claimed again.
    expect((await (await get('/api/org-names/check?name=acme')).json()) as any).toMatchObject({ available: true })
    h.insertDeployment({ id: 'dep_new', billing_state: 'none' })
    expect((await post('/deploy/dep_new/org', { org: 'acme', terms: 'accept' })).status).toBe(303)
    expect(h.deployment('dep_new')).toMatchObject({ provider: 'hosted', hostname: 'acme.papyrus.beaglabs.com' })
  })

  it('never deletes shared infrastructure', async () => {
    const { post, hosted } = setup()
    hosted()
    await post('/deploy/dep_abc/delete', { confirm: 'acme' })
    await post('/deploy/dep_abc/teardown')
    const shared = new Set(Object.values(READY).flat().filter((v) => typeof v === 'string'))
    for (const name of DELETE_CALLS) {
      for (const [input] of (aws[name] as ReturnType<typeof vi.fn>).mock.calls) {
        for (const value of Object.values(input as Record<string, unknown>)) if (typeof value === 'string' && name !== 'deleteService' && name !== 'runTask') expect(shared.has(value), `${name} ${value}`).toBe(false)
      }
    }
    // The service delete names the shared cluster only as its location.
    expect(aws.deleteService.mock.calls[0]![0].service).toBe('papyrus-abc')

    // A saved id that is actually shared (e.g. the HTTPS listener) is refused, not deleted.
    const resources: Record<string, unknown> = { listenerRuleArn: READY.httpsListenerArn }
    aws.log.length = 0
    const run = Effect.runPromise(
      hostedTeardownStep(hostedProviderContext(setup().h.env), READY, { deploymentId: 'dep_abc', licenseDeploymentId: 'pd_123', resources }, 'routing').pipe(Effect.provide(FetchHttpClient.layer)) as Effect.Effect<unknown>,
    )
    await expect(run).rejects.toThrow(/shared hosted infrastructure/)
    expect(aws.log).toEqual(['assumeRole'])
  })
})

describe('Delete (BYOC)', () => {
  it('deletes nothing in the customer cloud: cancels billing, revokes the license, lists what to remove', async () => {
    const { h, post, get, byoc, lifecycle, stripe } = setup()
    await byoc()
    expect((await post('/deploy/dep_byoc/delete', { confirm: 'contoso' })).status).toBe(400)
    expect((await post('/deploy/dep_byoc/delete', { confirm: 'papyrus.contoso.com' })).status).toBe(303)
    expect(aws.log).toEqual([])
    expect(stripe.calls.find((c) => c.method === 'DELETE')?.path).toBe('/v1/subscriptions/sub_dep_byoc')
    expect(h.license.revokeDeployment).toHaveBeenCalledWith('pd_123')
    expect(lifecycle('dep_byoc')?.state).toBe('deleted')
    const html = await (await get('/deploy/dep_byoc')).text()
    expect(html).toContain('Remove from your cloud account')
    for (const name of ['arn:aws:ecs:us-east-1:333:service/papyrus-byoc/papyrus-byoc', 'fs-customer', 'arn:alb/customer', 'papyrus/pd_123/master-key', '/papyrus/pd_123', 'BeagLabsPapyrus', 'papyrus.contoso.com', 'sg-c1'])
      expect(html, name).toContain(name)
  })
})

describe('Connect AWS template', () => {
  it('grants the teardown and health-check actions, scoped to Papyrus resources', () => {
    const template = connectTemplate()
    for (const action of [
      'ecs:DeleteService',
      'ecs:DeregisterTaskDefinition',
      'ecs:ListTaskDefinitions',
      'ecs:RunTask',
      'ecs:StopTask',
      'elasticloadbalancing:DeleteRule',
      'elasticloadbalancing:DeleteTargetGroup',
      'elasticloadbalancing:ModifyTargetGroup',
      'elasticfilesystem:DeleteAccessPoint',
      'secretsmanager:DeleteSecret',
      'logs:DeleteLogGroup',
    ])
      expect(template, action).toContain(action)
    expect(template).toContain('service/papyrus-*/papyrus-*')
    expect(template).toContain('task-definition/papyrus-hosted-cleanup:*')
    expect(template).toContain('targetgroup/papyrus-*/*')
    expect(template).toContain("'aws:ResourceTag/beaglabs:papyrus': 'false'")
    expect(template).toContain('log-group:/papyrus/*')
    // Nothing that could remove shared infrastructure.
    for (const action of ['DeleteCluster', 'DeleteLoadBalancer', 'DeleteListener', 'DeleteFileSystem', 'DeleteCertificate', 'DeleteSecurityGroup']) expect(template).not.toContain(action)
  })
})
