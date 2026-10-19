import * as Acm from '@distilled.cloud/aws/acm'
import * as Ec2 from '@distilled.cloud/aws/ec2'
import * as Ecs from '@distilled.cloud/aws/ecs'
import * as Efs from '@distilled.cloud/aws/efs'
import * as Elb from '@distilled.cloud/aws/elastic-load-balancing-v2'
import * as Effect from 'effect/Effect'
import type { DnsRecord } from '../dns'
import { HOSTED_DOMAIN, hostedHostname, infraReady, type HostedInfra } from '../hosted'
import {
  CLEANUP_FAMILY,
  PORT,
  customerLayer,
  ensureLogGroup,
  ensureSecrets,
  ignoreDuplicate,
  regionOf,
  registerTask,
  remember,
  serviceName,
  short,
  tags,
  type CpuArchitecture,
} from './aws'
import * as Logs from '@distilled.cloud/aws/cloudwatch-logs'
import * as SecretsManager from '@distilled.cloud/aws/secrets-manager'
import { ProviderError, providerError, type DeployContext, type DeployResult, type ProviderContext } from './types'

/**
 * Hosted by Beag Labs, on AWS in Beag Labs' own account (us-east-2), reusing the customer AWS recipe's pieces
 * (assumed role, secrets, log group, task definition).
 *
 * Shared, created once by `bootstrapHosted`: the default VPC's subnets, one ECS cluster, one ALB with a wildcard ACM
 * certificate for *.papyrus.beaglabs.com, one encrypted EFS file system, and three security groups.
 *
 * Per customer (`hostedDeploy`): an EFS access point (own root directory and POSIX uid/gid), a target group, a
 * host-header rule on the shared HTTPS listener, secrets under papyrus/<deploymentId>/ (incl. their own master key),
 * a log group, a task definition (Graviton/ARM64 by default) and a Fargate service.
 */

export const HOSTED_NAME = 'papyrus-hosted'
export const WILDCARD = `*.${HOSTED_DOMAIN}`
/** Customer N's access point uid/gid is POSIX_BASE + N (never the image's 65532, never another customer's). */
export const POSIX_BASE = 100000

/** Answers in both of Papyrus's modes (setup and running); the target group health check and the health step use it. */
export const HEALTH_CHECK_PATH = '/api/config/public'

const ensureHealthCheckPath = (targetGroupArn: string) =>
  Elb.describeTargetGroups({ TargetGroupArns: [targetGroupArn] }).pipe(
    Effect.flatMap((out) => {
      const group = out.TargetGroups?.[0]
      return group && group.HealthCheckPath !== HEALTH_CHECK_PATH
        ? Elb.modifyTargetGroup({ TargetGroupArn: targetGroupArn, HealthCheckPath: HEALTH_CHECK_PATH, Matcher: { HttpCode: '200' } })
        : Effect.void
    }),
    Effect.ignore,
  )

const notFound = (error: unknown) => /NotFound/i.test(String((error as { _tag?: string })?._tag ?? '') + String((error as { message?: string })?.message ?? ''))

/** Find-or-null: a NotFound answer is "doesn't exist yet", anything else is an error. */
const orNull = <A, E, R>(effect: Effect.Effect<A, E, R>) => effect.pipe(Effect.catch((error) => (notFound(error) ? Effect.succeed(null) : Effect.fail(error))))

export interface BootstrapResult {
  status: 'ready' | 'pending'
  reason: string
  /** Records the owner adds in Cloudflare (DNS only, grey cloud). */
  dnsRecords: DnsRecord[]
  infra: HostedInfra
}

/**
 * One-time, idempotent bootstrap of the shared hosted infrastructure. Every resource is looked up (saved id, then by
 * name/token) before it is created, so rerunning it leaves existing resources alone. Mutates `infra`; the caller saves it.
 */
