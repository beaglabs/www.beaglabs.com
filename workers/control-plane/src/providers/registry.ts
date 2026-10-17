import * as Azure from '@distilled.cloud/azure'
import * as AzureResources from '@distilled.cloud/azure/resources'
import * as Cloudflare from '@distilled.cloud/cloudflare/Credentials'
import * as CloudflareUser from '@distilled.cloud/cloudflare/user'
import * as Coolify from '@distilled.cloud/coolify'
import * as CoolifyApi from '@distilled.cloud/coolify/coolify'
import * as Daytona from '@distilled.cloud/daytona'
import * as DaytonaUsers from '@distilled.cloud/daytona/users'
import * as DigitalOcean from '@distilled.cloud/digitalocean'
import * as DigitalOceanApi from '@distilled.cloud/digitalocean/digitalocean'
import * as Docker from '@distilled.cloud/docker'
import * as DockerApi from '@distilled.cloud/docker/docker'
import * as Gcp from '@distilled.cloud/gcp/Credentials'
import * as GcpProjects from '@distilled.cloud/gcp/cloudresourcemanager_v3'
import * as Hetzner from '@distilled.cloud/hetzner'
import * as HetznerLocations from '@distilled.cloud/hetzner/locations'
import * as Hostinger from '@distilled.cloud/hostinger'
import * as HostingerApi from '@distilled.cloud/hostinger/hostinger'
import * as Kubernetes from '@distilled.cloud/kubernetes'
import * as KubernetesCore from '@distilled.cloud/kubernetes/core'
import * as Ovh from '@distilled.cloud/ovh'
import * as OvhMe from '@distilled.cloud/ovh/me'
import * as Render from '@distilled.cloud/render'
import * as RenderApi from '@distilled.cloud/render/render'
import * as Stackit from '@distilled.cloud/stackit'
import * as StackitProjects from '@distilled.cloud/stackit/resource_manager'
import * as Effect from 'effect/Effect'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import { awsCheck, awsRecipe } from './aws'
import { flyCheck, flyRecipe } from './fly'
import { LOGOS } from './logos'
import { ProviderError, notAvailableYet, providerError, required, type ProviderContext, type ProviderEntry } from './types'

const secret = (value: string) => Redacted.make(value)

/** Run a Distilled call with a credentials layer, mapping failures to a safe message. */
const call = <A, E, I>(effect: Effect.Effect<A, E, I | HttpClient.HttpClient>, layer: Layer.Layer<I>, what: string): Effect.Effect<A, ProviderError, HttpClient.HttpClient> =>
  effect.pipe(Effect.provide(layer), Effect.mapError(providerError(what)))

