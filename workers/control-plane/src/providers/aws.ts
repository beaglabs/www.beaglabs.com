import * as Acm from '@distilled.cloud/aws/acm'
import * as AwsCredentials from '@distilled.cloud/aws/Credentials'
import * as Ec2 from '@distilled.cloud/aws/ec2'
import * as Ecs from '@distilled.cloud/aws/ecs'
import * as Efs from '@distilled.cloud/aws/efs'
import * as Elb from '@distilled.cloud/aws/elastic-load-balancing-v2'
import * as Logs from '@distilled.cloud/aws/cloudwatch-logs'
import * as SecretsManager from '@distilled.cloud/aws/secrets-manager'
import * as Sts from '@distilled.cloud/aws/sts'
import type { RegionName } from '@distilled.cloud/aws/Region'
import * as Effect from 'effect/Effect'
import * as Redacted from 'effect/Redacted'
import { randomBytes, toBase64 } from '../crypto'
import type { DnsRecord } from '../dns'
import { ProviderError, providerError, required, type AwsBase, type DeployContext, type DeployRecipe, type DeployResult, type ProviderContext } from './types'

/**
 * AWS: ECS Fargate + EFS behind an Application Load Balancer with an ACM certificate, in the customer's default VPC.
 *
 * Access: the customer launches our CloudFormation quick-create stack, which creates the role
 * `BeagLabsPapyrusControlPlane` trusting only Beag Labs' principal with their own ExternalId, scoped to what this recipe
 * calls, plus `PapyrusTaskExecution` (the ECS task execution role). We assume the role for every check and deploy.
 *
 * The 32-byte master key lives only in Secrets Manager. A tiny init container (`keywriter`) writes it into a task-local
 * volume that the Papyrus container mounts read-only at the key path; the key is never in the image or on EFS.
 */

export const STACK_NAME = 'BeagLabsPapyrus'
export const CONTROL_PLANE_ROLE = 'BeagLabsPapyrusControlPlane'
export const TASK_EXECUTION_ROLE = 'PapyrusTaskExecution'
export const PORT = 3210
export const UID = 65532

/** Fargate CPU architecture. Unset = the task definition says nothing (Fargate's default, X86_64). */
export type CpuArchitecture = 'ARM64' | 'X86_64'

/** CloudFormation quick-create link for the Connect AWS button. */
export const quickCreateUrl = (input: { templateUrl: string; externalId: string; principalArn: string; region?: string }) => {
  const region = input.region ?? 'us-east-1'
  const params = new URLSearchParams({
    templateURL: input.templateUrl,
    stackName: STACK_NAME,
    param_ExternalId: input.externalId,
    param_BeagLabsPrincipal: input.principalArn,
  })
  return `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/quickcreate?${params.toString()}`
}