export const bootstrapHosted = (ctx: ProviderContext, infra: HostedInfra) =>
  Effect.gen(function* () {
    const { layer } = yield* customerLayer(ctx)
    const box = { resources: infra as Record<string, unknown> }
    const fail = (what: string) => providerError(what)

    const program = Effect.gen(function* () {
      // Network: the default VPC, one public subnet per availability zone.
      const vpcId = yield* remember(
        box,
        'vpcId',
        Ec2.describeVpcs({ Filters: [{ Name: 'is-default', Values: ['true'] }] }).pipe(Effect.mapError(fail('Listing VPCs failed'))),
        (out) => out.Vpcs?.[0]?.VpcId,
      ).pipe(Effect.mapError(() => new ProviderError({ message: `No default VPC in ${regionOf(ctx)}. Create one (VPC console → Actions → Create default VPC) and rerun.` })))
      if (!infra.subnetIds?.length) {
        const subnets = yield* Ec2.describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }).pipe(Effect.mapError(fail('Listing subnets failed')))
        const byZone = new Map<string, string>()
        for (const subnet of subnets.Subnets ?? []) if (subnet.AvailabilityZone && subnet.SubnetId && !byZone.has(subnet.AvailabilityZone)) byZone.set(subnet.AvailabilityZone, subnet.SubnetId)
        const subnetIds = [...byZone.values()].slice(0, 3)
        if (subnetIds.length < 2) return yield* new ProviderError({ message: 'The default VPC needs subnets in at least two availability zones' })
        infra.subnetIds = subnetIds
      }

      // Security groups, found by name before being created.
      const sg = (key: 'albSecurityGroup' | 'taskSecurityGroup' | 'efsSecurityGroup', suffix: string, description: string) =>
        remember(
          box,
          key,
          Ec2.describeSecurityGroups({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }, { Name: 'group-name', Values: [`${HOSTED_NAME}-${suffix}`] }] }).pipe(
            Effect.flatMap((out) =>
              out.SecurityGroups?.[0]?.GroupId ? Effect.succeed({ GroupId: out.SecurityGroups[0].GroupId }) : Ec2.createSecurityGroup({ GroupName: `${HOSTED_NAME}-${suffix}`, Description: description, VpcId: vpcId }),
            ),
            Effect.mapError(fail(`Creating the ${suffix} security group failed`)),
          ),
          (out) => out.GroupId,
        )
      const albSg = yield* sg('albSecurityGroup', 'alb', 'Papyrus hosted load balancer: HTTPS from anywhere')
      const taskSg = yield* sg('taskSecurityGroup', 'task', 'Papyrus hosted containers: only from the load balancer')
      const efsSg = yield* sg('efsSecurityGroup', 'efs', 'Papyrus hosted data: only from the containers')
      if (!infra.securityRules) {
        const open = (GroupId: string, port: number, from: { CidrIp?: string; GroupId?: string }) =>
          ignoreDuplicate(
            Ec2.authorizeSecurityGroupIngress({
              GroupId,
              IpPermissions: [{ IpProtocol: 'tcp', FromPort: port, ToPort: port, ...(from.CidrIp ? { IpRanges: [{ CidrIp: from.CidrIp }] } : { UserIdGroupPairs: [{ GroupId: from.GroupId }] }) }],
            }),
          ).pipe(Effect.mapError(fail('Opening security group ports failed')))
        yield* open(albSg, 443, { CidrIp: '0.0.0.0/0' })
        yield* open(albSg, 80, { CidrIp: '0.0.0.0/0' })
        yield* open(taskSg, PORT, { GroupId: albSg })
        yield* open(efsSg, 2049, { GroupId: taskSg })
        infra.securityRules = true
      }

      // One cluster (CreateCluster returns the existing one by name).
      yield* remember(box, 'clusterArn', Ecs.createCluster({ clusterName: HOSTED_NAME }).pipe(Effect.mapError(fail('Creating the ECS cluster failed'))), (out) => out.cluster?.clusterArn)

      // One encrypted EFS file system (found by creation token), mount targets in each subnet.
      const fileSystemId = yield* remember(
        box,
        'fileSystemId',
        Efs.describeFileSystems({ CreationToken: HOSTED_NAME }).pipe(
          Effect.flatMap((out) =>
            out.FileSystems?.[0]?.FileSystemId
              ? Effect.succeed(out.FileSystems[0])
              : Efs.createFileSystem({ CreationToken: HOSTED_NAME, Encrypted: true, PerformanceMode: 'generalPurpose', Tags: [{ Key: 'Name', Value: HOSTED_NAME }, { Key: 'beaglabs:papyrus', Value: 'hosted' }] }),
          ),
          Effect.mapError(fail('Creating the EFS file system failed')),
        ),
        (out) => (out as { FileSystemId?: string }).FileSystemId,
      )
      let waiting: string | null = null
      if (!infra.mountTargets) {
        const fs = yield* Efs.describeFileSystems({ FileSystemId: fileSystemId }).pipe(Effect.mapError(fail('Reading the EFS file system failed')))
        if (fs.FileSystems?.[0]?.LifeCycleState !== 'available') waiting = 'The EFS file system is still being created.'
        else {
          for (const SubnetId of infra.subnetIds!) {
            yield* ignoreDuplicate(Efs.createMountTarget({ FileSystemId: fileSystemId, SubnetId, SecurityGroups: [efsSg] })).pipe(
              // EFS allows one mount target per AZ and answers MountTargetConflict when that AZ is already covered (a rerun
              // after hosted_infra was lost): the containers in that AZ use the existing one.
              Effect.catch((error) => (/MountTargetConflict|already exists/i.test(`${(error as { _tag?: string })?._tag ?? ''} ${(error as { message?: string })?.message ?? ''}`) ? Effect.void : Effect.fail(error))),
              Effect.mapError(fail('Creating EFS mount targets failed')),
            )
          }
          infra.mountTargets = true
        }
      }

      // Wildcard certificate (found by domain before being requested), DNS-validated.
      const certificateArn = yield* remember(
        box,
        'certificateArn',
        Acm.listCertificates({}).pipe(
          Effect.flatMap((out) => {
            const existing = out.CertificateSummaryList?.find((cert) => cert.DomainName === WILDCARD && cert.Status !== 'FAILED' && cert.Status !== 'VALIDATION_TIMED_OUT')
            return existing ? Effect.succeed({ CertificateArn: existing.CertificateArn }) : Acm.requestCertificate({ DomainName: WILDCARD, ValidationMethod: 'DNS', IdempotencyToken: 'papyrushosted' })
          }),
          Effect.mapError(fail('Requesting the wildcard certificate failed')),
        ),
        (out) => out.CertificateArn,
      )
      const certificate = yield* Acm.describeCertificate({ CertificateArn: certificateArn }).pipe(Effect.mapError(fail('Reading the certificate failed')))
      const validation = certificate.Certificate?.DomainValidationOptions?.[0]?.ResourceRecord
      const certStatus = certificate.Certificate?.Status

      // One internet-facing ALB (found by name before being created).
      const loadBalancerArn = yield* remember(
        box,
        'loadBalancerArn',
        orNull(Elb.describeLoadBalancers({ Names: [HOSTED_NAME] })).pipe(
          Effect.flatMap((out) =>
            out?.LoadBalancers?.[0]?.LoadBalancerArn
              ? Effect.succeed(out)
              : Elb.createLoadBalancer({ Name: HOSTED_NAME, Subnets: infra.subnetIds!, SecurityGroups: [albSg], Scheme: 'internet-facing', Type: 'application', Tags: [{ Key: 'beaglabs:papyrus', Value: 'hosted' }] }),
          ),
          Effect.tap((out) => Effect.sync(() => (infra.loadBalancerDns = out.LoadBalancers?.[0]?.DNSName ?? infra.loadBalancerDns))),
          Effect.mapError(fail('Creating the load balancer failed')),
        ),
        (out) => out.LoadBalancers?.[0]?.LoadBalancerArn,
      )
      if (!infra.loadBalancerDns) {
        const described = yield* Elb.describeLoadBalancers({ LoadBalancerArns: [loadBalancerArn] }).pipe(Effect.mapError(fail('Reading the load balancer failed')))
        infra.loadBalancerDns = described.LoadBalancers?.[0]?.DNSName
      }

      // Listeners: HTTP redirects to HTTPS; HTTPS (wildcard cert) answers 404 unless a customer host rule matches.
      if (!infra.httpListenerArn || !infra.httpsListenerArn) {
        const listeners = yield* Elb.describeListeners({ LoadBalancerArn: loadBalancerArn }).pipe(Effect.mapError(fail('Reading the listeners failed')))
        const onPort = (port: number) => listeners.Listeners?.find((listener) => listener.Port === port)?.ListenerArn
        infra.httpListenerArn ??= onPort(80)
        infra.httpsListenerArn ??= onPort(443)
      }
      yield* remember(
        box,
        'httpListenerArn',
        Elb.createListener({
          LoadBalancerArn: loadBalancerArn,
          Protocol: 'HTTP',
          Port: 80,
          DefaultActions: [{ Type: 'redirect', RedirectConfig: { Protocol: 'HTTPS', Port: '443', StatusCode: 'HTTP_301' } }],
        }).pipe(Effect.mapError(fail('Creating the HTTP listener failed'))),
        (out) => out.Listeners?.[0]?.ListenerArn,
      )
      if (certStatus === 'ISSUED') {
        yield* remember(
          box,
          'httpsListenerArn',
          Elb.createListener({
            LoadBalancerArn: loadBalancerArn,
            Protocol: 'HTTPS',
            Port: 443,
            SslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
            Certificates: [{ CertificateArn: certificateArn }],
            DefaultActions: [{ Type: 'fixed-response', FixedResponseConfig: { StatusCode: '404', ContentType: 'text/plain', MessageBody: 'No Papyrus workspace at this address.' } }],
          }).pipe(Effect.mapError(fail('Creating the HTTPS listener failed'))),
          (out) => out.Listeners?.[0]?.ListenerArn,
        )
      } else if (certStatus === 'FAILED' || certStatus === 'VALIDATION_TIMED_OUT') {
        return yield* new ProviderError({ message: `The wildcard certificate is ${certStatus}. Delete it in ACM and rerun the bootstrap.` })
      } else waiting ??= 'Waiting for the wildcard certificate: add the validation CNAME below; ACM issues it within minutes.'

      const dnsRecords: DnsRecord[] = []
      if (validation) dnsRecords.push({ type: 'CNAME', name: validation.Name.replace(/\.$/, ''), value: validation.Value.replace(/\.$/, ''), purpose: 'Validates the wildcard certificate (keep it: renewals use it)' })
      if (infra.loadBalancerDns) dnsRecords.push({ type: 'CNAME', name: WILDCARD, value: infra.loadBalancerDns, purpose: 'Every hosted customer: <org>.papyrus.beaglabs.com → the shared load balancer (DNS only)' })

      return {
        status: infraReady(infra) && !waiting ? 'ready' : 'pending',
        reason: waiting ?? 'Hosted infrastructure is ready.',
        dnsRecords,
        infra,
      } satisfies BootstrapResult
    })
    return yield* program.pipe(Effect.provide(layer))
  })

