/**
 * Azure IMDS attested-data verification (PKCS#7 / CMS SignedData), WebCrypto only.
 *
 * GET http://169.254.169.254/metadata/attested/document?api-version=...&nonce=...
 * returns { encoding: "pkcs7", signature: "<base64 CMS SignedData>" }. The signed
 * content is a JSON document: { nonce, plan: { name, product, publisher }, sku,
 * subscriptionId, timeStamp: { createdOn, expiresOn }, vmId, licenseType? }.
 *
 * Microsoft's guidance (learn.microsoft.com/azure/virtual-machines/instance-metadata-service#attested-data):
 * - the signer certificate's SAN is <region>.metadata.azure.com / metadata.azure.com, so
 *   accept metadata.azure.com and any subdomain of it;
 * - the intermediate may not be embedded; fetch it from the signer's AIA "CA Issuers" URL;
 * - don't pin intermediates; validate up to the Azure root CAs
 *   (learn.microsoft.com/azure/security/fundamentals/azure-ca-details).
 *
 * This module is a deliberately small DER/CMS reader: it supports exactly what
 * the IMDS signature uses (RSA or ECDSA, SHA-1/256/384/512, optional signed attributes,
 * definite or BER indefinite lengths) and nothing else.
 */
import { AZURE_ROOT_CERTIFICATES } from './azure-roots'
import { ApiError, base64Decode, bs } from './util'

export type AttestedDocument = {
  nonce?: string
  plan?: { name?: string; product?: string; publisher?: string }
  sku?: string
  subscriptionId?: string
  vmId?: string
  licenseType?: string
  timeStamp?: { createdOn?: string; expiresOn?: string }
  [key: string]: unknown
}

export type VerifyAttestedOptions = {
  expectedNonce: string
  now?: Date
  /** DER root certificates; defaults to the embedded Azure roots. */
  trustedRoots?: readonly Uint8Array[]
  /** Fetches an intermediate from an AIA URL; defaults to an allowlisted fetch. */
  fetchCertificate?: (url: string) => Promise<Uint8Array>
  /** Signer hostname suffix; default metadata.azure.com (commercial Azure only). */
  signerDomain?: string
}

export type VerifiedAttestation = {
  document: AttestedDocument
  signerSubject: string
  chain: string[]
}

function fail(message: string): never {
  throw new ApiError(401, 'attestation_invalid', message)
}

// ---------------------------------------------------------------------------
// DER / BER reader

export type Tlv = {
  tag: number
  constructed: boolean
  /** Offsets into the shared buffer. */
  start: number
  valueStart: number
  valueEnd: number
  end: number
  bytes: Uint8Array
}

export function readTlv(bytes: Uint8Array, offset = 0): Tlv {
  if (offset + 2 > bytes.length) fail('Truncated ASN.1 structure.')
  const tag = bytes[offset]
  if ((tag & 0x1f) === 0x1f) fail('High-tag-number ASN.1 form is not supported.')
  const constructed = (tag & 0x20) !== 0
  let cursor = offset + 1
  const first = bytes[cursor++]
  let length: number
  let indefinite = false
  if (first < 0x80) {
    length = first
  } else if (first === 0x80) {
    if (!constructed) fail('Indefinite length on a primitive ASN.1 value.')
    indefinite = true
    length = 0
  } else {
    const count = first & 0x7f
    if (count > 4 || cursor + count > bytes.length) fail('ASN.1 length is too large.')
    length = 0
    for (let i = 0; i < count; i += 1) length = length * 256 + bytes[cursor++]
  }
  const valueStart = cursor
  if (!indefinite) {
    const valueEnd = valueStart + length
    if (valueEnd > bytes.length) fail('Truncated ASN.1 value.')
    return { tag, constructed, start: offset, valueStart, valueEnd, end: valueEnd, bytes }
  }
  let inner = valueStart
  for (;;) {
    if (inner + 2 > bytes.length) fail('Unterminated indefinite-length ASN.1 value.')
    if (bytes[inner] === 0 && bytes[inner + 1] === 0) {
      return { tag, constructed, start: offset, valueStart, valueEnd: inner, end: inner + 2, bytes }
    }
    inner = readTlv(bytes, inner).end
  }
}

export function children(node: Tlv): Tlv[] {
  const result: Tlv[] = []
  let cursor = node.valueStart
  while (cursor < node.valueEnd) {
    const child = readTlv(node.bytes, cursor)
    result.push(child)
    cursor = child.end
  }
  return result
}

