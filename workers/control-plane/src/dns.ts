import * as Effect from 'effect/Effect'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'

/** A record the customer must create at their DNS provider. */
export interface DnsRecord {
  type: 'CNAME' | 'A' | 'AAAA' | 'TXT'
  name: string
  value: string
  /** Shown next to the record, e.g. "Certificate validation". */
  purpose?: string
}

export interface DnsCheck {
  record: DnsRecord
  ok: boolean
  found: string[]
}

const DOH = 'https://1.1.1.1/dns-query'
const TYPE_CODES: Record<DnsRecord['type'], number> = { A: 1, CNAME: 5, TXT: 16, AAAA: 28 }

const normalize = (value: string) => value.trim().toLowerCase().replace(/\.$/, '').replace(/^"|"$/g, '')

/** DNS-over-HTTPS (JSON) lookup against 1.1.1.1. Returns the answer data for that type only. */
export const resolve = (name: string, type: DnsRecord['type']) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient
    const request = HttpClientRequest.get(DOH).pipe(
      HttpClientRequest.setUrlParams({ name, type }),
      HttpClientRequest.setHeader('accept', 'application/dns-json'),
    )
    const response = yield* client.execute(request)
    const body = (yield* response.json) as { Status?: number; Answer?: Array<{ type: number; data: string }> }
    if (body.Status !== 0) return [] as string[]
    return (body.Answer ?? []).filter((answer) => answer.type === TYPE_CODES[type]).map((answer) => normalize(answer.data))
  }).pipe(Effect.orElseSucceed(() => [] as string[]))

/**
 * Verify one record. A CNAME also passes when the name resolves to the same addresses as the target, so a provider
 * that flattens CNAMEs (apex records, Cloudflare proxying off) still verifies.
 */
export const checkRecord = (record: DnsRecord) =>
  Effect.gen(function* () {
    const expected = normalize(record.value)
    const found = yield* resolve(record.name, record.type)
    if (found.includes(expected)) return { record, ok: true, found } satisfies DnsCheck
    if (record.type === 'CNAME') {
      const [mine, theirs] = yield* Effect.all([resolve(record.name, 'A'), resolve(record.value, 'A')], { concurrency: 2 })
      if (mine.length > 0 && theirs.length > 0 && mine.every((ip) => theirs.includes(ip))) return { record, ok: true, found: mine } satisfies DnsCheck
    }
    return { record, ok: false, found } satisfies DnsCheck
  })

export const checkRecords = (records: readonly DnsRecord[]) => Effect.all(records.map(checkRecord), { concurrency: 4 })

/** One-line reason for the setup page. */
export const describeFailures = (checks: readonly DnsCheck[]): string =>
  checks
    .filter((check) => !check.ok)
    .map((check) => `${check.record.type} ${check.record.name} should be ${check.record.value}${check.found.length ? ` (found ${check.found.join(', ')})` : ' (not found)'}`)
    .join('; ')