export interface HostedOrgInput {
  name: string
  slot: number
}

export interface HostedRecipeOptions {
  /** Fargate CPU architecture for hosted tasks. Default ARM64 (Graviton); the image digest is a multi-arch index. */
  architecture?: CpuArchitecture
}

/**
 * The listener rule priority for a hostname: the org's slot when free, else the lowest free one. The listener can hold
 * rules D1 no longer knows about (hosted_orgs restarted at slot 1 after a database move), so the slot alone can clash.
 * An older rule for the same hostname must come after ours (lower number wins); the role cannot modify or delete it.
 */
const rulePriority = (listenerArn: string, hostname: string, slot: number) =>
  Effect.gen(function* () {
    const used = new Set<number>()
    let sameHost: number | null = null
    let marker: string | undefined
    do {
      const page = yield* Elb.describeRules({ ListenerArn: listenerArn, PageSize: 400, ...(marker ? { Marker: marker } : {}) }).pipe(Effect.mapError(providerError('Reading the listener rules failed')))
      for (const rule of page.Rules ?? []) {
        const priority = Number(rule.Priority)
        if (!Number.isInteger(priority)) continue // the default rule
        used.add(priority)
        const hosts = (rule.Conditions ?? []).flatMap((c) => (c.Field === 'host-header' ? (c.HostHeaderConfig?.Values ?? c.Values ?? []) : []))
        if (hosts.includes(hostname)) sameHost = Math.min(sameHost ?? priority, priority)
      }
      marker = page.NextMarker
    } while (marker)
    let priority = slot
    if (used.has(priority) || (sameHost !== null && priority > sameHost)) {
      priority = 1
      while (used.has(priority)) priority++
    }
    if (sameHost !== null && priority > sameHost)
      return yield* new ProviderError({ message: `${hostname} is still routed by an older listener rule (priority ${sameHost}). Delete that rule in AWS, then retry.` })
    return priority
  })

