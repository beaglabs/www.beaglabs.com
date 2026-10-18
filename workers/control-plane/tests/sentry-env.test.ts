import { describe, expect, it } from 'vitest'
import { containerEnv } from '../src/runner'

const base = { controlPlaneUrl: 'https://papyrus.beaglabs.com', deploymentId: 'pd_1', hostname: 'acme.papyrus.beaglabs.com', authorities: { k: 'pem' } }

describe('Sentry in the container environment', () => {
  it('passes the Sentry settings set on the control plane to every deployment', () => {
    const env = containerEnv({ ...base, sentry: { PAPYRUS_SENTRY_DSN: ' https://k@o1.ingest.sentry.io/1 ', PAPYRUS_WEB_SENTRY_DSN: 'https://w@o1.ingest.sentry.io/2', PAPYRUS_SENTRY_ENVIRONMENT: 'production' } })
    expect(env).toMatchObject({
      PAPYRUS_SENTRY_DSN: 'https://k@o1.ingest.sentry.io/1',
      PAPYRUS_WEB_SENTRY_DSN: 'https://w@o1.ingest.sentry.io/2',
      PAPYRUS_SENTRY_ENVIRONMENT: 'production',
      PAPYRUS_DEPLOYMENT_ID: 'pd_1',
    })
  })

  it('leaves out unset or blank ones, so Papyrus keeps its own defaults', () => {
    const env = containerEnv({ ...base, sentry: { PAPYRUS_SENTRY_DSN: 'https://k@o1.ingest.sentry.io/1', PAPYRUS_WEB_SENTRY_DSN: '  ' } })
    expect(env).toHaveProperty('PAPYRUS_SENTRY_DSN')
    expect(env).not.toHaveProperty('PAPYRUS_WEB_SENTRY_DSN')
    expect(env).not.toHaveProperty('PAPYRUS_SENTRY_ENVIRONMENT')
    expect(Object.keys(containerEnv(base)).filter((name) => name.includes('SENTRY'))).toEqual([])
  })
})