const value = (node: Tlv) => node.bytes.subarray(node.valueStart, node.valueEnd)
const raw = (node: Tlv) => node.bytes.subarray(node.start, node.end)

function expectTag(node: Tlv | undefined, tag: number, what: string): Tlv {
  if (!node || node.tag !== tag) fail(`Unexpected ASN.1 structure at ${what}.`)
  return node
}

export function decodeOid(bytes: Uint8Array): string {
  const parts: number[] = []
  let current = 0
  for (const byte of bytes) {
    current = current * 128 + (byte & 0x7f)
    if ((byte & 0x80) === 0) {
      if (parts.length === 0) {
        const firstArc = current < 40 ? 0 : current < 80 ? 1 : 2
        parts.push(firstArc, current - firstArc * 40)
      } else {
        parts.push(current)
      }
      current = 0
    }
  }
  return parts.join('.')
}

const oidOf = (node: Tlv) => decodeOid(value(expectTag(node, 0x06, 'OID')))

/** OCTET STRING content, joining BER constructed segments. */
function octets(node: Tlv): Uint8Array {
  if (node.tag === 0x04) return value(node)
  if (node.tag === 0x24) {
    const parts = children(node).map(octets)
    const total = parts.reduce((sum, part) => sum + part.length, 0)
    const out = new Uint8Array(total)
    let offset = 0
    for (const part of parts) { out.set(part, offset); offset += part.length }
    return out
  }
  return fail('Expected an OCTET STRING.')
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false
  return true
}

function decodeTime(node: Tlv): Date {
  const text = new TextDecoder().decode(value(node))
  let match: RegExpExecArray | null
  if (node.tag === 0x17 && (match = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(text))) {
    const year = Number(match[1]) >= 50 ? 1900 + Number(match[1]) : 2000 + Number(match[1])
    return new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])))
  }
  if (node.tag === 0x18 && (match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(text))) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])))
  }
  return fail('Unsupported certificate time format.')
}

// ---------------------------------------------------------------------------
// X.509

const OID = {
  signedData: '1.2.840.113549.1.7.2',
  messageDigest: '1.2.840.113549.1.9.4',
  commonName: '2.5.4.3',
  subjectAltName: '2.5.29.17',
  basicConstraints: '2.5.29.19',
  authorityInfoAccess: '1.3.6.1.5.5.7.1.1',
  caIssuers: '1.3.6.1.5.5.7.48.2',
  rsaEncryption: '1.2.840.113549.1.1.1',
  ecPublicKey: '1.2.840.10045.2.1',
  p256: '1.2.840.10045.3.1.7',
  p384: '1.3.132.0.34',
} as const

const DIGESTS: Record<string, string> = {
  '1.3.14.3.2.26': 'SHA-1',
  '2.16.840.1.101.3.4.2.1': 'SHA-256',
  '2.16.840.1.101.3.4.2.2': 'SHA-384',
  '2.16.840.1.101.3.4.2.3': 'SHA-512',
}

/** Signature algorithm OID → hash (key type comes from the signer's SPKI). */
const SIGNATURE_HASHES: Record<string, string> = {
  '1.2.840.113549.1.1.5': 'SHA-1',
  '1.2.840.113549.1.1.11': 'SHA-256',
  '1.2.840.113549.1.1.12': 'SHA-384',
  '1.2.840.113549.1.1.13': 'SHA-512',
  '1.2.840.10045.4.1': 'SHA-1',
  '1.2.840.10045.4.3.2': 'SHA-256',
  '1.2.840.10045.4.3.3': 'SHA-384',
  '1.2.840.10045.4.3.4': 'SHA-512',
}

export type Certificate = {
  der: Uint8Array
  tbs: Uint8Array
  signatureOid: string
  signature: Uint8Array
  serial: Uint8Array
  issuer: Uint8Array
  subject: Uint8Array
  subjectCommonName: string | null
  notBefore: Date
  notAfter: Date
  spki: Uint8Array
  keyType: 'rsa' | 'ec'
  curve: 'P-256' | 'P-384' | null
  dnsNames: string[]
  isCa: boolean
  caIssuerUrls: string[]
}

function commonName(name: Tlv): string | null {
  for (const rdn of children(name)) {
    for (const attribute of children(rdn)) {
      const [type, attrValue] = children(attribute)
      if (type && attrValue && oidOf(type) === OID.commonName) return new TextDecoder().decode(value(attrValue))
    }
  }
  return null
}

