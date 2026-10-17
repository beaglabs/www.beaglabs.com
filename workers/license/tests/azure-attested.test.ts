import { describe, expect, it } from 'vitest'
import fixture from './fixtures/attested.json'
import { parseCertificate, parseImdsTimestamp, verifyAttestedSignature } from '../src/azure-attested'
import { AZURE_ROOT_CERTIFICATES } from '../src/azure-roots'
import { base64Decode, sha256Hex } from '../src/util'

const NOW = new Date(fixture.verifyAt)
const root = base64Decode(fixture.root)
const intermediate = base64Decode(fixture.intermediate)
const AIA_URL = 'http://www.microsoft.com/pkiops/certs/Test%20Azure%20Issuing%20CA.crt'

function options(overrides: Partial<Parameters<typeof verifyAttestedSignature>[1]> = {}) {
  const fetched: string[] = []
  return {
    fetched,
    opts: {
      expectedNonce: fixture.nonce,
      now: NOW,
      trustedRoots: [root],
      fetchCertificate: async (url: string) => { fetched.push(url); return intermediate },
      ...overrides,
    },
  }
}

describe('verifyAttestedSignature', () => {
  it('accepts a valid signature, fetching the intermediate from the signer AIA URL', async () => {
    const { fetched, opts } = options()
    const result = await verifyAttestedSignature(fixture.signature, opts)
    expect(result.document.vmId).toBe('02aab8a4-74ef-476e-8182-f6d2ba4166a6')
    expect(result.document.subscriptionId).toBe('8d10da13-8125-4ba9-a717-bf7490507b3d')
    expect(result.document.plan).toEqual({ name: 'papyrus-standard', product: 'papyrus', publisher: 'beaglabs' })
    expect(result.chain).toEqual(['metadata.azure.com', 'Test Azure Issuing CA', 'Test Azure Root'])
    expect(fetched).toEqual([AIA_URL])
  })

  it('rejects a nonce mismatch', async () => {
    await expect(verifyAttestedSignature(fixture.signature, options({ expectedNonce: '0000000000' }).opts)).rejects.toMatchObject({ code: 'nonce_mismatch' })
  })

  it('rejects an expired document', async () => {
    await expect(verifyAttestedSignature(fixture.signature, options({ now: new Date(fixture.expiredAt) }).opts)).rejects.toMatchObject({ code: 'attestation_expired' })
  })

  it('rejects a chain that does not reach a trusted root', async () => {
    await expect(verifyAttestedSignature(fixture.signature, options({ trustedRoots: [base64Decode(fixture.untrustedRoot)] }).opts)).rejects.toMatchObject({ code: 'attestation_invalid' })
  })

  it('rejects when the intermediate cannot be obtained', async () => {
    await expect(verifyAttestedSignature(fixture.signature, options({ fetchCertificate: async () => { throw new Error('offline') } }).opts)).rejects.toMatchObject({ code: 'attestation_invalid' })
  })

  it('rejects a tampered document', async () => {
    const der = base64Decode(fixture.signature)
    const text = new TextDecoder('latin1').decode(der)
    const at = text.indexOf('papyrus-standard')
    der[at] = 'P'.charCodeAt(0)
    let binary = ''
    for (const byte of der) binary += String.fromCharCode(byte)
    await expect(verifyAttestedSignature(btoa(binary), options().opts)).rejects.toMatchObject({ code: 'attestation_invalid' })
  })

  it('rejects a signer outside metadata.azure.com', async () => {
    await expect(verifyAttestedSignature(fixture.signature, options({ signerDomain: 'metadata.azure.us' }).opts)).rejects.toMatchObject({ code: 'attestation_invalid' })
  })

  it('rejects garbage', async () => {
    await expect(verifyAttestedSignature(btoa('x'.repeat(200)), options().opts)).rejects.toMatchObject({ status: 401 })
  })
})

describe('embedded Azure roots', () => {
  it('parse and match their pinned SHA-256 fingerprints', async () => {
    for (const entry of AZURE_ROOT_CERTIFICATES) {
      const der = base64Decode(entry.der)
      expect(await sha256Hex(der)).toBe(entry.sha256)
      const cert = parseCertificate(der)
      expect(cert.subjectCommonName).toBe(entry.name)
      expect(cert.isCa).toBe(true)
    }
  })
})

it('parses IMDS timestamps', () => {
  expect(parseImdsTimestamp('11/30/20 21:19:24 -0000')?.toISOString()).toBe('2020-11-30T21:19:24.000Z')
  expect(parseImdsTimestamp('nope')).toBeNull()
})
