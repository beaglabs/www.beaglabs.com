import { createHash } from 'node:crypto'
import * as Effect from 'effect/Effect'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HostedInfra } from '../src/hosted'
import { hostedProviderContext } from '../src/hosted'
import { awsRecipe } from '../src/providers/aws'
import { bootstrapHosted, hostedDeploy } from '../src/providers/aws-hosted'
import type { DeployContext } from '../src/providers/types'
import { harness } from './helpers/harness'

/** Mocked Distilled AWS calls: each returns a canned response and records its input. */
const aws = vi.hoisted(() => {
  const ok = (value: unknown) => async () => value
  const mk = (impl: (input: any) => Promise<unknown>) => vi.fn(impl)
  const mocks = {
    assumeRole: mk(ok({ Credentials: { AccessKeyId: 'ASIA', SecretAccessKey: 's', SessionToken: 't' } })),
    describeVpcs: mk(ok({ Vpcs: [{ VpcId: 'vpc-1' }] })),
    describeSubnets: mk(ok({ Subnets: [{ AvailabilityZone: 'a', SubnetId: 'sn-a' }, { AvailabilityZone: 'b', SubnetId: 'sn-b' }] })),
    describeSecurityGroups: mk(ok({ SecurityGroups: [] })),
    createSecurityGroup: mk(async (input: { GroupName: string }) => ({ GroupId: `sg-${input.GroupName}` })),
    authorizeSecurityGroupIngress: mk(ok({})),
    createCluster: mk(ok({ cluster: { clusterArn: 'arn:cluster/papyrus-hosted' } })),
    describeFileSystems: mk(async (input: { CreationToken?: string }) => (input.CreationToken ? { FileSystems: [] } : { FileSystems: [{ FileSystemId: 'fs-1', LifeCycleState: 'available' }] })),
    createFileSystem: mk(ok({ FileSystemId: 'fs-1' })),
    createMountTarget: mk(ok({})),
    createAccessPoint: mk(ok({ AccessPointId: 'fsap-1' })),
    listCertificates: mk(ok({ CertificateSummaryList: [] })),
    requestCertificate: mk(ok({ CertificateArn: 'arn:cert/wildcard' })),
    describeCertificate: mk(ok({ Certificate: { Status: 'ISSUED', DomainValidationOptions: [{ ResourceRecord: { Name: '_abc.papyrus.beaglabs.com.', Value: '_xyz.acm-validations.aws.' } }] } })),
    describeLoadBalancers: mk(async () => {
      throw Object.assign(new Error('LoadBalancerNotFound'), { _tag: 'LoadBalancerNotFoundException' })
    }),
    createLoadBalancer: mk(ok({ LoadBalancers: [{ LoadBalancerArn: 'arn:alb/papyrus-hosted', DNSName: 'papyrus-hosted-1.us-east-2.elb.amazonaws.com' }] })),
    describeListeners: mk(ok({ Listeners: [] })),
    createListener: mk(async (input: { Port: number }) => ({ Listeners: [{ ListenerArn: `arn:listener/${input.Port}` }] })),
    createTargetGroup: mk(ok({ TargetGroups: [{ TargetGroupArn: 'arn:tg/acme' }] })),
    createRule: mk(ok({ Rules: [{ RuleArn: 'arn:rule/acme' }] })),
    // A target group from before the health check moved to /api/config/public.
    describeTargetGroups: mk(ok({ TargetGroups: [{ TargetGroupArn: 'arn:tg/acme', HealthCheckPath: '/api/health' }] })),
    modifyTargetGroup: mk(ok({})),
    registerTaskDefinition: mk(ok({ taskDefinition: { taskDefinitionArn: 'arn:task/acme:1' } })),
    createService: mk(ok({ service: { serviceArn: 'arn:service/acme' } })),
    updateService: mk(ok({})),
    createSecret: mk(async (input: { Name: string }) => ({ ARN: `arn:secret/${input.Name}` })),
    createLogGroup: mk(ok({})),
  }
  ;(globalThis as any).__awsMocks = mocks
  return mocks
})

/** Wrap mocks as Distilled-style Effect operations (inside the hoisted factories). */
const ops = vi.hoisted(() => async (...names: string[]) => {
  const E = await import('effect/Effect')
  const fns = (globalThis as any).__awsMocks as Record<string, (input: unknown) => Promise<unknown>>
  return Object.fromEntries(names.map((name) => [name, (input: unknown) => E.tryPromise({ try: () => fns[name]!(input), catch: (error) => error })]))
})

