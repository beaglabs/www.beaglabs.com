import * as Effect from 'effect/Effect'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import { describe, expect, it } from 'vitest'
import { quickCreateUrl } from '../src/providers/aws'
import { PROVIDERS, credentialsFromForm, missingFields, providerById } from '../src/providers/registry'
import { credentialForm } from '../src/views'

const DESIGN_LIST = ['aws', 'azure', 'gcp', 'cloudflare', 'digitalocean', 'hetzner', 'hostinger', 'ovh', 'stackit', 'kubernetes', 'docker', 'fly-io', 'render', 'coolify', 'daytona']

describe('provider registry', () => {
  it('lists the Distilled clouds and container platforms from the design, once each, with logos', () => {
    expect(PROVIDERS.map((p) => p.id).sort()).toEqual([...DESIGN_LIST].sort())
    for (const provider of PROVIDERS) {
      expect(provider.logo).toMatch(/^<svg[\s\S]*<\/svg>$/)
      expect(provider.fields.length).toBeGreaterThan(0)
      expect(new Set(provider.fields.map((f) => f.name)).size).toBe(provider.fields.length)
    }
  })

  it('renders the credential form from the entry: labels, secret inputs, help links', () => {
    const digitalocean = credentialForm(providerById('digitalocean')!)
    expect(digitalocean).toContain('name="apiKey"')
    expect(digitalocean).toContain('type="password"')
    expect(digitalocean).toContain('Personal access token')
    expect(digitalocean).toContain('https://cloud.digitalocean.com/account/api/tokens')

    const fly = credentialForm(providerById('fly-io')!)
    for (const name of ['apiKey', 'orgSlug', 'region']) expect(fly).toContain(`name="${name}"`)
    expect(fly).toMatch(/name="region"[^>]*type="text" value="iad"/)

    const gcp = credentialForm(providerById('gcp')!)
    expect(gcp).toMatch(/<textarea id="f_serviceAccountKey" name="serviceAccountKey" required/)

    const aws = credentialForm(providerById('aws')!)
    expect(aws).toContain('name="roleArn"')
    expect(aws).not.toContain('type="password"')
    expect(providerById('aws')!.connect).toBe('aws-role')
  })

  it('keeps a saved secret when its field is left blank, and never pre-fills secrets', () => {
    const provider = providerById('fly-io')!
    const html = credentialForm(provider, { apiKey: true })
    expect(html).toContain('Saved — leave blank to keep')
    expect(html).not.toMatch(/name="apiKey" required/)
    const credentials = credentialsFromForm(provider, { apiKey: '', orgSlug: ' acme ', region: '', junk: 'x' }, { apiKey: 'fo1_saved' })
    expect(credentials).toEqual({ apiKey: 'fo1_saved', orgSlug: 'acme', region: 'iad' })
    expect(missingFields(provider, {})).toEqual(['Org deploy token', 'Organization slug', 'Region'])
    expect(missingFields(providerById('docker')!, { apiBaseUrl: 'https://d' })).toEqual([])
  })

  it('providers without a recipe fail the deploy step with a clear "not available yet"', async () => {
    const result = await Effect.runPromise(
      providerById('hetzner')!.recipe.deploy({} as never).pipe(Effect.provide(FetchHttpClient.layer)),
    )
    expect(result.status).toBe('fail')
    expect(result.reason).toMatch(/not available yet/)
  })

  it('builds the Connect AWS quick-create link with the customer ExternalId', () => {
    const url = new URL(quickCreateUrl({ templateUrl: 'https://b.s3.amazonaws.com/t.yaml', externalId: 'beag-xyz', principalArn: 'arn:aws:iam::111111111111:user/cp' }))
    expect(url.hostname).toBe('us-east-1.console.aws.amazon.com')
    const params = new URLSearchParams(url.hash.split('?')[1])
    expect(params.get('param_ExternalId')).toBe('beag-xyz')
    expect(params.get('templateURL')).toBe('https://b.s3.amazonaws.com/t.yaml')
    expect(params.get('param_BeagLabsPrincipal')).toBe('arn:aws:iam::111111111111:user/cp')
  })
})