export function parseCertificate(der: Uint8Array): Certificate {
  const cert = expectTag(readTlv(der, 0), 0x30, 'Certificate')
  const [tbsNode, sigAlg, sigValue] = children(cert)
  expectTag(tbsNode, 0x30, 'TBSCertificate')
  const tbsChildren = children(tbsNode)
  let index = tbsChildren[0]?.tag === 0xa0 ? 1 : 0
  const serial = value(expectTag(tbsChildren[index++], 0x02, 'serialNumber'))
  index += 1 // signature AlgorithmIdentifier (inner)
  const issuer = expectTag(tbsChildren[index++], 0x30, 'issuer')
  const validity = children(expectTag(tbsChildren[index++], 0x30, 'validity'))
  const subject = expectTag(tbsChildren[index++], 0x30, 'subject')
  const spki = expectTag(tbsChildren[index++], 0x30, 'subjectPublicKeyInfo')
  const [spkiAlg] = children(spki)
  const [keyOid, keyParams] = children(expectTag(spkiAlg, 0x30, 'SPKI algorithm'))
  const keyAlgorithm = oidOf(keyOid)
  let keyType: Certificate['keyType']
  let curve: Certificate['curve'] = null
  if (keyAlgorithm === OID.rsaEncryption) keyType = 'rsa'
  else if (keyAlgorithm === OID.ecPublicKey) {
    keyType = 'ec'
    const curveOid = keyParams ? oidOf(keyParams) : ''
    curve = curveOid === OID.p256 ? 'P-256' : curveOid === OID.p384 ? 'P-384' : fail('Unsupported EC curve.')
  } else fail('Unsupported certificate key algorithm.')

  const dnsNames: string[] = []
  const caIssuerUrls: string[] = []
  let isCa = false
  const extensionsWrapper = tbsChildren.slice(index).find((node) => node.tag === 0xa3)
  if (extensionsWrapper) {
    for (const extension of children(children(extensionsWrapper)[0])) {
      const parts = children(extension)
      const extOid = oidOf(parts[0])
      const extValue = readTlv(octets(parts[parts.length - 1]), 0)
      if (extOid === OID.subjectAltName) {
        for (const generalName of children(extValue)) {
          if (generalName.tag === 0x82) dnsNames.push(new TextDecoder().decode(value(generalName)).toLowerCase())
        }
      } else if (extOid === OID.basicConstraints) {
        const first = children(extValue)[0]
        isCa = Boolean(first && first.tag === 0x01 && value(first)[0] !== 0)
      } else if (extOid === OID.authorityInfoAccess) {
        for (const description of children(extValue)) {
          const [method, location] = children(description)
          if (oidOf(method) === OID.caIssuers && location?.tag === 0x86) caIssuerUrls.push(new TextDecoder().decode(value(location)))
        }
      }
    }
  }

  const signatureBits = value(expectTag(sigValue, 0x03, 'signatureValue'))
  return {
    der: raw(cert),
    tbs: raw(tbsNode),
    signatureOid: oidOf(children(expectTag(sigAlg, 0x30, 'signatureAlgorithm'))[0]),
    signature: signatureBits.subarray(1),
    serial,
    issuer: raw(issuer),
    subject: raw(subject),
    subjectCommonName: commonName(subject),
    notBefore: decodeTime(validity[0]),
    notAfter: decodeTime(validity[1]),
    spki: raw(spki),
    keyType,
    curve,
    dnsNames,
    isCa,
    caIssuerUrls,
  }
}

/** ECDSA DER SEQUENCE { r, s } → fixed-width r||s for WebCrypto. */
function ecdsaRawSignature(der: Uint8Array, size: number): Uint8Array {
  const [r, s] = children(readTlv(der, 0)).map(value)
  const out = new Uint8Array(size * 2)
  const place = (int: Uint8Array, offset: number) => {
    const trimmed = int.subarray(Math.max(0, int.length - size))
    out.set(trimmed, offset + size - trimmed.length)
  }
  place(r, 0)
  place(s, size)
  return out
}

async function verifyWithKey(signer: Certificate, hash: string, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
  try {
    if (signer.keyType === 'rsa') {
      const key = await crypto.subtle.importKey('spki', bs(signer.spki), { name: 'RSASSA-PKCS1-v1_5', hash }, false, ['verify'])
      return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bs(signature), bs(data))
    }
    const size = signer.curve === 'P-384' ? 48 : 32
    const key = await crypto.subtle.importKey('spki', bs(signer.spki), { name: 'ECDSA', namedCurve: signer.curve! }, false, ['verify'])
    return await crypto.subtle.verify({ name: 'ECDSA', hash }, key, bs(ecdsaRawSignature(signature, size)), bs(data))
  } catch {
    return false
  }
}