vi.mock('@distilled.cloud/aws/sts', () => ops('assumeRole'))
vi.mock('@distilled.cloud/aws/ec2', () => ops('describeVpcs', 'describeSubnets', 'describeSecurityGroups', 'createSecurityGroup', 'authorizeSecurityGroupIngress'))
vi.mock('@distilled.cloud/aws/ecs', () => ops('createCluster', 'registerTaskDefinition', 'createService', 'updateService'))
vi.mock('@distilled.cloud/aws/efs', () => ops('describeFileSystems', 'createFileSystem', 'createMountTarget', 'createAccessPoint'))
vi.mock('@distilled.cloud/aws/acm', () => ops('listCertificates', 'requestCertificate', 'describeCertificate'))
vi.mock('@distilled.cloud/aws/elastic-load-balancing-v2', () =>
  ops('describeLoadBalancers', 'createLoadBalancer', 'describeListeners', 'createListener', 'createTargetGroup', 'createRule', 'describeTargetGroups', 'modifyTargetGroup'),
)
vi.mock('@distilled.cloud/aws/secrets-manager', () => ops('createSecret'))
vi.mock('@distilled.cloud/aws/cloudwatch-logs', () => ops('createLogGroup'))

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

const runEffect = <A>(effect: Effect.Effect<A, unknown, any>) => Effect.runPromise(effect.pipe(Effect.provide(FetchHttpClient.layer)) as Effect.Effect<A>)

const deployCtx = (env: ReturnType<typeof harness>['env']): DeployContext => ({
  ...hostedProviderContext(env),
  deploymentId: 'dep_abc',
  licenseDeploymentId: 'pd_new',
  hostname: 'acme.papyrus.beaglabs.com',
  image: 'ghcr.io/beaglabs/papyrus/papyrus@sha256:abc',
  env: { PAPYRUS_DEPLOYMENT_ID: 'pd_new', PAPYRUS_PUBLIC_ORIGIN: 'https://acme.papyrus.beaglabs.com', PAPYRUS_SECRET_KEY_FILE: '/run/secrets/papyrus/master.key' },
  secretEnv: { PAPYRUS_BOOTSTRAP_TOKEN: 'boot-token', PAPYRUS_LICENSE: '{}' },
  secretKeyPath: '/run/secrets/papyrus/master.key',
  resources: {},
})

beforeEach(() => {
  for (const mock of Object.values(aws)) mock.mockClear()
})