/** Per-customer hosted deploy: everything in one pass (the shared HTTPS listener and wildcard certificate already exist). */
export const hostedDeploy = (ctx: DeployContext, infra: HostedInfra, org: HostedOrgInput, options: HostedRecipeOptions = {}) =>
  Effect.gen(function* () {
    if (!infraReady(infra)) return yield* new ProviderError({ message: 'Hosted deployments are not open yet. Beag Labs has been notified; retry shortly.' })
    const { layer, accountId } = yield* customerLayer(ctx)
    const region = regionOf(ctx)
    const name = serviceName(ctx.deploymentId)
    const hostname = hostedHostname(org.name)
    const posixId = POSIX_BASE + org.slot
    const fail = (what: string) => providerError(what)

    const program = Effect.gen(function* () {
      // Data: this customer's own directory and uid/gid on the shared file system.
      const accessPointId = yield* remember(
        ctx,
        'accessPointId',
        Efs.createAccessPoint({
          ClientToken: `${ctx.deploymentId}-ap`,
          FileSystemId: infra.fileSystemId!,
          PosixUser: { Uid: posixId, Gid: posixId },
          RootDirectory: { Path: `/tenants/${ctx.deploymentId}`, CreationInfo: { OwnerUid: posixId, OwnerGid: posixId, Permissions: '700' } },
          Tags: tags(ctx),
        }).pipe(Effect.mapError(fail('Creating the EFS access point failed'))),
        (out) => out.AccessPointId,
      )

      const secrets = yield* ensureSecrets(ctx)
      const logGroup = yield* ensureLogGroup(ctx)

      // Routing: a target group and a host-header rule on the shared HTTPS listener.
      const existingTargetGroup = typeof ctx.resources.targetGroupArn === 'string'
      const targetGroupArn = yield* remember(
        ctx,
        'targetGroupArn',
        Elb.createTargetGroup({
          Name: `${name}-tg`.slice(0, 32),
          Protocol: 'HTTP',
          Port: PORT,
          VpcId: infra.vpcId!,
          TargetType: 'ip',
          HealthCheckPath: HEALTH_CHECK_PATH,
          Matcher: { HttpCode: '200' },
        }).pipe(Effect.mapError(fail('Creating the target group failed'))),
        (out) => out.TargetGroups?.[0]?.TargetGroupArn,
      )
      // Target groups created before the health check moved to /api/config/public are fixed on redeploy (best effort:
      // a role without ModifyTargetGroup yet must not block a redeploy).
      if (existingTargetGroup) yield* ensureHealthCheckPath(targetGroupArn)
      yield* remember(
        ctx,
        'listenerRuleArn',
        Effect.gen(function* () {
          const priority = yield* rulePriority(infra.httpsListenerArn!, hostname, org.slot)
          return yield* Elb.createRule({
            ListenerArn: infra.httpsListenerArn!,
            Priority: priority,
            Conditions: [{ Field: 'host-header', HostHeaderConfig: { Values: [hostname] } }],
            Actions: [{ Type: 'forward', TargetGroupArn: targetGroupArn }],
            Tags: tags(ctx),
          }).pipe(Effect.mapError(fail('Routing the hostname failed')))
        }),
        (out) => out.Rules?.[0]?.RuleArn,
      )

      const task = yield* registerTask(ctx, {
        family: name,
        accountId,
        region,
        fileSystemId: infra.fileSystemId!,
        accessPointId,
        logGroup,
        secrets,
        architecture: options.architecture ?? 'ARM64',
      })
      const taskDefinition = task.taskDefinition?.taskDefinitionArn
      if (!taskDefinition) return yield* new ProviderError({ message: 'AWS did not return the task definition' })
      ctx.resources.taskDefinitionArn = taskDefinition
      ctx.resources.hostname = hostname

      // The service: created once, then updated with each new task definition (image updates).
      if (ctx.resources.serviceArn) {
        yield* Ecs.updateService({ cluster: infra.clusterArn!, service: name, taskDefinition, forceNewDeployment: true }).pipe(Effect.mapError(fail('Updating the ECS service failed')))
      } else {
        yield* remember(
          ctx,
          'serviceArn',
          Ecs.createService({
            cluster: infra.clusterArn!,
            serviceName: name,
            taskDefinition,
            desiredCount: 1,
            launchType: 'FARGATE',
            networkConfiguration: { awsvpcConfiguration: { subnets: infra.subnetIds!, securityGroups: [infra.taskSecurityGroup!], assignPublicIp: 'ENABLED' } },
            loadBalancers: [{ targetGroupArn, containerName: 'papyrus', containerPort: PORT }],
            healthCheckGracePeriodSeconds: 300,
            tags: tags(ctx).map(({ Key, Value }) => ({ key: Key, value: Value })),
          }).pipe(Effect.mapError(fail('Creating the ECS service failed'))),
          (out) => out.service?.serviceArn,
        )
      }
      return { status: 'pass', reason: `Deployed. Papyrus is starting at https://${hostname}/.`, dnsRecords: [] } satisfies DeployResult
    })
    return yield* program.pipe(Effect.provide(layer))
  })