async function issuedBy(child: Certificate, issuer: Certificate): Promise<boolean> {
  if (!bytesEqual(child.issuer, issuer.subject)) return false
  const hash = SIGNATURE_HASHES[child.signatureOid]
  if (!hash) return false
  return verifyWithKey(issuer, hash, child.signature, child.tbs)
}

function withinValidity(cert: Certificate, at: Date): boolean {
  return cert.notBefore.getTime() <= at.getTime() && at.getTime() <= cert.notAfter.getTime()
}

function matchesSignerDomain(cert: Certificate, domain: string): boolean {
  const names = cert.dnsNames.length ? cert.dnsNames : cert.subjectCommonName ? [cert.subjectCommonName.toLowerCase()] : []
  return names.some((name) => name === domain || name.endsWith(`.${domain}`) || name === `*.${domain}`)
}

const AIA_HOSTS = new Set(['www.microsoft.com', 'cacerts.digicert.com', 'caissuers.microsoft.com'])
const intermediateCache = new Map<string, Uint8Array>()

async function defaultFetchCertificate(url: string): Promise<Uint8Array> {
  const parsed = new URL(url)
  if (!AIA_HOSTS.has(parsed.hostname)) fail('Signer intermediate certificate URL is not an allowed Microsoft/DigiCert host.')
  const cached = intermediateCache.get(url)
  if (cached) return cached
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) fail('Unable to download the signer intermediate certificate.')
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.length > 16 * 1024) fail('Signer intermediate certificate is too large.')
  intermediateCache.set(url, bytes)
  return bytes
}

let defaultRoots: Certificate[] | null = null
function embeddedRoots(): Certificate[] {
  defaultRoots ??= AZURE_ROOT_CERTIFICATES.map((root) => parseCertificate(base64Decode(root.der)))
  return defaultRoots
}

/** Builds and verifies leaf → (intermediates) → trusted root. Returns subject CNs, leaf first. */
async function verifyChain(leaf: Certificate, pool: Certificate[], roots: Certificate[], at: Date, fetchCertificate: (url: string) => Promise<Uint8Array>): Promise<string[]> {
  const names = [leaf.subjectCommonName ?? '(leaf)']
  let current = leaf
  const candidates = [...pool]
  for (let depth = 0; depth < 5; depth += 1) {
    for (const root of roots) {
      if (await issuedBy(current, root)) {
        if (!withinValidity(root, at)) fail('Trusted root certificate is outside its validity period.')
        names.push(root.subjectCommonName ?? '(root)')
        return names
      }
    }
    let next: Certificate | null = null
    for (const candidate of candidates) {
      if (candidate !== current && (await issuedBy(current, candidate))) { next = candidate; break }
    }
    if (!next) {
      for (const url of current.caIssuerUrls) {
        try {
          const fetched = parseCertificate(await fetchCertificate(url))
          candidates.push(fetched)
          if (await issuedBy(current, fetched)) { next = fetched; break }
        } catch (error) {
          if (error instanceof ApiError) throw error
        }
      }
    }
    if (!next) fail('Signer certificate does not chain to a trusted Azure root.')
    if (!next.isCa) fail('Intermediate certificate is not a CA.')
    if (!withinValidity(next, at)) fail('Intermediate certificate is outside its validity period.')
    names.push(next.subjectCommonName ?? '(intermediate)')
    current = next
  }
  return fail('Certificate chain is too long.')
}

// ---------------------------------------------------------------------------
// CMS SignedData

/** IMDS timestamps look like "11/30/20 21:19:24 -0000" (MM/DD/YY HH:mm:ss -0000). */
export function parseImdsTimestamp(text: unknown): Date | null {
  if (typeof text !== 'string') return null
  const match = /^(\d{2})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2}) [+-]0000$/.exec(text.trim())
  if (!match) return null
  return new Date(Date.UTC(2000 + Number(match[3]), Number(match[1]) - 1, Number(match[2]), Number(match[4]), Number(match[5]), Number(match[6])))
}