describe('hosted deploy (shared AWS infrastructure)', () => {
  it("assumes Beag Labs' hosted role with the fixed ExternalId", async () => {
    const { env } = harness()
    await runEffect(hostedDeploy(deployCtx(env), READY, { name: 'acme', slot: 7 }))
    expect(aws.assumeRole).toHaveBeenCalledWith(expect.objectContaining({ RoleArn: env.HOSTED_AWS_ROLE_ARN, ExternalId: 'hosted-external-id' }))
  })

  it('builds the per-customer resources: access point, host rule, ARM64 task, service in the shared cluster', async () => {
    const { env } = harness()
    const ctx = deployCtx(env)
    const result = await runEffect(hostedDeploy(ctx, READY, { name: 'acme', slot: 7 }))
    expect(result).toMatchObject({ status: 'pass', dnsRecords: [] })

    expect(aws.createAccessPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        FileSystemId: 'fs-1',
        PosixUser: { Uid: 100007, Gid: 100007 },
        RootDirectory: { Path: '/tenants/dep_abc', CreationInfo: { OwnerUid: 100007, OwnerGid: 100007, Permissions: '700' } },
      }),
    )
    expect(aws.createTargetGroup).toHaveBeenCalledWith(expect.objectContaining({ VpcId: 'vpc-1', TargetType: 'ip', Port: 3210, HealthCheckPath: '/api/config/public' }))
    expect(aws.createRule).toHaveBeenCalledWith(
      expect.objectContaining({
        ListenerArn: 'arn:listener/443',
        Priority: 7,
        Conditions: [{ Field: 'host-header', HostHeaderConfig: { Values: ['acme.papyrus.beaglabs.com'] } }],
        Actions: [{ Type: 'forward', TargetGroupArn: 'arn:tg/acme' }],
      }),
    )
    expect(aws.createSecret.mock.calls.map(([input]) => input.Name)).toEqual(['papyrus/pd_new/bootstrap-token', 'papyrus/pd_new/license', 'papyrus/pd_new/master-key'])

    const task = aws.registerTaskDefinition.mock.calls[0]![0]
    expect(task.runtimePlatform).toEqual({ cpuArchitecture: 'ARM64', operatingSystemFamily: 'LINUX' })
    expect(task).toMatchObject({ cpu: '2048', memory: '8192', executionRoleArn: 'arn:aws:iam::222222222222:role/PapyrusTaskExecution' })
    expect(task.volumes[0]).toEqual({ name: 'data', efsVolumeConfiguration: { fileSystemId: 'fs-1', transitEncryption: 'ENABLED', authorizationConfig: { accessPointId: 'fsap-1', iam: 'DISABLED' } } })
    expect(task.containerDefinitions[1].image).toBe('ghcr.io/beaglabs/papyrus/papyrus@sha256:abc')
    expect(task.containerDefinitions[1].logConfiguration.options['awslogs-region']).toBe('us-east-2')

    expect(aws.createService).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster: 'arn:cluster/papyrus-hosted',
        taskDefinition: 'arn:task/acme:1',
        networkConfiguration: { awsvpcConfiguration: { subnets: ['sn-a', 'sn-b'], securityGroups: ['sg-task'], assignPublicIp: 'ENABLED' } },
        loadBalancers: [{ targetGroupArn: 'arn:tg/acme', containerName: 'papyrus', containerPort: 3210 }],
      }),
    )
    expect(aws.modifyTargetGroup).not.toHaveBeenCalled()
    // Nothing shared is created per customer.
    for (const shared of ['createLoadBalancer', 'createListener', 'createFileSystem', 'createCluster', 'requestCertificate', 'createSecurityGroup'] as const) expect(aws[shared]).not.toHaveBeenCalled()

    // Redeploy: same resources, new task definition rolled out to the existing service.
    for (const mock of Object.values(aws)) mock.mockClear()
    await runEffect(hostedDeploy(ctx, READY, { name: 'acme', slot: 7 }))
    expect(aws.createAccessPoint).not.toHaveBeenCalled()
    expect(aws.createRule).not.toHaveBeenCalled()
    expect(aws.createSecret).not.toHaveBeenCalled()
    expect(aws.createService).not.toHaveBeenCalled()
    expect(aws.updateService).toHaveBeenCalledWith(expect.objectContaining({ cluster: 'arn:cluster/papyrus-hosted', taskDefinition: 'arn:task/acme:1', forceNewDeployment: true }))
    // The redeploy also fixes an old target group's health-check path.
    expect(aws.modifyTargetGroup).toHaveBeenCalledWith({ TargetGroupArn: 'arn:tg/acme', HealthCheckPath: '/api/config/public', Matcher: { HttpCode: '200' } })
  })

  it('the architecture is a parameter (BYOC tasks stay without runtimePlatform)', async () => {
    const { env } = harness()
    await runEffect(hostedDeploy(deployCtx(env), READY, { name: 'acme', slot: 1 }, { architecture: 'X86_64' }))
    expect(aws.registerTaskDefinition.mock.calls[0]![0].runtimePlatform).toEqual({ cpuArchitecture: 'X86_64', operatingSystemFamily: 'LINUX' })
  })

  it('the BYOC recipe keeps its current architecture (no runtimePlatform) unless one is passed', async () => {
    const { env } = harness()
    const ctx = { ...deployCtx(env), credentials: { roleArn: 'arn:aws:iam::333333333333:role/BeagLabsPapyrusControlPlane', region: 'us-east-1' }, externalId: 'beag-customer' }
    await runEffect(awsRecipe.deploy(ctx))
    expect(aws.registerTaskDefinition.mock.calls[0]![0]).not.toHaveProperty('runtimePlatform')
    expect(aws.createRule).not.toHaveBeenCalled()
  })

  it('refuses to deploy before the shared infrastructure is bootstrapped', async () => {
    const { env } = harness()
    await expect(runEffect(hostedDeploy(deployCtx(env), {}, { name: 'acme', slot: 1 }))).rejects.toThrow(/not open yet/)
    expect(aws.createAccessPoint).not.toHaveBeenCalled()
  })

  it('claiming an org with active billing registers <org>.papyrus.beaglabs.com and deploys', async () => {
    const h = harness()
    h.insertAccount('acct_1')
    h.sql.prepare('INSERT INTO sessions (id_hash, account_id, expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update('tok').digest('hex'), 'acct_1', '2999-01-01T00:00:00.000Z')
    h.insertDeployment({ id: 'dep_abc', billing_state: 'active' })
    h.sql.prepare("INSERT INTO hosted_infra (id, data, updated_at) VALUES ('aws', ?, 'now')").run(JSON.stringify(READY))
    const response = await h.call('/deploy/dep_abc/org', { method: 'POST', headers: { cookie: 'cp_session=tok', origin: h.env.BASE_URL, 'content-type': 'application/x-www-form-urlencoded' }, body: 'org=acme' })
    expect(response.status).toBe(303)
    expect(h.license.createDeployment).toHaveBeenCalledWith({ accountId: 'acct_1', hostname: 'acme.papyrus.beaglabs.com', provider: 'hosted', organization: 'owner@example.com' })
    const row = h.deployment('dep_abc')
    expect(JSON.parse(row.steps as string).deploy).toMatchObject({ status: 'pass' })
    expect(JSON.parse(row.resources as string)).toMatchObject({ accessPointId: 'fsap-1', listenerRuleArn: 'arn:rule/acme', serviceArn: 'arn:service/acme' })
    expect(aws.createRule).toHaveBeenCalledWith(expect.objectContaining({ Priority: 1 }))
  })
})

