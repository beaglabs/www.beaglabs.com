// Issue a signed Papyrus offline license with the Azure Key Vault signer.
//
//   npm run license:issue -- --help
//
// Produces the same signed document the retired admin API returned
// (`document`), so existing Papyrus license verification is unchanged.
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { signLicenseWithAzureKeyVault } from '../src/azure-key-vault-signer.ts'
import {
  CLASSIFICATION_BANNER_FEATURE,
  isClassificationLevel,
  isDeploymentProfile,
  type Bindings,
  type DeploymentProfile,
} from '../src/env.ts'
import { payloadSha256, type LicensePayload } from '../src/license.ts'

// Mirrors the product seeds in schema.sql.
const SKUS: Record<string, { features: string[]; profiles: DeploymentProfile[]; days: number }> = {
  'PAP-FED-PILOT-90': { features: ['core', 'teams', 'email', 'security-connectors', 'action-executors', 'agent-peers'], profiles: ['disconnected'], days: 90 },
  'PAP-FED-ENT-1Y': { features: ['core', 'teams', 'email', 'security-connectors', 'action-executors', 'agent-peers'], profiles: ['commercial', 'government'], days: 365 },
  'PAP-FED-DISC-1Y': { features: ['core', 'email', 'security-connectors', 'action-executors', 'agent-peers'], profiles: ['disconnected'], days: 365 },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HOSTNAME = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/

const USAGE = `Issue a signed Papyrus offline license.

Usage:
  npm run license:issue -- --scope organization --licensee "Acme County" \\
    --sku PAP-FED-PILOT-90 --tenant <entra-tenant-uuid> --domain acme.gov --out acme.license.json

  npm run license:issue -- --scope deployment --licensee "Acme County" \\
    --deployment-id <papyrus-deployment-id> --sku PAP-FED-DISC-1Y --profile disconnected

Required:
  --scope <organization|deployment>
  --licensee <name>              Organization name shown in Papyrus

Entitlement (use --sku, or --features with --profile):
  --sku <sku>                    ${Object.keys(SKUS).join(', ')}
  --features <a,b,c>             Overrides the SKU feature list
  --profile <p>                  commercial | government | disconnected (repeatable or comma-separated)
  --classification <level>       Adds the classification banner feature:
                                 unclassified, cui, confidential, secret, top-secret, top-secret-sci
  --expires <date>               ISO date/time; defaults to the SKU term from today
  --days <n>                     Term length from today instead of --expires

Organization scope:
  --tenant <uuid>                Allowed Microsoft Entra tenant ID (repeatable, at least one)
  --domain <hostname>            Allowed exact email domain (repeatable, optional)
  --organization-id <id>         Defaults to a new org_<uuid>
  --entitlement-id <id>          Defaults to a new ent_<uuid>

Deployment scope:
  --deployment-id <id>           Papyrus deployment ID from the appliance
  --logo-url <https-url>         Optional Entra app registration logo
  --perpetual                    No expiry (deployment scope only)

Output:
  --out <file>                   Write the signed license JSON here (default: stdout)
  --dry-run                      Print the unsigned payload; do not call Key Vault

Signing reads AZURE_KEY_VAULT_TENANT_ID, AZURE_KEY_VAULT_CLIENT_ID,
AZURE_KEY_VAULT_CLIENT_SECRET and AZURE_KEY_VAULT_KEY_ID from the environment
(.dev.vars is loaded automatically by the npm script).`

function fail(message: string): never {
  console.error(`error: ${message}\n\nRun with --help for usage.`)
  process.exit(1)
}

function list(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean))]
}

const { values } = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h' },
    scope: { type: 'string' },
    licensee: { type: 'string' },
    sku: { type: 'string' },
    features: { type: 'string' },
    profile: { type: 'string', multiple: true },
    classification: { type: 'string' },
    expires: { type: 'string' },
    days: { type: 'string' },
    perpetual: { type: 'boolean' },
    tenant: { type: 'string', multiple: true },
    domain: { type: 'string', multiple: true },
    'organization-id': { type: 'string' },
    'entitlement-id': { type: 'string' },
    'deployment-id': { type: 'string' },
    'logo-url': { type: 'string' },
    out: { type: 'string' },
    'dry-run': { type: 'boolean' },
  },
  strict: true,
})

if (values.help) {
  console.log(USAGE)
  process.exit(0)
}

const scope = values.scope
if (scope !== 'organization' && scope !== 'deployment') fail('--scope must be organization or deployment')
const licensee = values.licensee?.trim()
if (!licensee) fail('--licensee is required')