// Stop / Start -------------------------------------------------------------------------------------------------------

/** Stop (0) or start (1) a hosted deployment: only the service's desiredCount changes. */
export const hostedScale = (ctx: ProviderContext, infra: HostedInfra, deploymentId: string, desiredCount: 0 | 1) =>
  Effect.gen(function* () {
    if (!infra.clusterArn) return yield* new ProviderError({ message: 'Hosted infrastructure is not set up.' })
    const { layer } = yield* customerLayer(ctx)
    yield* Ecs.updateService({ cluster: infra.clusterArn, service: serviceName(deploymentId), desiredCount }).pipe(
      Effect.provide(layer),
      Effect.mapError(providerError(desiredCount === 0 ? 'Stopping the ECS service failed' : 'Starting the ECS service failed')),
    )
  })

// Teardown -----------------------------------------------------------------------------------------------------------

/**
 * Deleting a hosted deployment removes only what was created for it, in this order. Every step is idempotent (a
 * resource that is already gone counts as deleted) and records progress in `resources`, so a retry after a failure
 * resumes where it stopped. Shared infrastructure (cluster, ALB and its listeners, EFS file system, wildcard
 * certificate, security groups, DNS) is never touched: `assertNotShared` refuses any id that belongs to it.
 */
export const HOSTED_TEARDOWN_STEPS = ['service', 'taskDefinitions', 'routing', 'data', 'secrets', 'logs'] as const
export type HostedTeardownStep = (typeof HOSTED_TEARDOWN_STEPS)[number]