describe('hosted bootstrap', () => {
  it('creates the shared infrastructure once, prints the Cloudflare records, and is idempotent', async () => {
    const h = harness()
    const bootstrap = () => h.call('/admin/hosted/bootstrap', { method: 'POST', headers: { authorization: 'Bearer admin-token' } })
    expect((await h.call('/admin/hosted/bootstrap', { method: 'POST', headers: { authorization: 'Bearer wrong' } })).status).toBe(404)

    const first = (await (await bootstrap()).json()) as any
    expect(first.status).toBe('ready')
    expect(first.dnsRecords).toEqual([
      expect.objectContaining({ type: 'CNAME', name: '_abc.papyrus.beaglabs.com', value: '_xyz.acm-validations.aws' }),
      expect.objectContaining({ type: 'CNAME', name: '*.papyrus.beaglabs.com', value: 'papyrus-hosted-1.us-east-2.elb.amazonaws.com' }),
    ])
    expect(first.cloudflare).toHaveLength(2)
    expect(aws.requestCertificate).toHaveBeenCalledWith(expect.objectContaining({ DomainName: '*.papyrus.beaglabs.com', ValidationMethod: 'DNS' }))
    expect(aws.createListener.mock.calls.map(([input]) => input.Port)).toEqual([80, 443])
    expect(aws.createSecurityGroup).toHaveBeenCalledTimes(3)

    for (const mock of Object.values(aws)) mock.mockClear()
    const second = (await (await bootstrap()).json()) as any
    expect(second.status).toBe('ready')
    for (const create of ['createSecurityGroup', 'createFileSystem', 'createMountTarget', 'requestCertificate', 'createLoadBalancer', 'createListener', 'authorizeSecurityGroupIngress'] as const) {
      expect(aws[create], create).not.toHaveBeenCalled()
    }
  })

  it('finds existing resources by name instead of creating duplicates, and waits for the certificate', async () => {
    aws.describeSecurityGroups.mockImplementation(async (input: any) => ({ SecurityGroups: [{ GroupId: `sg-existing-${input.Filters[1].Values[0]}` }] }))
    aws.describeFileSystems.mockImplementation(async () => ({ FileSystems: [{ FileSystemId: 'fs-existing', LifeCycleState: 'available' }] }))
    aws.listCertificates.mockImplementation(async () => ({ CertificateSummaryList: [{ DomainName: '*.papyrus.beaglabs.com', CertificateArn: 'arn:cert/existing', Status: 'PENDING_VALIDATION' }] }))
    aws.describeCertificate.mockImplementation(async () => ({ Certificate: { Status: 'PENDING_VALIDATION', DomainValidationOptions: [{ ResourceRecord: { Name: '_v.papyrus.beaglabs.com.', Value: '_w.acm-validations.aws.' } }] } }))
    aws.describeLoadBalancers.mockImplementation(async () => ({ LoadBalancers: [{ LoadBalancerArn: 'arn:alb/existing', DNSName: 'existing.elb.amazonaws.com' }] }))
    aws.describeListeners.mockImplementation(async () => ({ Listeners: [{ Port: 80, ListenerArn: 'arn:listener/existing-80' }] }))
    const { env } = harness()
    const infra: HostedInfra = {}
    const result = await runEffect(bootstrapHosted(hostedProviderContext(env), infra))
    expect(result.status).toBe('pending')
    expect(result.reason).toMatch(/wildcard certificate/)
    expect(infra).toMatchObject({ albSecurityGroup: 'sg-existing-papyrus-hosted-alb', fileSystemId: 'fs-existing', certificateArn: 'arn:cert/existing', loadBalancerArn: 'arn:alb/existing', httpListenerArn: 'arn:listener/existing-80' })
    expect(infra.httpsListenerArn).toBeUndefined()
    for (const create of ['createSecurityGroup', 'createFileSystem', 'requestCertificate', 'createLoadBalancer', 'createListener'] as const) expect(aws[create], create).not.toHaveBeenCalled()
    expect(result.dnsRecords.map((r) => r.name)).toEqual(['_v.papyrus.beaglabs.com', '*.papyrus.beaglabs.com'])
  })
})
