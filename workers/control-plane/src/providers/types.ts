import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import type * as HttpClient from 'effect/http/HttpClient'
import type { DnsRecord } from '../dns'

/** One input on the generated credential form. */
export interface CredentialField {
  name: string
  label: string
  /** Rendered as a password/secret input and never echoed back. */
  secret: boolean
  /** "Where to find this". */
  help?: string
  helpUrl?: string
  placeholder?: string
  optional?: boolean
  multiline?: boolean
  defaultValue?: string
}

export type ProviderCredentials = Record<string, string>

/** A provider call failed. The message is safe to show the customer and never contains a credential. */
export class ProviderError extends Data.TaggedError('ProviderError')<{ message: string }> {}

/** Beag Labs' own AWS principal, used only to assume customer roles. */
export interface AwsBase {
  accessKeyId: string
  secretAccessKey: string
  principalArn: string
}

export interface ProviderContext {
  credentials: ProviderCredentials
  /** Per-customer ExternalId for roles the customer creates for Beag Labs (AWS). */
  externalId: string | null
  aws: AwsBase
}

export interface DeployContext extends ProviderContext {
  /** Control-plane deployment id (used for resource names). */
  deploymentId: string
  /** papyrus_deployments.id from the license Worker. */
  licenseDeploymentId: string
  hostname: string
  /** `ghcr.io/beaglabs/papyrus/papyrus@sha256:…` */
  image: string
  /** Plain container environment from the contract. */
  env: Record<string, string>
  /** Secret container environment: PAPYRUS_BOOTSTRAP_TOKEN, PAPYRUS_LICENSE. */
  secretEnv: Record<string, string>
  /** Path the read-only 32-byte master key is mounted at (also in env as PAPYRUS_SECRET_KEY_FILE). */
  secretKeyPath: string
  /**
   * Resource ids created so far. Recipes mutate this as they go; the caller saves it whatever the outcome, so a
   * retried deploy picks up where it stopped instead of creating duplicates.
   */
  resources: Record<string, unknown>
}

export interface DeployResult {
  /** `pending` = progressing, retry later (reason says what is being waited for). */
  status: 'pass' | 'pending' | 'fail'
  reason?: string
  dnsRecords: DnsRecord[]
}

export type ProviderEffect<A> = Effect.Effect<A, ProviderError, HttpClient.HttpClient>

export interface DeployRecipe {
  /** Create or update everything up to (not including) the customer's DNS. Idempotent. */
  deploy(ctx: DeployContext): ProviderEffect<DeployResult>
  /** Optional: runs after the DNS records verify (e.g. attach the issued certificate, start the service). */
  afterDns?(ctx: DeployContext): ProviderEffect<DeployResult>
}

export interface ProviderEntry {
  id: string
  name: string
  kind: 'cloud' | 'platform'
  /** Inline SVG. */
  logo: string
  /** Shown under the provider name on the form. */
  blurb: string
  /** `aws-role`: the form shows the one-click Connect AWS button and asks for the role ARN it creates. */
  connect?: 'aws-role'
  fields: CredentialField[]
  /** Cheap read-only call proving the credentials work. Returns a short description (e.g. the account name). */
  check(ctx: ProviderContext): ProviderEffect<string>
  recipe: DeployRecipe
}

/** Map any provider/SDK failure to a ProviderError with a message that is safe to show. */
export const providerError =
  (what: string) =>
  (cause: unknown): ProviderError => {
    if (cause instanceof ProviderError) return cause
    const tagged = cause as { _tag?: string; message?: string } | undefined
    const detail = tagged?.message && tagged.message.length < 400 ? tagged.message : tagged?._tag ?? 'request failed'
    return new ProviderError({ message: `${what}: ${detail}` })
  }

/** Deploy recipe for providers whose recipe is not built yet: a clear step failure. */
export const notAvailableYet = (name: string): DeployRecipe => ({
  deploy: () =>
    Effect.succeed({
      status: 'fail',
      reason: `Deploying to ${name} is not available yet. Your credentials are saved and verified; choose AWS or Fly.io to deploy now, or contact Beag Labs.`,
      dnsRecords: [],
    }),
})

export const required = (credentials: ProviderCredentials, name: string) =>
  credentials[name]?.trim() ? Effect.succeed(credentials[name]!.trim()) : Effect.fail(new ProviderError({ message: `${name} is required` }))