export async function verifyAttestedSignature(signatureBase64: string, options: VerifyAttestedOptions): Promise<VerifiedAttestation> {
  const at = options.now ?? new Date()
  let der: Uint8Array
  try { der = base64Decode(signatureBase64) } catch { return fail('Attested signature is not valid base64.') }
  if (der.length < 64 || der.length > 64 * 1024) fail('Attested signature has an invalid size.')

  const contentInfo = children(expectTag(readTlv(der, 0), 0x30, 'ContentInfo'))
  if (oidOf(contentInfo[0]) !== OID.signedData) fail('Attested signature is not CMS SignedData.')
  const signedData = children(expectTag(children(expectTag(contentInfo[1], 0xa0, 'content'))[0], 0x30, 'SignedData'))
  const encap = children(expectTag(signedData[2], 0x30, 'EncapsulatedContentInfo'))
  const contentWrapper = encap[1]
  if (!contentWrapper || contentWrapper.tag !== 0xa0) fail('Attested signature does not embed the document.')
  const content = octets(children(contentWrapper)[0])

  const pool = signedData.filter((node) => node.tag === 0xa0).flatMap((node) => children(node)).filter((node) => node.tag === 0x30).map((node) => parseCertificate(raw(node)))
  const signerInfos = children(expectTag(signedData[signedData.length - 1], 0x31, 'SignerInfos'))
  if (signerInfos.length !== 1) fail('Attested signature must have exactly one signer.')
  const signerInfo = children(expectTag(signerInfos[0], 0x30, 'SignerInfo'))
  const sid = signerInfo[1]
  let cursor = 2
  const digestOid = oidOf(children(signerInfo[cursor++])[0])
  const signedAttrs = signerInfo[cursor]?.tag === 0xa0 ? signerInfo[cursor++] : null
  cursor += 1 // signatureAlgorithm (key type is taken from the certificate)
  const signature = value(expectTag(signerInfo[cursor], 0x04, 'signature'))
  const hash = DIGESTS[digestOid]
  if (!hash) fail('Unsupported attested digest algorithm.')

  let signer: Certificate | undefined
  if (sid.tag === 0x30) {
    const [issuerName, serialNumber] = children(sid)
    signer = pool.find((cert) => bytesEqual(cert.issuer, raw(issuerName)) && bytesEqual(cert.serial, value(serialNumber)))
  }
  signer ??= pool.find((cert) => matchesSignerDomain(cert, options.signerDomain ?? 'metadata.azure.com'))
  if (!signer) fail('Attested signature does not include its signer certificate.')

  let signedBytes = content
  if (signedAttrs) {
    let digest: Uint8Array | null = null
    for (const attribute of children(signedAttrs)) {
      const [type, values] = children(attribute)
      if (oidOf(type) === OID.messageDigest) digest = value(children(values)[0])
    }
    const actual = new Uint8Array(await crypto.subtle.digest(hash, bs(content)))
    if (!digest || !bytesEqual(digest, actual)) fail('Attested document digest does not match.')
    signedBytes = raw(signedAttrs).slice()
    signedBytes[0] = 0x31 // signed attributes are signed as an explicit SET OF
  }
  if (!(await verifyWithKey(signer, hash, signature, signedBytes))) fail('Attested signature is invalid.')

  if (!matchesSignerDomain(signer, options.signerDomain ?? 'metadata.azure.com')) fail('Attested data was not signed by metadata.azure.com.')
  if (!withinValidity(signer, at)) fail('Signer certificate is outside its validity period.')
  const roots = options.trustedRoots ? options.trustedRoots.map(parseCertificate) : embeddedRoots()
  const chain = await verifyChain(signer, pool, roots, at, options.fetchCertificate ?? defaultFetchCertificate)

  let document: AttestedDocument
  try {
    document = JSON.parse(new TextDecoder().decode(content)) as AttestedDocument
  } catch {
    return fail('Attested document is not JSON.')
  }
  if (!document || typeof document !== 'object') fail('Attested document is not an object.')
  if (document.nonce !== options.expectedNonce) throw new ApiError(401, 'nonce_mismatch', 'Attested nonce does not match the request nonce.')
  const expires = parseImdsTimestamp(document.timeStamp?.expiresOn)
  if (expires && expires.getTime() + 5 * 60_000 < at.getTime()) throw new ApiError(401, 'attestation_expired', 'Attested document has expired.')
  if (typeof document.vmId !== 'string' || !document.vmId) fail('Attested document is missing vmId.')

  return { document, signerSubject: signer.subjectCommonName ?? signer.dnsNames[0] ?? '', chain }
}
