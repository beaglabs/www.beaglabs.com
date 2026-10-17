import * as Effect from 'effect/Effect'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import { describe, expect, it } from 'vitest'
import { checkRecord, checkRecords, describeFailures, type DnsRecord } from '../src/dns'

type Zone = Record<string, Partial<Record<'A' | 'CNAME' | 'TXT' | 'AAAA', string[]>>>
const CODES = { A: 1, CNAME: 5, TXT: 16, AAAA: 28 } as const

/** A fake 1.1.1.1 DoH JSON endpoint. */
const doh = (zone: Zone, seen: string[] = []) =>
  (async (input: RequestInfo | URL) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
    seen.push(url.toString())
    const name = url.searchParams.get('name')!
    const type = url.searchParams.get('type') as keyof typeof CODES
    const answers = zone[name]?.[type] ?? []
    return Response.json({ Status: answers.length || zone[name] ? 0 : 3, Answer: answers.map((data) => ({ name, type: CODES[type], TTL: 60, data })) })
  }) as typeof fetch

const run = <A>(effect: Effect.Effect<A, never, any>, zone: Zone, seen?: string[]) =>
  Effect.runPromise(effect.pipe(Effect.provide(FetchHttpClient.layer), Effect.provideService(FetchHttpClient.Fetch, doh(zone, seen))) as Effect.Effect<A>)

const cname: DnsRecord = { type: 'CNAME', name: 'papyrus.example.com', value: 'papyrus-abc.fly.dev' }

describe('DNS check (DoH to 1.1.1.1)', () => {
  it('passes when the CNAME points at the target (trailing dot and case ignored)', async () => {
    const seen: string[] = []
    const result = await run(checkRecord(cname), { 'papyrus.example.com': { CNAME: ['Papyrus-ABC.fly.dev.'] } }, seen)
    expect(result.ok).toBe(true)
    expect(seen[0]).toMatch(/^https:\/\/1\.1\.1\.1\/dns-query\?name=papyrus\.example\.com&type=CNAME$/)
  })

  it('passes a flattened CNAME when the addresses match the target', async () => {
    const result = await run(checkRecord(cname), { 'papyrus.example.com': { A: ['66.241.124.1'] }, 'papyrus-abc.fly.dev': { A: ['66.241.124.1'] } })
    expect(result.ok).toBe(true)
  })

  it('fails when the record is missing or points elsewhere, with a readable reason', async () => {
    const missing = await run(checkRecord(cname), {})
    expect(missing).toMatchObject({ ok: false, found: [] })
    const wrong = await run(checkRecords([cname, { type: 'CNAME', name: '_x.papyrus.example.com', value: '_y.acm-validations.aws' }]), {
      'papyrus.example.com': { CNAME: ['old-host.example.net.'] },
      '_x.papyrus.example.com': { CNAME: ['_y.acm-validations.aws.'] },
    })
    expect(wrong.map((c) => c.ok)).toEqual([false, true])
    expect(describeFailures(wrong)).toBe('CNAME papyrus.example.com should be papyrus-abc.fly.dev (found old-host.example.net)')
  })

  it('fails (does not throw) when DoH is unreachable', async () => {
    const result = await Effect.runPromise(
      checkRecord(cname).pipe(Effect.provide(FetchHttpClient.layer), Effect.provideService(FetchHttpClient.Fetch, (async () => { throw new Error('offline') }) as unknown as typeof fetch)),
    )
    expect(result.ok).toBe(false)
  })
})