/** The template behind the quick-create link (served at /aws/connect-template.yaml; upload the same file to S3). */
export const connectTemplate = (): string => `AWSTemplateFormatVersion: '2010-09-09'
Description: >-
  Lets Beag Labs deploy and update Papyrus in this account (ECS Fargate, EFS, ALB, ACM, Secrets Manager under papyrus/).
  Only Beag Labs' principal can assume the role, and only with your ExternalId. Delete this stack to revoke access.
Parameters:
  ExternalId:
    Type: String
    NoEcho: true
    Description: Unique to your Papyrus account. Do not change.
  BeagLabsPrincipal:
    Type: String
    Description: Beag Labs' AWS principal ARN. Do not change.
Resources:
  PapyrusTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ${TASK_EXECUTION_ROLE}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ecs-tasks.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: papyrus-secrets
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Sub arn:aws:secretsmanager:*:\${AWS::AccountId}:secret:papyrus/*
  BeagLabsControlPlaneRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ${CONTROL_PLANE_ROLE}
      MaxSessionDuration: 3600
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { AWS: !Ref BeagLabsPrincipal }
            Action: sts:AssumeRole
            Condition:
              StringEquals: { 'sts:ExternalId': !Ref ExternalId }
      Policies:
        - PolicyName: papyrus-deploy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeRegions
                  - ec2:DescribeVpcs
                  - ec2:DescribeSubnets
                  - ec2:DescribeSecurityGroups
                  - ec2:CreateSecurityGroup
                  - ec2:AuthorizeSecurityGroupIngress
                  - ec2:CreateTags
                  - elasticfilesystem:CreateFileSystem
                  - elasticfilesystem:CreateMountTarget
                  - elasticfilesystem:CreateAccessPoint
                  - elasticfilesystem:Describe*
                  - elasticfilesystem:TagResource
                  - ecs:CreateCluster
                  - ecs:RegisterTaskDefinition
                  - ecs:CreateService
                  - ecs:UpdateService
                  - ecs:Describe*
                  - ecs:TagResource
                  - elasticloadbalancing:CreateLoadBalancer
                  - elasticloadbalancing:CreateTargetGroup
                  - elasticloadbalancing:CreateListener
                  - elasticloadbalancing:ModifyListener
                  - elasticloadbalancing:CreateRule
                  - elasticloadbalancing:Describe*
                  - elasticloadbalancing:AddTags
                  - acm:RequestCertificate
                  - acm:DescribeCertificate
                  - acm:ListCertificates
                  - acm:AddTagsToCertificate
                  - logs:CreateLogGroup
                  - logs:PutRetentionPolicy
                  - logs:TagResource
                Resource: '*'
              - Effect: Allow
                Action:
                  - secretsmanager:CreateSecret
                  - secretsmanager:PutSecretValue
                  - secretsmanager:DescribeSecret
                  - secretsmanager:TagResource
                Resource: !Sub arn:aws:secretsmanager:*:\${AWS::AccountId}:secret:papyrus/*
              - Effect: Allow
                Action: iam:PassRole
                Resource: !GetAtt PapyrusTaskExecutionRole.Arn
              - Effect: Allow
                Action: iam:CreateServiceLinkedRole
                Resource: '*'
                Condition:
                  StringLike:
                    'iam:AWSServiceName':
                      - ecs.amazonaws.com
                      - elasticloadbalancing.amazonaws.com
                      - elasticfilesystem.amazonaws.com
Outputs:
  RoleArn:
    Description: Paste this into papyrus.beaglabs.com
    Value: !GetAtt BeagLabsControlPlaneRole.Arn
`

const ROLE_ARN = /^arn:aws(-[a-z]+)*:iam::(\d{12}):role\/[\w+=,.@/-]+$/

export const regionOf = (ctx: ProviderContext) => (ctx.credentials.region?.trim() || 'us-east-1') as RegionName

/** Assume the customer's role with Beag Labs' principal and the customer's ExternalId. */
export const assumeCustomerRole = (base: AwsBase, roleArn: string, externalId: string, region: RegionName) =>
  Effect.gen(function* () {
    const assumed = yield* Sts.assumeRole({ RoleArn: roleArn, RoleSessionName: 'papyrus-control-plane', ExternalId: externalId, DurationSeconds: 900 }).pipe(
      Effect.provide(
        AwsCredentials.fromCredentials({ accessKeyId: Redacted.make(base.accessKeyId), secretAccessKey: Redacted.make(base.secretAccessKey) }, 'us-east-1' as RegionName),
      ),
      Effect.mapError(providerError('Could not assume the role (is the CloudFormation stack complete, and the ARN from its RoleArn output?)')),
    )
    const credentials = assumed.Credentials
    if (!credentials) return yield* new ProviderError({ message: 'AWS STS returned no credentials' })
    return AwsCredentials.fromCredentials(
      {
        accessKeyId: Redacted.make(credentials.AccessKeyId),
        secretAccessKey: Redacted.isRedacted(credentials.SecretAccessKey) ? credentials.SecretAccessKey : Redacted.make(credentials.SecretAccessKey),
        sessionToken: Redacted.make(credentials.SessionToken),
      },
      region,
    )
  })