export interface TeardownTarget {
  /** Control-plane deployment id (service name, EFS directory). */
  deploymentId: string
  /** License deployment id (secret and log group names). */
  licenseDeploymentId: string | null
  /** The deployment's saved resources. Mutated: deleted ids are removed, progress markers are added. */
  resources: Record<string, unknown>
}

export interface TeardownOutcome {
  status: 'pass' | 'pending' | 'fail'
  reason: string
}

/**
 * EFS has no API to delete files. The data directory is removed by a one-off Fargate task in the shared cluster that
 * mounts the file system root (the customer's access point is already deleted) and runs `rm -rf /efs/tenants/<id>`.
 * The id arrives as $TENANT and is checked again in the shell; the command itself is fixed in the task definition.
 */
export const CLEANUP_SCRIPT =
  'case "$TENANT" in dep_*) ;; *) echo "refusing: bad tenant"; exit 2 ;; esac; ' +
  'case "$TENANT" in *[!a-z0-9_]*) echo "refusing: bad tenant"; exit 2 ;; esac; ' +
  'rm -rf -- "/efs/tenants/$TENANT" && test ! -e "/efs/tenants/$TENANT"'

const TENANT_ID = /^dep_[a-z0-9]+$/

const gone = (error: unknown) =>
  /NotFound|NotActive|does not exist|not found/i.test(String((error as { _tag?: string })?._tag ?? '') + ' ' + String((error as { message?: string })?.message ?? ''))

/** Delete-or-gone: a resource that no longer exists counts as deleted. */
const deleted = <A, E, R>(effect: Effect.Effect<A, E, R>) => effect.pipe(Effect.asVoid, Effect.catch((error) => (gone(error) ? Effect.void : Effect.fail(error))))

const sharedIds = (infra: HostedInfra) =>
  new Set(
    Object.values(infra)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  )

/** Refuse to delete anything that is part of the shared hosted infrastructure. */
export const assertNotShared = (infra: HostedInfra, id: string) =>
  sharedIds(infra).has(id) ? Effect.fail(new ProviderError({ message: `Refusing to delete ${id}: it is shared hosted infrastructure.` })) : Effect.void