/** Azure: the Distilled Azure SDK takes a bearer token, so mint one from the service principal (client credentials). */
const azureToken = (ctx: ProviderContext) =>
  Effect.gen(function* () {
    const tenantId = yield* required(ctx.credentials, 'tenantId')
    const clientId = yield* required(ctx.credentials, 'clientId')
    const clientSecret = yield* required(ctx.credentials, 'clientSecret')
    const client = yield* HttpClient.HttpClient
    const response = yield* client
      .execute(
        HttpClientRequest.post(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`).pipe(
          HttpClientRequest.bodyUrlParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'https://management.azure.com/.default' }),
        ),
      )
      .pipe(Effect.mapError(providerError('Microsoft sign-in failed')))
    const body = (yield* response.json.pipe(Effect.mapError(providerError('Microsoft sign-in failed')))) as { access_token?: string; error_description?: string }
    if (!body.access_token) return yield* new ProviderError({ message: `Microsoft sign-in failed: ${(body.error_description ?? 'no token').split('\r\n')[0]}` })
    return body.access_token
  })

const azureLayer = (ctx: ProviderContext) =>
  Effect.gen(function* () {
    const token = yield* azureToken(ctx)
    const subscriptionId = yield* required(ctx.credentials, 'subscriptionId')
    return Layer.succeed(Azure.Credentials, Effect.succeed({ bearerToken: secret(token), subscriptionId, tenantId: ctx.credentials.tenantId, apiBaseUrl: Azure.DEFAULT_API_BASE_URL }))
  })

export const PROVIDERS: readonly ProviderEntry[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    kind: 'cloud',
    logo: LOGOS.aws,
    blurb: 'ECS Fargate with an encrypted EFS volume, behind a load balancer with an ACM certificate.',
    connect: 'aws-role',
    fields: [
      { name: 'roleArn', label: 'Role ARN', secret: false, placeholder: 'arn:aws:iam::123456789012:role/BeagLabsPapyrusControlPlane', help: 'The RoleArn output of the BeagLabsPapyrus stack (CloudFormation → Stacks → Outputs).' },
      { name: 'region', label: 'Region', secret: false, defaultValue: 'us-east-1', help: 'Where Papyrus runs, e.g. us-east-1 or us-gov-west-1.' },
    ],
    check: awsCheck,
    recipe: awsRecipe,
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    kind: 'cloud',
    logo: LOGOS.azure,
    blurb: 'A service principal with Contributor on one subscription.',
    fields: [
      { name: 'tenantId', label: 'Tenant ID', secret: false, helpUrl: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview', help: 'Microsoft Entra ID → Overview.' },
      { name: 'clientId', label: 'Application (client) ID', secret: false, helpUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade', help: 'App registrations → your app.' },
      { name: 'clientSecret', label: 'Client secret', secret: true, help: 'App registration → Certificates & secrets.' },
      { name: 'subscriptionId', label: 'Subscription ID', secret: false, helpUrl: 'https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const layer = yield* azureLayer(ctx)
        const groups = yield* call(AzureResources.ListResourceGroups({ subscriptionId: ctx.credentials.subscriptionId! }), layer, 'Azure rejected the service principal')
        return `Azure subscription ${ctx.credentials.subscriptionId} (${groups.value?.length ?? 0} resource groups)`
      }),
    recipe: notAvailableYet('Azure'),
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    kind: 'cloud',
    logo: LOGOS.gcp,
    blurb: 'A service account key with Editor on one project.',
    fields: [
      { name: 'projectId', label: 'Project ID', secret: false },
      { name: 'serviceAccountKey', label: 'Service account key (JSON)', secret: true, multiline: true, helpUrl: 'https://console.cloud.google.com/iam-admin/serviceaccounts', help: 'IAM → Service accounts → Keys → Add key → JSON.' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const projectId = yield* required(ctx.credentials, 'projectId')
        const keyText = yield* required(ctx.credentials, 'serviceAccountKey')
        const key = yield* Effect.try({ try: () => JSON.parse(keyText) as { client_email?: string; private_key?: string; private_key_id?: string; token_uri?: string }, catch: () => new ProviderError({ message: 'The service account key is not valid JSON' }) })
        if (!key.client_email || !key.private_key) return yield* new ProviderError({ message: 'The service account key is missing client_email or private_key' })
        const layer = Gcp.fromServiceAccountKey({ clientEmail: key.client_email, privateKey: secret(key.private_key), privateKeyId: key.private_key_id, tokenUrl: key.token_uri, project: projectId })
        const project = yield* call(GcpProjects.getProjects({ name: `projects/${projectId}` }), layer, 'Google Cloud rejected the service account')
        return `Google Cloud project ${project.displayName ?? projectId}`
      }),
    recipe: notAvailableYet('Google Cloud'),
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    kind: 'cloud',
    logo: LOGOS.cloudflare,
    blurb: 'An API token for the account that will run Papyrus on Cloudflare Containers.',
    fields: [
      { name: 'apiToken', label: 'API token', secret: true, helpUrl: 'https://dash.cloudflare.com/profile/api-tokens' },
      { name: 'accountId', label: 'Account ID', secret: false, help: 'Dashboard → Workers & Pages → Account details.' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiToken = yield* required(ctx.credentials, 'apiToken')
        const result = yield* call(CloudflareUser.verifyToken({}), Cloudflare.fromApiToken({ apiToken: secret(apiToken) }), 'Cloudflare rejected the token')
        return `Cloudflare token ${result.status ?? 'active'}`
      }),
    recipe: notAvailableYet('Cloudflare'),
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    kind: 'cloud',
    logo: LOGOS.digitalocean,
    blurb: 'A personal access token with read and write scope.',
    fields: [{ name: 'apiKey', label: 'Personal access token', secret: true, helpUrl: 'https://cloud.digitalocean.com/account/api/tokens' }],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiKey = yield* required(ctx.credentials, 'apiKey')
        const result = yield* call(DigitalOceanApi.getAccount({}), DigitalOcean.fromApiKey({ apiKey: secret(apiKey) }), 'DigitalOcean rejected the token')
        return `DigitalOcean account ${result.account?.email ?? ''}`.trim()
      }),
    recipe: notAvailableYet('DigitalOcean'),
  },
  {
    id: 'hetzner',
    name: 'Hetzner Cloud',
    kind: 'cloud',
    logo: LOGOS.hetzner,
    blurb: 'A read & write API token for one project.',
    fields: [{ name: 'token', label: 'API token', secret: true, help: 'Cloud Console → your project → Security → API tokens.', helpUrl: 'https://console.hetzner.cloud/' }],
    check: (ctx) =>
      Effect.gen(function* () {
        const token = yield* required(ctx.credentials, 'token')
        const result = yield* call(HetznerLocations.listLocations({}), Hetzner.credentials({ token: secret(token) }), 'Hetzner rejected the token')
        return `Hetzner project (${result.locations?.length ?? 0} locations)`
      }),
    recipe: notAvailableYet('Hetzner'),
  },
  {
    id: 'hostinger',
    name: 'Hostinger',
    kind: 'cloud',
    logo: LOGOS.hostinger,
    blurb: 'An API token for a Hostinger VPS account.',
    fields: [{ name: 'apiKey', label: 'API token', secret: true, helpUrl: 'https://hpanel.hostinger.com/profile/api' }],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiKey = yield* required(ctx.credentials, 'apiKey')
        yield* call(HostingerApi.vPSGetDataCenterListV1({}), Hostinger.fromApiKey({ apiKey: secret(apiKey) }), 'Hostinger rejected the token')
        return 'Hostinger account'
      }),
    recipe: notAvailableYet('Hostinger'),
  },
  {
    id: 'ovh',
    name: 'OVHcloud',
    kind: 'cloud',
    logo: LOGOS.ovh,
    blurb: 'An OAuth2 access token for your OVHcloud account.',
    fields: [
      { name: 'apiKey', label: 'Access token', secret: true, helpUrl: 'https://help.ovhcloud.com/csm/en-manage-service-account', help: 'A service account access token.' },
      { name: 'endpoint', label: 'API endpoint', secret: false, defaultValue: 'https://eu.api.ovh.com/v1', help: 'eu.api.ovh.com, ca.api.ovh.com or api.us.ovhcloud.com.' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiKey = yield* required(ctx.credentials, 'apiKey')
        const me = yield* call(OvhMe.getAccountDetails({}), Ovh.fromApiKey({ apiKey: secret(apiKey), apiBaseUrl: ctx.credentials.endpoint || undefined }), 'OVHcloud rejected the token')
        return `OVHcloud account ${(me as { nichandle?: string }).nichandle ?? ''}`.trim()
      }),
    recipe: notAvailableYet('OVHcloud'),
  },
  {
    id: 'stackit',
    name: 'STACKIT',
    kind: 'cloud',
    logo: LOGOS.stackit,
    blurb: 'A service account access token with access to one project.',
    fields: [
      { name: 'token', label: 'Service account token', secret: true, helpUrl: 'https://docs.stackit.cloud/stackit/en/service-accounts-134415819.html' },
      { name: 'projectId', label: 'Project ID', secret: false },
      { name: 'region', label: 'Region', secret: false, defaultValue: 'eu01' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const token = yield* required(ctx.credentials, 'token')
        const projectId = yield* required(ctx.credentials, 'projectId')
        const project = yield* call(StackitProjects.getProject({ id: projectId }), Stackit.credentials({ token: secret(token), region: ctx.credentials.region || undefined }), 'STACKIT rejected the token')
        return `STACKIT project ${project.name ?? projectId}`
      }),
    recipe: notAvailableYet('STACKIT'),
  },
  {
    id: 'fly-io',
    name: 'Fly.io',
    kind: 'platform',
    logo: LOGOS['fly-io'],
    blurb: 'One always-on Machine with an encrypted volume; Fly terminates TLS for your hostname.',
    fields: [
      { name: 'apiKey', label: 'Org deploy token', secret: true, helpUrl: 'https://fly.io/dashboard', help: 'fly tokens create org <org> (or Dashboard → Tokens).' },
      { name: 'orgSlug', label: 'Organization slug', secret: false, defaultValue: 'personal' },
      { name: 'region', label: 'Region', secret: false, defaultValue: 'iad', help: 'Fly.io region code, e.g. iad, ord, fra.' },
    ],
    check: flyCheck,
    recipe: flyRecipe,
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    kind: 'platform',
    logo: LOGOS.kubernetes,
    blurb: 'Any conformant cluster with a default StorageClass and an ingress controller.',
    fields: [
      { name: 'apiBaseUrl', label: 'API server URL', secret: false, placeholder: 'https://k8s.example.com:6443' },
      { name: 'token', label: 'Service account token', secret: true, help: 'kubectl create token <service-account> --duration=8760h' },
      { name: 'namespace', label: 'Namespace', secret: false, defaultValue: 'papyrus' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiBaseUrl = yield* required(ctx.credentials, 'apiBaseUrl')
        const token = yield* required(ctx.credentials, 'token')
        const versions = yield* call(KubernetesCore.getCoreAPIVersions({}), Kubernetes.fromToken({ token: secret(token), apiBaseUrl }), 'The cluster rejected the token')
        return `Kubernetes cluster (${versions.versions?.join(', ') ?? 'reachable'})`
      }),
    recipe: notAvailableYet('Kubernetes'),
  },
  {
    id: 'docker',
    name: 'Docker host',
    kind: 'platform',
    logo: LOGOS.docker,
    blurb: 'A Docker Engine API reachable over HTTPS.',
    fields: [
      { name: 'apiBaseUrl', label: 'Docker Engine API URL', secret: false, placeholder: 'https://docker.example.com:2376' },
      { name: 'apiKey', label: 'Bearer token', secret: true, optional: true, help: 'If your API proxy requires one.' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiBaseUrl = yield* required(ctx.credentials, 'apiBaseUrl')
        yield* call(DockerApi.pingSystem({}), Docker.fromApiKey({ apiBaseUrl, apiKey: ctx.credentials.apiKey ? secret(ctx.credentials.apiKey) : undefined }), 'The Docker host did not answer')
        return 'Docker Engine reachable'
      }),
    recipe: notAvailableYet('Docker'),
  },
  {
    id: 'render',
    name: 'Render',
    kind: 'platform',
    logo: LOGOS.render,
    blurb: 'A private service with a persistent disk.',
    fields: [{ name: 'apiKey', label: 'API key', secret: true, helpUrl: 'https://dashboard.render.com/u/settings#api-keys' }],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiKey = yield* required(ctx.credentials, 'apiKey')
        const owners = yield* call(RenderApi.listOwners({}), Render.fromApiKey({ apiKey: secret(apiKey) }), 'Render rejected the API key')
        return `Render (${(owners as unknown[]).length} workspaces)`
      }),
    recipe: notAvailableYet('Render'),
  },
  {
    id: 'coolify',
    name: 'Coolify',
    kind: 'platform',
    logo: LOGOS.coolify,
    blurb: 'Your Coolify instance, deploying a Docker image with a persistent volume.',
    fields: [
      { name: 'apiBaseUrl', label: 'Coolify URL', secret: false, placeholder: 'https://coolify.example.com/api/v1' },
      { name: 'apiKey', label: 'API token', secret: true, help: 'Keys & Tokens → API tokens.' },
    ],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiBaseUrl = yield* required(ctx.credentials, 'apiBaseUrl')
        const apiKey = yield* required(ctx.credentials, 'apiKey')
        yield* call(CoolifyApi.listApplications({}), Coolify.fromApiKey({ apiKey: secret(apiKey), apiBaseUrl }), 'Coolify rejected the token')
        return 'Coolify instance reachable'
      }),
    recipe: notAvailableYet('Coolify'),
  },
  {
    id: 'daytona',
    name: 'Daytona',
    kind: 'platform',
    logo: LOGOS.daytona,
    blurb: 'A long-running Daytona sandbox with a volume.',
    fields: [{ name: 'apiKey', label: 'API key', secret: true, helpUrl: 'https://app.daytona.io/dashboard/keys' }],
    check: (ctx) =>
      Effect.gen(function* () {
        const apiKey = yield* required(ctx.credentials, 'apiKey')
        const user = yield* call(DaytonaUsers.getAuthenticatedUser({}), Daytona.credentials({ apiKey: secret(apiKey) }), 'Daytona rejected the API key')
        return `Daytona user ${(user as { email?: string }).email ?? ''}`.trim()
      }),
    recipe: notAvailableYet('Daytona'),
  },
]

export const providerById = (id: string | null | undefined): ProviderEntry | undefined => PROVIDERS.find((provider) => provider.id === id)

/** Keep only the fields this provider declares (trimmed). Secret fields left blank keep their saved value. */
export const credentialsFromForm = (provider: ProviderEntry, form: Record<string, string>, saved: Record<string, string> = {}) => {
  const credentials: Record<string, string> = {}
  for (const field of provider.fields) {
    const value = (form[field.name] ?? '').trim()
    if (value) credentials[field.name] = value
    else if (field.secret && saved[field.name]) credentials[field.name] = saved[field.name]!
    else if (field.defaultValue) credentials[field.name] = field.defaultValue
  }
  return credentials
}

export const missingFields = (provider: ProviderEntry, credentials: Record<string, string>) =>
  provider.fields.filter((field) => !field.optional && !credentials[field.name]).map((field) => field.label)