export const customerLayer = (ctx: ProviderContext) =>
  Effect.gen(function* () {
    const roleArn = yield* required(ctx.credentials, 'roleArn')
    if (!ROLE_ARN.test(roleArn)) return yield* new ProviderError({ message: 'roleArn must look like arn:aws:iam::123456789012:role/BeagLabsPapyrusControlPlane' })
    if (!ctx.externalId) return yield* new ProviderError({ message: 'This account has no AWS ExternalId yet; use the Connect AWS button' })
    return { layer: yield* assumeCustomerRole(ctx.aws, roleArn, ctx.externalId, regionOf(ctx)), accountId: ROLE_ARN.exec(roleArn)![2]! }
  })

export const awsCheck = (ctx: ProviderContext) =>
  Effect.gen(function* () {
    const { layer, accountId } = yield* customerLayer(ctx)
    const identity = yield* Sts.getCallerIdentity({}).pipe(Effect.provide(layer), Effect.mapError(providerError('AWS rejected the assumed role')))
    yield* Ec2.describeRegions({}).pipe(Effect.provide(layer), Effect.mapError(providerError(`The role cannot read ${regionOf(ctx)}`)))
    return `AWS account ${identity.Account ?? accountId}, ${regionOf(ctx)}`
  })

export const tags = (ctx: DeployContext) => [
  { Key: 'beaglabs:papyrus', Value: ctx.licenseDeploymentId },
  { Key: 'Name', Value: `papyrus-${ctx.deploymentId}` },
]

export const short = (ctx: DeployContext) => ctx.deploymentId.replace(/^dep_/, '').slice(0, 16)

/** Remember a resource id the moment it exists, so a retry never creates a second one. */
export const remember = <A>(ctx: Pick<DeployContext, 'resources'>, key: string, create: Effect.Effect<A, ProviderError, any>, pick: (value: A) => string | undefined) =>
  Effect.gen(function* () {
    const existing = ctx.resources[key]
    if (typeof existing === 'string') return existing
    const id = pick(yield* create)
    if (!id) return yield* new ProviderError({ message: `AWS did not return ${key}` })
    ctx.resources[key] = id
    return id
  })

export const ignoreDuplicate = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.catch((error) => (/Duplicate|AlreadyExists/i.test(String((error as { _tag?: string })?._tag ?? '') + String((error as { message?: string })?.message ?? '')) ? Effect.void : Effect.fail(error))))

export const pending = (reason: string, dnsRecords: DnsRecord[] = []): DeployResult => ({ status: 'pending', reason, dnsRecords })

/** Secrets: bootstrap token, license, and the master key (generated once, only ever in Secrets Manager), under papyrus/<deploymentId>/. */
export const ensureSecrets = (ctx: DeployContext) =>
  Effect.gen(function* () {
    const secret = (key: string, secretName: string, value: () => string) =>
      remember(
        ctx,
        key,
        SecretsManager.createSecret({ Name: secretName, SecretString: value(), Tags: tags(ctx) }).pipe(Effect.mapError(providerError(`Creating secret ${secretName} failed`))),
        (out) => out.ARN,
      )
    const prefix = `papyrus/${ctx.licenseDeploymentId}`
    const bootstrapArn = yield* secret('bootstrapSecretArn', `${prefix}/bootstrap-token`, () => ctx.secretEnv.PAPYRUS_BOOTSTRAP_TOKEN ?? '')
    const licenseArn = yield* secret('licenseSecretArn', `${prefix}/license`, () => ctx.secretEnv.PAPYRUS_LICENSE ?? '')
    const masterKeyArn = yield* secret('masterKeySecretArn', `${prefix}/master-key`, () => toBase64(randomBytes(32)))
    return { bootstrapArn, licenseArn, masterKeyArn }
  })