const cleanupTaskDefinition = (infra: HostedInfra) =>
  Effect.gen(function* () {
    if (infra.cleanupTaskDefinitionArn) return infra.cleanupTaskDefinitionArn as string
    const registered = yield* Ecs.registerTaskDefinition({
      family: CLEANUP_FAMILY,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      runtimePlatform: { cpuArchitecture: 'ARM64', operatingSystemFamily: 'LINUX' },
      volumes: [{ name: 'efs', efsVolumeConfiguration: { fileSystemId: infra.fileSystemId!, rootDirectory: '/', transitEncryption: 'ENABLED' } }],
      containerDefinitions: [
        {
          name: 'cleanup',
          image: 'public.ecr.aws/docker/library/busybox:1.37',
          essential: true,
          user: '0:0',
          command: ['sh', '-c', CLEANUP_SCRIPT],
          mountPoints: [{ sourceVolume: 'efs', containerPath: '/efs' }],
        },
      ],
      tags: [{ key: 'beaglabs:papyrus', value: 'hosted' }],
    }).pipe(Effect.mapError(providerError('Registering the cleanup task failed')))
    const arn = registered.taskDefinition?.taskDefinitionArn
    if (!arn) return yield* new ProviderError({ message: 'AWS did not return the cleanup task definition' })
    infra.cleanupTaskDefinitionArn = arn
    return arn
  })

