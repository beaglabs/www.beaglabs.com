import * as Fly from '@distilled.cloud/fly-io'
import * as Machines from '@distilled.cloud/fly-io/machines'
import * as Effect from 'effect/Effect'
import * as Redacted from 'effect/Redacted'
import { randomBytes, toBase64 } from '../crypto'
import { ProviderError, providerError, required, type DeployContext, type DeployRecipe, type ProviderContext, type DeployResult } from './types'

/**
 * Fly.io recipe: one app, one encrypted volume at /var/lib/papyrus, one always-on Machine running the signed image as
 * its non-root user. Fly terminates TLS (ACME certificate for the customer's hostname) and forwards to :3210.
 *
 * Secrets are Fly app secrets. The 32-byte master key is the base64 app secret PAPYRUS_MASTER_KEY_B64, written by Fly
 * as a raw file at the key path (mode 0444; the container's filesystem view of it is read-only to the app).
 */

const MASTER_KEY_SECRET = 'PAPYRUS_MASTER_KEY_B64'
const VOLUME_NAME = 'papyrus_data'
const PORT = 3210

const layer = (credentials: ProviderContext['credentials']) =>
  Effect.gen(function* () {
    const apiKey = yield* required(credentials, 'apiKey')
    return Fly.credentials({ apiKey: Redacted.make(apiKey) })
  })

export const appNameFor = (deploymentId: string) => `papyrus-${deploymentId.replace(/^dep_/, '').toLowerCase().slice(0, 20)}`

export const flyCheck = (ctx: ProviderContext) =>
  Effect.gen(function* () {
    const orgSlug = yield* required(ctx.credentials, 'orgSlug')
    const credentials = yield* layer(ctx.credentials)
    const apps = yield* Machines.listApps({ org_slug: orgSlug, limit: 1 }).pipe(Effect.provide(credentials), Effect.mapError(providerError('Fly.io rejected the token')))
    return `Fly.io organization ${orgSlug} (${apps.total_apps ?? apps.apps?.length ?? 0} apps)`
  })

const machineConfig = (ctx: DeployContext, volumeId: string): Machines.FlyMachineConfig => ({
  image: ctx.image,
  env: ctx.env,
  guest: { cpu_kind: 'shared', cpus: 2, memory_mb: 4096 },
  mounts: [{ volume: volumeId, path: '/var/lib/papyrus' }],
  files: [{ guest_path: ctx.secretKeyPath, secret_name: MASTER_KEY_SECRET, mode: 0o444 }],
  restart: { policy: 'always' },
  services: [
    {
      protocol: 'tcp',
      internal_port: PORT,
      autostart: true,
      autostop: 'off',
      min_machines_running: 1,
      ports: [
        { port: 443, handlers: ['tls', 'http'] },
        { port: 80, handlers: ['http'], force_https: true },
      ],
    },
  ],
  metadata: { 'beaglabs-deployment': ctx.licenseDeploymentId },
})

const deploy = (ctx: DeployContext) =>
  Effect.gen(function* () {
    const credentials = yield* layer(ctx.credentials)
    const orgSlug = yield* required(ctx.credentials, 'orgSlug')
    const region = ctx.credentials.region?.trim() || 'iad'
    const appName = (ctx.resources.flyApp as string | undefined) ?? appNameFor(ctx.deploymentId)

    const program = Effect.gen(function* () {
      if (!ctx.resources.flyApp) {
        yield* Machines.createApp({ name: appName, org_slug: orgSlug, idempotency_key: ctx.deploymentId }).pipe(
          Effect.catch(() => Machines.getApp({ app_name: appName })),
          Effect.mapError(providerError('Creating the Fly.io app failed')),
        )
        ctx.resources.flyApp = appName
      }

      // App secrets: the master key is generated once and only ever lives in Fly's secret store.
      const values: Record<string, string> = { ...ctx.secretEnv }
      if (!ctx.resources.masterKeySet) values[MASTER_KEY_SECRET] = toBase64(randomBytes(32))
      yield* Machines.updateSecrets({ app_name: appName, values }).pipe(Effect.mapError(providerError('Setting Fly.io secrets failed')))
      ctx.resources.masterKeySet = true

      let volumeId = ctx.resources.flyVolume as string | undefined
      if (!volumeId) {
        const existing = yield* Machines.listVolumes({ app_name: appName }).pipe(Effect.mapError(providerError('Listing Fly.io volumes failed')))
        volumeId = existing.find((volume) => volume.name === VOLUME_NAME && volume.state !== 'destroyed')?.id
        if (!volumeId) {
          const created = yield* Machines.createVolume({ app_name: appName, name: VOLUME_NAME, region, size_gb: 20, encrypted: true }).pipe(
            Effect.mapError(providerError('Creating the Fly.io volume failed')),
          )
          volumeId = created.id
        }
        if (!volumeId) return yield* new ProviderError({ message: 'Fly.io did not return a volume id' })
        ctx.resources.flyVolume = volumeId
      }

      if (!ctx.resources.flyIps) {
        yield* Machines.createAppIPAssignment({ app_name: appName, type: 'shared_v4' }).pipe(Effect.ignore)
        yield* Machines.createAppIPAssignment({ app_name: appName, type: 'v6' }).pipe(Effect.ignore)
        ctx.resources.flyIps = true
      }

      const config = machineConfig(ctx, volumeId)
      const machineId = ctx.resources.flyMachine as string | undefined
      if (machineId) {
        yield* Machines.updateMachine({ app_name: appName, machine_id: machineId, config }).pipe(Effect.mapError(providerError('Updating the Fly.io machine failed')))
      } else {
        const machine = yield* Machines.createMachine({ app_name: appName, region, name: 'papyrus', config }).pipe(
          Effect.mapError(providerError('Creating the Fly.io machine failed')),
        )
        if (!machine.id) return yield* new ProviderError({ message: 'Fly.io did not return a machine id' })
        ctx.resources.flyMachine = machine.id
      }

      if (ctx.resources.flyCertificate !== ctx.hostname) {
        yield* Machines.createAppAcmeCertificate({ app_name: appName, hostname: ctx.hostname }).pipe(Effect.mapError(providerError('Requesting the Fly.io certificate failed')))
        ctx.resources.flyCertificate = ctx.hostname
      }

      return {
        status: 'pass',
        dnsRecords: [{ type: 'CNAME', name: ctx.hostname, value: `${appName}.fly.dev`, purpose: 'Points your hostname at Papyrus on Fly.io' }],
      } satisfies DeployResult
    })
    return yield* program.pipe(Effect.provide(credentials))
  })

export const flyRecipe: DeployRecipe = { deploy }
