import * as Acm from '@distilled.cloud/aws/acm'
import * as Ec2 from '@distilled.cloud/aws/ec2'
import * as Ecs from '@distilled.cloud/aws/ecs'
import * as Efs from '@distilled.cloud/aws/efs'
import * as Elb from '@distilled.cloud/aws/elastic-load-balancing-v2'
import * as Effect from 'effect/Effect'
import type { DnsRecord } from '../dns'
import { HOSTED_DOMAIN, hostedHostname, infraReady, type HostedInfra } from '../hosted'
import {
  PORT,
  customerLayer,
  ensureLogGroup,
  ensureSecrets,
  ignoreDuplicate,
  regionOf,
  registerTask,
  remember,
  short,
  tags,
  type CpuArchitecture,
} from './aws'
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
            yield* ignoreDuplicate(Efs.createMountTarget({ FileSystemId: fileSystemId, SubnetId, SecurityGroups: [efsSg] })).pipe(Effect.mapError(fail('Creating EFS mount targets failed')))
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

/** Per-customer hosted deploy: everything in one pass (the shared HTTPS listener and wildcard certificate already exist). */
export const hostedDeploy = (ctx: DeployContext, infra: HostedInfra, org: HostedOrgInput, options: HostedRecipeOptions = {}) =>
  Effect.gen(function* () {
    if (!infraReady(infra)) return yield* new ProviderError({ message: 'Hosted deployments are not open yet. Beag Labs has been notified; retry shortly.' })
    const { layer, accountId } = yield* customerLayer(ctx)
    const region = regionOf(ctx)
    const name = `papyrus-${short(ctx)}`
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
      const targetGroupArn = yield* remember(
        ctx,
        'targetGroupArn',
        Elb.createTargetGroup({
          Name: `${name}-tg`.slice(0, 32),
          Protocol: 'HTTP',
          Port: PORT,
          VpcId: infra.vpcId!,
          TargetType: 'ip',
          HealthCheckPath: '/api/health',
          Matcher: { HttpCode: '200' },
        }).pipe(Effect.mapError(fail('Creating the target group failed'))),
        (out) => out.TargetGroups?.[0]?.TargetGroupArn,
      )
      yield* remember(
        ctx,
        'listenerRuleArn',
        Elb.createRule({
          ListenerArn: infra.httpsListenerArn!,
          Priority: org.slot,
          Conditions: [{ Field: 'host-header', HostHeaderConfig: { Values: [hostname] } }],
          Actions: [{ Type: 'forward', TargetGroupArn: targetGroupArn }],
          Tags: tags(ctx),
        }).pipe(Effect.mapError(fail('Routing the hostname failed'))),
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