export const ensureLogGroup = (ctx: DeployContext) =>
  Effect.gen(function* () {
    const logGroup = `/papyrus/${ctx.licenseDeploymentId}`
    if (!ctx.resources.logGroup) {
      yield* ignoreDuplicate(Logs.createLogGroup({ logGroupName: logGroup })).pipe(Effect.mapError(providerError('Creating the log group failed')))
      ctx.resources.logGroup = logGroup
    }
    return logGroup
  })

/** Task definition: keywriter writes the master key to a task-local volume; Papyrus mounts it read-only. 2 vCPU / 8 GB. */
export const registerTask = (
  ctx: DeployContext,
  input: {
    family: string
    accountId: string
    region: string
    fileSystemId: string
    accessPointId: string
    logGroup: string
    secrets: { bootstrapArn: string; licenseArn: string; masterKeyArn: string }
    /** Omitted: no runtimePlatform (Fargate default, X86_64). */
    architecture?: CpuArchitecture
  },
) => {
  const keyDir = ctx.secretKeyPath.replace(/\/[^/]+$/, '')
  const environment = Object.entries(ctx.env).map(([key, value]) => ({ name: key, value }))
  const { family, accountId, region, fileSystemId, accessPointId, logGroup } = input
  return Ecs.registerTaskDefinition({
    family,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '2048',
    memory: '8192',
    ...(input.architecture ? { runtimePlatform: { cpuArchitecture: input.architecture, operatingSystemFamily: 'LINUX' } } : {}),
    executionRoleArn: `arn:aws:iam::${accountId}:role/${TASK_EXECUTION_ROLE}`,
    volumes: [
      { name: 'data', efsVolumeConfiguration: { fileSystemId, transitEncryption: 'ENABLED', authorizationConfig: { accessPointId, iam: 'DISABLED' } } },
      { name: 'secret-key' },
    ],
    containerDefinitions: [
      {
        name: 'keywriter',
        image: 'public.ecr.aws/docker/library/busybox:1.37',
        essential: false,
        secrets: [{ name: 'KEY_B64', valueFrom: input.secrets.masterKeyArn }],
        command: ['sh', '-c', `umask 222 && printf %s "$KEY_B64" | base64 -d > ${ctx.secretKeyPath} && chown ${UID}:${UID} ${ctx.secretKeyPath} && chmod 0400 ${ctx.secretKeyPath}`],
        mountPoints: [{ sourceVolume: 'secret-key', containerPath: keyDir }],
        logConfiguration: { logDriver: 'awslogs', options: { 'awslogs-group': logGroup, 'awslogs-region': region, 'awslogs-stream-prefix': 'keywriter' } },
      },
      {
        name: 'papyrus',
        image: ctx.image,
        essential: true,
        user: `${UID}:${UID}`,
        portMappings: [{ containerPort: PORT, protocol: 'tcp' }],
        environment,
        secrets: [
          { name: 'PAPYRUS_BOOTSTRAP_TOKEN', valueFrom: input.secrets.bootstrapArn },
          { name: 'PAPYRUS_LICENSE', valueFrom: input.secrets.licenseArn },
        ],
        mountPoints: [
          { sourceVolume: 'data', containerPath: '/var/lib/papyrus' },
          { sourceVolume: 'secret-key', containerPath: keyDir, readOnly: true },
        ],
        dependsOn: [{ containerName: 'keywriter', condition: 'SUCCESS' }],
        logConfiguration: { logDriver: 'awslogs', options: { 'awslogs-group': logGroup, 'awslogs-region': region, 'awslogs-stream-prefix': 'papyrus' } },
      },
    ],
    tags: tags(ctx).map(({ Key, Value }) => ({ key: Key, value: Value })),
  }).pipe(Effect.mapError(providerError('Registering the task definition failed')))
}