const sku = values.sku ? SKUS[values.sku.toUpperCase()] : undefined
if (values.sku && !sku) fail(`unknown --sku ${values.sku}`)

const features = values.features ? list([values.features]) : [...(sku?.features ?? [])]
if (!features.length) fail('provide --sku or --features')
if (values.classification) {
  const level = values.classification.trim().toLowerCase()
  if (!isClassificationLevel(level)) fail(`invalid --classification ${values.classification}`)
  features.push(CLASSIFICATION_BANNER_FEATURE, `classification:${level}`)
}

const profileInput = list(values.profile)
const profiles = profileInput.length ? profileInput : [...(sku?.profiles ?? [])]
if (!profiles.length) fail('provide --sku or --profile')
const invalidProfile = profiles.find((profile) => !isDeploymentProfile(profile))
if (invalidProfile) fail(`invalid --profile ${invalidProfile}`)

let expiresAt: string | null
if (values.perpetual) {
  if (scope !== 'deployment') fail('--perpetual is only allowed for deployment scope')
  if (values.expires || values.days) fail('--perpetual cannot be combined with --expires or --days')
  expiresAt = null
} else if (values.expires) {
  const parsed = Date.parse(values.expires)
  if (!Number.isFinite(parsed)) fail(`invalid --expires ${values.expires}`)
  expiresAt = new Date(parsed).toISOString()
} else {
  const days = values.days ? Number(values.days) : sku?.days
  if (!days || !Number.isInteger(days) || days <= 0) fail('provide --expires, --days, --sku or --perpetual')
  expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}
if (expiresAt && Date.parse(expiresAt) <= Date.now()) fail('expiry must be in the future')

const base = {
  licenseId: `lic_${randomUUID()}`,
  licensee,
  profiles: profiles as DeploymentProfile[],
  features: [...new Set(features)],
  issuedAt: new Date().toISOString(),
}

let payload: LicensePayload
if (scope === 'organization') {
  const tenants = list(values.tenant).map((tenant) => tenant.toLowerCase())
  if (!tenants.length) fail('organization scope needs at least one --tenant')
  if (tenants.length > 64) fail('at most 64 --tenant values')
  const badTenant = tenants.find((tenant) => !UUID.test(tenant))
  if (badTenant) fail(`--tenant must be a UUID: ${badTenant}`)
  const domains = list(values.domain).map((domain) => domain.toLowerCase())
  if (domains.length > 64) fail('at most 64 --domain values')
  const badDomain = domains.find((domain) => !HOSTNAME.test(domain))
  if (badDomain) fail(`--domain must be an exact hostname (no wildcards): ${badDomain}`)
  if (values['deployment-id'] || values['logo-url']) fail('--deployment-id and --logo-url are for deployment scope')
  payload = {
    ...base,
    scope: 'organization',
    organizationId: values['organization-id']?.trim() || `org_${randomUUID()}`,
    entitlementId: values['entitlement-id']?.trim() || `ent_${randomUUID()}`,
    allowedTenantIds: tenants,
    ...(domains.length ? { allowedDomains: domains } : {}),
    expiresAt: expiresAt as string,
  }
} else {
  const deploymentId = values['deployment-id']?.trim()
  if (!deploymentId) fail('deployment scope needs --deployment-id')
  if (values.tenant || values.domain) fail('--tenant and --domain are for organization scope')
  let logoUrl: string | undefined
  if (values['logo-url']) {
    let parsed: URL
    try { parsed = new URL(values['logo-url'].trim()) } catch { fail('--logo-url must be a valid URL') }
    if (parsed.protocol !== 'https:') fail('--logo-url must use HTTPS')
    logoUrl = parsed.toString()
  }
  payload = {
    ...base,
    deploymentId,
    expiresAt,
    ...(logoUrl ? { branding: { entraAppLogoUrl: logoUrl } } : {}),
  }
}

if (values['dry-run']) {
  console.log(JSON.stringify(payload, null, 2))
  process.exit(0)
}

const signed = await signLicenseWithAzureKeyVault(process.env as unknown as Bindings, payload)
const output = `${JSON.stringify(signed, null, 2)}\n`
if (values.out) {
  writeFileSync(values.out, output, { mode: 0o600 })
  console.error(`Signed ${signed.licenseId} for ${licensee} (sha256 ${payloadSha256(payload)}) -> ${values.out}`)
} else {
  process.stdout.write(output)
}