/** One teardown step. `infra` may gain `cleanupTaskDefinitionArn`; the caller saves both it and `target.resources`. */
export const hostedTeardownStep = (ctx: ProviderContext, infra: HostedInfra, target: TeardownTarget, step: HostedTeardownStep) =>
  Effect.gen(function* () {
    const { layer } = yield* customerLayer(ctx)
    const name = serviceName(target.deploymentId)
    const resources = target.resources
    const pass = (reason: string): TeardownOutcome => ({ status: 'pass', reason })

    const program: Effect.Effect<TeardownOutcome, ProviderError, any> = Effect.gen(function* () {
      switch (step) {
        case 'service': {
          if (!infra.clusterArn) return pass('No ECS service.')
          const cluster = infra.clusterArn
          yield* deleted(Ecs.updateService({ cluster, service: name, desiredCount: 0 })).pipe(Effect.mapError(providerError('Scaling the ECS service to 0 failed')))
          yield* deleted(Ecs.deleteService({ cluster, service: name, force: true })).pipe(Effect.mapError(providerError('Deleting the ECS service failed')))
          delete resources.serviceArn
          return pass(`Scaled to 0 and deleted the ECS service ${name}.`)
        }
        case 'taskDefinitions': {
          const arns: string[] = []
          let nextToken: string | undefined
          do {
            const page = yield* Ecs.listTaskDefinitions({ familyPrefix: name, status: 'ACTIVE', ...(nextToken ? { nextToken } : {}) }).pipe(
              Effect.mapError(providerError('Listing task definitions failed')),
            )
            // familyPrefix is a prefix: keep only this deployment's own family.
            arns.push(...(page.taskDefinitionArns ?? []).filter((arn) => arn.split('/').pop()?.replace(/:\d+$/, '') === name))
            nextToken = page.nextToken
          } while (nextToken)
          for (const taskDefinition of arns) {
            yield* deleted(Ecs.deregisterTaskDefinition({ taskDefinition })).pipe(Effect.mapError(providerError('Deregistering a task definition failed')))
          }
          delete resources.taskDefinitionArn
          return pass(arns.length ? `Deregistered ${arns.length} task definition${arns.length === 1 ? '' : 's'} (${name}).` : 'No task definitions left.')
        }
        case 'routing': {
          if (typeof resources.listenerRuleArn === 'string') {
            yield* assertNotShared(infra, resources.listenerRuleArn)
            yield* deleted(Elb.deleteRule({ RuleArn: resources.listenerRuleArn })).pipe(Effect.mapError(providerError('Deleting the listener rule failed')))
            delete resources.listenerRuleArn
          }
          if (typeof resources.targetGroupArn === 'string') {
            yield* assertNotShared(infra, resources.targetGroupArn)
            yield* deleted(Elb.deleteTargetGroup({ TargetGroupArn: resources.targetGroupArn })).pipe(Effect.mapError(providerError('Deleting the target group failed')))
            delete resources.targetGroupArn
          }
          return pass('Removed the listener rule and target group.')
        }
        case 'data': {
          if (typeof resources.accessPointId === 'string') {
            yield* assertNotShared(infra, resources.accessPointId)
            yield* deleted(Efs.deleteAccessPoint({ AccessPointId: resources.accessPointId })).pipe(Effect.mapError(providerError('Deleting the EFS access point failed')))
            delete resources.accessPointId
          }
          if (resources.dataDeleted === true || !infra.fileSystemId) return pass('Deleted the EFS access point and data directory.')
          if (!TENANT_ID.test(target.deploymentId)) return yield* new ProviderError({ message: 'Unexpected deployment id; not deleting data.' })
          if (typeof resources.cleanupTaskArn !== 'string') {
            const taskDefinition = yield* cleanupTaskDefinition(infra)
            const started = yield* Ecs.runTask({
              cluster: infra.clusterArn!,
              taskDefinition,
              launchType: 'FARGATE',
              count: 1,
              startedBy: `cleanup-${short({ deploymentId: target.deploymentId })}`,
              networkConfiguration: { awsvpcConfiguration: { subnets: infra.subnetIds!, securityGroups: [infra.taskSecurityGroup!], assignPublicIp: 'ENABLED' } },
              overrides: { containerOverrides: [{ name: 'cleanup', environment: [{ name: 'TENANT', value: target.deploymentId }] }] },
            }).pipe(Effect.mapError(providerError('Starting the data cleanup task failed')))
            const taskArn = started.tasks?.[0]?.taskArn
            if (!taskArn) return yield* new ProviderError({ message: `The data cleanup task did not start${started.failures?.[0]?.reason ? `: ${started.failures[0].reason}` : ''}.` })
            resources.cleanupTaskArn = taskArn
            return { status: 'pending', reason: 'Access point deleted. Deleting the data directory (one-off task, about a minute).' } satisfies TeardownOutcome
          }
          const described = yield* Ecs.describeTasks({ cluster: infra.clusterArn!, tasks: [resources.cleanupTaskArn] }).pipe(Effect.mapError(providerError('Reading the data cleanup task failed')))
          const task = described.tasks?.[0]
          if (task && task.lastStatus !== 'STOPPED') return { status: 'pending', reason: `Deleting the data directory (cleanup task ${task.lastStatus?.toLowerCase() ?? 'starting'}).` } satisfies TeardownOutcome
          delete resources.cleanupTaskArn
          const exitCode = task?.containers?.find((container) => container.name === 'cleanup')?.exitCode
          if (exitCode !== 0)
            return yield* new ProviderError({ message: `The data cleanup task did not finish (${task ? task.stoppedReason ?? `exit code ${exitCode ?? 'unknown'}` : 'task not found'}). Retry runs it again.` })
          resources.dataDeleted = true
          return pass('Deleted the EFS access point and data directory.')
        }
        case 'secrets': {
          const prefix = target.licenseDeploymentId ? `papyrus/${target.licenseDeploymentId}` : null
          const secrets: Array<[string, string | null]> = [
            ['bootstrapSecretArn', prefix && `${prefix}/bootstrap-token`],
            ['licenseSecretArn', prefix && `${prefix}/license`],
            ['masterKeySecretArn', prefix && `${prefix}/master-key`],
          ]
          for (const [key, fallback] of secrets) {
            const id = typeof resources[key] === 'string' ? (resources[key] as string) : fallback
            if (!id) continue
            if (!/(^|:secret:)papyrus\//.test(id)) return yield* new ProviderError({ message: `Refusing to delete ${id}: not a Papyrus secret.` })
            yield* deleted(SecretsManager.deleteSecret({ SecretId: id, ForceDeleteWithoutRecovery: true })).pipe(Effect.mapError(providerError('Deleting a secret failed')))
            delete resources[key]
          }
          return pass(prefix ? `Deleted the secrets under ${prefix}/ (no recovery window).` : 'No secrets.')
        }
        case 'logs': {
          const group = typeof resources.logGroup === 'string' ? resources.logGroup : target.licenseDeploymentId ? `/papyrus/${target.licenseDeploymentId}` : null
          if (!group) return pass('No log group.')
          if (!/^\/papyrus\/[\w-]+$/.test(group)) return yield* new ProviderError({ message: `Refusing to delete log group ${group}.` })
          yield* deleted(Logs.deleteLogGroup({ logGroupName: group })).pipe(Effect.mapError(providerError('Deleting the log group failed')))
          delete resources.logGroup
          return pass(`Deleted the log group ${group}.`)
        }
      }
    })
    return yield* program.pipe(Effect.provide(layer))
  })