export interface AwsRecipeOptions {
  /** Fargate CPU architecture; unset keeps the task definition as it always was (no runtimePlatform). */
  architecture?: CpuArchitecture
}

const deploy = (options: AwsRecipeOptions) => (ctx: DeployContext) =>
  Effect.gen(function* () {
    const { layer, accountId } = yield* customerLayer(ctx)
    const region = regionOf(ctx)
    const name = `papyrus-${short(ctx)}`
    const fail = (what: string) => providerError(what)

    const program = Effect.gen(function* () {
      // Network: the default VPC and its subnets (public, so Fargate can pull from ghcr.io).
      const vpcId = yield* remember(
        ctx,
        'vpcId',
        Ec2.describeVpcs({ Filters: [{ Name: 'is-default', Values: ['true'] }] }).pipe(Effect.mapError(fail('Listing VPCs failed'))),
        (out) => out.Vpcs?.[0]?.VpcId,
      ).pipe(Effect.mapError(() => new ProviderError({ message: `No default VPC in ${region}. Create one (VPC console → Actions → Create default VPC) and retry.` })))
      const subnets = yield* Ec2.describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }).pipe(Effect.mapError(fail('Listing subnets failed')))
      const byZone = new Map<string, string>()
      for (const subnet of subnets.Subnets ?? []) if (subnet.AvailabilityZone && subnet.SubnetId && !byZone.has(subnet.AvailabilityZone)) byZone.set(subnet.AvailabilityZone, subnet.SubnetId)
      const subnetIds = [...byZone.values()].slice(0, 3)
      if (subnetIds.length < 2) return yield* new ProviderError({ message: 'The default VPC needs subnets in at least two availability zones' })

      const sg = (key: string, description: string) =>
        remember(ctx, key, Ec2.createSecurityGroup({ GroupName: `${name}-${key}`, Description: description, VpcId: vpcId }).pipe(Effect.mapError(fail(`Creating ${key} failed`))), (out) => out.GroupId)
      const albSg = yield* sg('albSecurityGroup', 'Papyrus load balancer: HTTPS from anywhere')
      const taskSg = yield* sg('taskSecurityGroup', 'Papyrus container: only from its load balancer')
      const efsSg = yield* sg('efsSecurityGroup', 'Papyrus data volume: only from the container')
      if (!ctx.resources.securityRules) {
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
        ctx.resources.securityRules = true
      }

      // Data volume: encrypted EFS, an access point owned by the image's non-root user.
      const fileSystemId = yield* remember(
        ctx,
        'fileSystemId',
        Efs.createFileSystem({ CreationToken: ctx.deploymentId, Encrypted: true, PerformanceMode: 'generalPurpose', Tags: tags(ctx) }).pipe(
          Effect.catch(() => Efs.describeFileSystems({ CreationToken: ctx.deploymentId }).pipe(Effect.map((out) => out.FileSystems?.[0] ?? {}))),
          Effect.mapError(fail('Creating the EFS file system failed')),
        ),
        (out) => (out as { FileSystemId?: string }).FileSystemId,
      )
      if (!ctx.resources.mountTargets) {
        const fs = yield* Efs.describeFileSystems({ FileSystemId: fileSystemId }).pipe(Effect.mapError(fail('Reading the EFS file system failed')))
        if (fs.FileSystems?.[0]?.LifeCycleState !== 'available') return pending('The EFS file system is still being created. Retry in a minute.')
        for (const SubnetId of subnetIds) {
          yield* ignoreDuplicate(Efs.createMountTarget({ FileSystemId: fileSystemId, SubnetId, SecurityGroups: [efsSg] })).pipe(Effect.mapError(fail('Creating EFS mount targets failed')))
        }
        ctx.resources.mountTargets = true
      }
      const accessPointId = yield* remember(
        ctx,
        'accessPointId',
        Efs.createAccessPoint({
          ClientToken: `${ctx.deploymentId}-ap`,
          FileSystemId: fileSystemId,
          PosixUser: { Uid: UID, Gid: UID },
          RootDirectory: { Path: '/papyrus', CreationInfo: { OwnerUid: UID, OwnerGid: UID, Permissions: '750' } },
          Tags: tags(ctx),
        }).pipe(Effect.mapError(fail('Creating the EFS access point failed'))),
        (out) => out.AccessPointId,
      )

      const { bootstrapArn, licenseArn, masterKeyArn } = yield* ensureSecrets(ctx)
      const logGroup = yield* ensureLogGroup(ctx)

      // Load balancer, target group and certificate.
      const targetGroupArn = yield* remember(
        ctx,
        'targetGroupArn',
        Elb.createTargetGroup({
          Name: `${name}-tg`.slice(0, 32),
          Protocol: 'HTTP',
          Port: PORT,
          VpcId: vpcId,
          TargetType: 'ip',
          HealthCheckPath: '/api/health',
          Matcher: { HttpCode: '200' },
        }).pipe(Effect.mapError(fail('Creating the target group failed'))),
        (out) => out.TargetGroups?.[0]?.TargetGroupArn,
      )
      const loadBalancerArn = yield* remember(
        ctx,
        'loadBalancerArn',
        Elb.createLoadBalancer({ Name: `${name}-alb`.slice(0, 32), Subnets: subnetIds, SecurityGroups: [albSg], Scheme: 'internet-facing', Type: 'application', Tags: tags(ctx) }).pipe(
          Effect.tap((out) => Effect.sync(() => (ctx.resources.loadBalancerDns = out.LoadBalancers?.[0]?.DNSName))),
          Effect.mapError(fail('Creating the load balancer failed')),
        ),
        (out) => out.LoadBalancers?.[0]?.LoadBalancerArn,
      )
      if (!ctx.resources.httpListenerArn) {
        yield* remember(
          ctx,
          'httpListenerArn',
          Elb.createListener({
            LoadBalancerArn: loadBalancerArn,
            Protocol: 'HTTP',
            Port: 80,
            DefaultActions: [{ Type: 'redirect', RedirectConfig: { Protocol: 'HTTPS', Port: '443', StatusCode: 'HTTP_301' } }],
          }).pipe(Effect.mapError(fail('Creating the HTTP listener failed'))),
          (out) => out.Listeners?.[0]?.ListenerArn,
        )
      }
      if (ctx.resources.certificateHostname !== ctx.hostname) {
        delete ctx.resources.certificateArn
        delete ctx.resources.httpsListenerArn
      }
      const certificateArn = yield* remember(
        ctx,
        'certificateArn',
        Acm.requestCertificate({ DomainName: ctx.hostname, ValidationMethod: 'DNS', IdempotencyToken: short(ctx).replace(/[^\w]/g, '').slice(0, 32) }).pipe(
          Effect.mapError(fail('Requesting the certificate failed')),
        ),
        (out) => out.CertificateArn,
      )
      ctx.resources.certificateHostname = ctx.hostname

      const task = yield* registerTask(ctx, { family: name, accountId, region, fileSystemId, accessPointId, logGroup, secrets: { bootstrapArn, licenseArn, masterKeyArn }, architecture: options.architecture })
      ctx.resources.taskDefinitionArn = task.taskDefinition?.taskDefinitionArn
      ctx.resources.subnetIds = subnetIds
      yield* remember(ctx, 'clusterArn', Ecs.createCluster({ clusterName: name }).pipe(Effect.mapError(fail('Creating the ECS cluster failed'))), (out) => out.cluster?.clusterArn)

      // An existing service picks up the new task definition (image update); a new one starts after TLS is ready.
      if (ctx.resources.serviceArn) {
        yield* Ecs.updateService({ cluster: name, service: name, taskDefinition: ctx.resources.taskDefinitionArn as string, forceNewDeployment: true }).pipe(
          Effect.mapError(fail('Updating the ECS service failed')),
        )
      }

      const records = yield* dnsRecordsFor(ctx, certificateArn)
      if (!records) return pending('Waiting for AWS to publish the certificate validation record. Retry in a minute.')
      return { status: 'pass', dnsRecords: records } satisfies DeployResult
    })
    return yield* program.pipe(Effect.provide(layer))
  })

