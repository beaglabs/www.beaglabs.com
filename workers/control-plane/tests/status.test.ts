import { describe, expect, it } from 'vitest'
import { harness } from './helpers/harness'

const statusCall = (h: ReturnType<typeof harness>, headers: Record<string, string>) => h.call('/api/deployments/status', { headers })

describe('GET /api/deployments/status', () => {
  it('401 without a key, with a bad key, or for an unknown deployment', async () => {
    const h = harness()
    h.insertAccount()
    h.insertDeployment({ id: 'dep_1', license_deployment_id: 'pd_123', billing_state: 'active' })
    expect((await statusCall(h, {})).status).toBe(401)
    expect((await statusCall(h, { 'x-papyrus-deployment-id': 'pd_123' })).status).toBe(401)
    expect((await statusCall(h, { authorization: 'Bearer wrong', 'x-papyrus-deployment-id': 'pd_123' })).status).toBe(401)
    expect((await statusCall(h, { authorization: 'Bearer good-key', 'x-papyrus-deployment-id': 'pd_other' })).status).toBe(401)
    expect(h.license.signStatus).not.toHaveBeenCalled()
  })

  it('passes through the license Worker signed status with state active while billing is active', async () => {
    const h = harness()
    h.insertAccount()
    h.insertDeployment({ id: 'dep_1', license_deployment_id: 'pd_123', billing_state: 'active' })
    const response = await statusCall(h, { authorization: 'Bearer good-key', 'x-papyrus-deployment-id': 'pd_123' })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      payload: { deploymentId: 'pd_123', state: 'active', issuedAt: '2026-10-17T00:00:00.000Z', expiresAt: '2026-10-24T00:00:00.000Z' },
      keyId: 'beag-kv-1',
      signature: 'signed:pd_123:active',
    })
    expect(h.license.verifyDeploymentKey).toHaveBeenCalledWith('pd_123', 'good-key')
    expect(h.license.signStatus).toHaveBeenCalledWith({ deploymentId: 'pd_123', state: 'active' })
  })

  it('signs suspended when billing lapsed or never started', async () => {
    for (const billing of ['suspended', 'none']) {
      const h = harness()
      h.insertAccount()
      h.insertDeployment({ id: 'dep_1', license_deployment_id: 'pd_123', billing_state: billing })
      const body = (await (await statusCall(h, { authorization: 'Bearer good-key', 'x-papyrus-deployment-id': 'pd_123' })).json()) as { payload: { state: string } }
      expect(body.payload.state).toBe('suspended')
    }
  })

  it('404 (not a suspension) for a valid key that is not a control-plane deployment', async () => {
    const h = harness()
    const response = await statusCall(h, { authorization: 'Bearer good-key', 'x-papyrus-deployment-id': 'pd_123' })
    expect(response.status).toBe(404)
    expect(h.license.signStatus).not.toHaveBeenCalled()
  })
})
