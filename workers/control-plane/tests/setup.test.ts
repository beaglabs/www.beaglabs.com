import { describe, expect, it } from 'vitest'
import { STEP_IDS, canRun, initialSteps, isDone, nextStep, parseSteps, record, resetFrom } from '../src/setup'

const passThrough = (until: (typeof STEP_IDS)[number]) => {
  let steps = initialSteps()
  for (const id of STEP_IDS) {
    steps = record(steps, id, { status: 'pass' })
    if (id === until) break
  }
  return steps
}

describe('setup step state machine', () => {
  it('starts with every step pending, connect first', () => {
    const steps = initialSteps()
    expect(STEP_IDS).toEqual(['connect', 'deploy', 'dns', 'health', 'microsoft', 'registration'])
    expect(Object.values(steps).every((s) => s.status === 'pending')).toBe(true)
    expect(nextStep(steps)).toBe('connect')
    expect(canRun(steps, 'connect')).toBe(true)
    expect(canRun(steps, 'deploy')).toBe(false)
  })

  it('only lets a step run after every earlier step passes', () => {
    const steps = passThrough('deploy')
    expect(canRun(steps, 'dns')).toBe(true)
    expect(canRun(steps, 'health')).toBe(false)
    expect(() => record(steps, 'health', { status: 'pass' })).toThrow()
  })

  it('records reasons and resets later steps on fail or pending', () => {
    const done = passThrough('registration')
    expect(isDone(done)).toBe(true)
    const failed = record(done, 'dns', { status: 'fail', reason: 'CNAME papyrus.example.com not found' })
    expect(failed.dns).toMatchObject({ status: 'fail', reason: 'CNAME papyrus.example.com not found' })
    expect(failed.deploy.status).toBe('pass')
    for (const later of ['health', 'microsoft', 'registration'] as const) expect(failed[later].status).toBe('pending')
    expect(nextStep(failed)).toBe('dns')
    const waiting = record(passThrough('microsoft'), 'registration', { status: 'pending', reason: 'Waiting for bootstrap exchange' })
    expect(waiting.registration.status).toBe('pending')
    expect(isDone(waiting)).toBe(false)
  })

  it('a retried step that passes keeps later results', () => {
    const done = passThrough('registration')
    const rechecked = record(done, 'health', { status: 'pass', reason: 'healthy' })
    expect(isDone(rechecked)).toBe(true)
  })

  it('resetFrom clears the step and everything after it', () => {
    const steps = resetFrom(passThrough('registration'), 'deploy')
    expect(steps.connect.status).toBe('pass')
    expect(STEP_IDS.slice(1).every((id) => steps[id].status === 'pending')).toBe(true)
  })

  it('parses stored progress and tolerates garbage', () => {
    const stored = JSON.stringify({ connect: { status: 'pass' }, deploy: { status: 'bogus' } })
    const steps = parseSteps(stored)
    expect(steps.connect.status).toBe('pass')
    expect(steps.deploy.status).toBe('pending')
    expect(parseSteps('{not json').connect.status).toBe('pending')
  })
})