const dnsRecordsFor = (ctx: DeployContext, certificateArn: string) =>
  Effect.gen(function* () {
    const described = yield* Acm.describeCertificate({ CertificateArn: certificateArn }).pipe(Effect.mapError(providerError('Reading the certificate failed')))
    const validation = described.Certificate?.DomainValidationOptions?.[0]?.ResourceRecord
    const albDns = ctx.resources.loadBalancerDns as string | undefined
    if (!validation || !albDns) return null
    return [
      { type: 'CNAME', name: ctx.hostname, value: albDns, purpose: 'Points your hostname at the Papyrus load balancer' },
      { type: 'CNAME', name: validation.Name.replace(/\.$/, ''), value: validation.Value.replace(/\.$/, ''), purpose: 'Validates the TLS certificate (keep it: renewals use it)' },
    ] satisfies DnsRecord[]
  })

/** After DNS verifies: wait for the certificate, add the HTTPS listener, start the service. */
const afterDns = (ctx: DeployContext) =>
  Effect.gen(function* () {
    const { layer } = yield* customerLayer(ctx)
    const name = `papyrus-${short(ctx)}`
    const program = Effect.gen(function* () {
      const certificateArn = ctx.resources.certificateArn as string
      const described = yield* Acm.describeCertificate({ CertificateArn: certificateArn }).pipe(Effect.mapError(providerError('Reading the certificate failed')))
      const status = described.Certificate?.Status
      if (status === 'FAILED' || status === 'VALIDATION_TIMED_OUT') return { status: 'fail', reason: `Certificate ${status.toLowerCase().replace('_', ' ')}; check the validation record and redeploy.`, dnsRecords: [] } satisfies DeployResult
      if (status !== 'ISSUED') return pending('DNS is correct. AWS is issuing the certificate (usually a few minutes).')
      yield* remember(
        ctx,
        'httpsListenerArn',
        Elb.createListener({
          LoadBalancerArn: ctx.resources.loadBalancerArn as string,
          Protocol: 'HTTPS',
          Port: 443,
          SslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
          Certificates: [{ CertificateArn: certificateArn }],
          DefaultActions: [{ Type: 'forward', TargetGroupArn: ctx.resources.targetGroupArn as string }],
        }).pipe(Effect.mapError(providerError('Creating the HTTPS listener failed'))),
        (out) => out.Listeners?.[0]?.ListenerArn,
      )
      yield* remember(
        ctx,
        'serviceArn',
        Ecs.createService({
          cluster: name,
          serviceName: name,
          taskDefinition: ctx.resources.taskDefinitionArn as string,
          desiredCount: 1,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: { subnets: ctx.resources.subnetIds as string[], securityGroups: [ctx.resources.taskSecurityGroup as string], assignPublicIp: 'ENABLED' },
          },
          loadBalancers: [{ targetGroupArn: ctx.resources.targetGroupArn as string, containerName: 'papyrus', containerPort: PORT }],
          healthCheckGracePeriodSeconds: 300,
        }).pipe(Effect.mapError(providerError('Creating the ECS service failed'))),
        (out) => out.service?.serviceArn,
      )
      return { status: 'pass', dnsRecords: [] } satisfies DeployResult
    })
    return yield* program.pipe(Effect.provide(layer))
  })

/** The customer-cloud (BYOC) recipe. `architecture` is only set when passed. */
export const makeAwsRecipe = (options: AwsRecipeOptions = {}): DeployRecipe => ({ deploy: deploy(options), afterDns })

export const awsRecipe: DeployRecipe = makeAwsRecipe()
