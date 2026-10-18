import type { ComponentChildren } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { ActivityPanel } from './activity'
import { createActionRunner, type ActionRunner, type PendingAction } from './actions'
import { day, relative, stamp } from './format'
import { IconAlert, IconCheck, IconExternal, IconMicrosoft, IconPlay, IconPower, IconRedeploy, IconSliders } from './icons'
import { createPoller, isNewer, type Poller, type PollStatus } from './polling'
import { ActionButton, Halo, Host, MilestoneList, Overlay, StatusPill, Switcher, SyncBadge, Toasts, TransitionChip, useToasts } from './primitives'
import { useMounted, useNow, useRuntime } from './runtime'
import type { Action, ActionId, ActionResult, ActivityEvent, DeploymentView, DetailPayload } from './types'

/** /deploy/{id}: compact header, progress and activity, overview and plan. Hydrates from the server's first paint. */

export interface DeploymentAppProps {
  payload: DetailPayload
  events: { events: ActivityEvent[]; next: number | null }
}

const ACTION_ICON: Partial<Record<ActionId, ComponentChildren>> = { stop: <IconPower />, start: <IconPlay />, redeploy: <IconRedeploy /> }

const HEADLINE: Record<DeploymentView['status'], string> = {
  setup: 'Waiting to start',
  provisioning: 'Provisioning',
  starting: 'Starting Papyrus',
  running: 'Papyrus is live',
  stopped: 'Stopped',
  failed: 'Needs attention',
  suspended: 'Suspended',
  deleting: 'Deleting',
  deleted: 'Deleted',
}

const initialStatus = (serverTime: string): PollStatus => ({ inFlight: false, failures: 0, lastSuccessAt: Date.parse(serverTime) || null, lastError: null, stale: false, running: false, nextDelayMs: null })

export const DeploymentApp = ({ payload, events }: DeploymentAppProps) => {
  const runtime = useRuntime()
  const mounted = useMounted()
  const now = useNow(payload.serverTime)
  const [view, setView] = useState(payload.deployment)
  const [sync, setSync] = useState<PollStatus>(() => initialStatus(payload.serverTime))
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [confirm, setConfirm] = useState<Action | null>(null)
  const [sheet, setSheet] = useState(false)
  const [terms, setTerms] = useState(false)
  const { toasts, push, dismiss } = useToasts()
  const viewRef = useRef(view)
  const poller = useRef<Poller | null>(null)
  const runner = useRef<ActionRunner | null>(null)
  const base = `/api/deployments/${encodeURIComponent(view.id)}`

  /** Show a snapshot only if it is not older than the one on screen. */
  const accept = useCallback((next: DeploymentView) => {
    if (!isNewer(viewRef.current, next)) return
    viewRef.current = next
    setView(next)
    runner.current?.observe(next)
  }, [])

  useEffect(() => {
    runner.current = createActionRunner({
      post: async (id) => (await runtime.postJson<ActionResult>(`${base}/actions/${id}`)).body,
      onSnapshot: accept,
      notify: push,
      onPending: setPending,
    })
    const p = createPoller<DetailPayload>({
      load: () => runtime.getJson<DetailPayload>(base),
      onData: (data) => accept(data.deployment),
      isStale: (data) => !isNewer(viewRef.current, data.deployment),
      isBusy: () => viewRef.current.busy || Boolean(runner.current?.pending()),
      isHidden: runtime.isHidden,
      onStatus: setSync,
    })
    poller.current = p
    p.start()
    const off = runtime.onVisibility(() => p.visibilityChanged())
    return () => {
      p.stop()
      off()
    }
  }, [])

  const run = (action: Action) => {
    if (action.confirm) setConfirm(action)
    else void runner.current?.run(action.id)
  }

  const onRelevant = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    return () => {
      clearTimeout(timer)
      timer = setTimeout(() => void poller.current?.refresh(), 400)
    }
  }, [])

  const recovery = new Set(view.failure?.recovery ?? [])
  const headerActions = view.actions.filter((a) => !recovery.has(a.id) && a.id !== 'check')
  const checkAction = view.actions.find((a) => a.id === 'check')
  const blocked = Boolean(pending)
  const pendingAction = pending ? view.actions.find((a) => a.id === pending.id) : null
  const live = view.status === 'running' && view.health === 'healthy' && view.url
  const allDone = view.milestones.length > 0 && view.milestones.every((m) => m.state === 'completed')

  return (
    <div class="dp" data-status={view.status}>
      <header class="dp-head">
        <div class="dp-bar">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="/deploy">Deployments</a>
            <span aria-hidden="true">/</span>
            <Switcher current={view.id} items={[{ id: view.id, name: view.name, tone: view.tone, statusLabel: view.statusLabel }, ...view.siblings]} />
          </nav>
          <SyncBadge status={sync} now={now} mounted={mounted} onRefresh={() => void poller.current?.refresh()} dark />
        </div>
        <div class="dp-hero">
          <div class="dp-title">
            <div class="dp-kicker">
              <span class="env">{view.environment}</span>
              <span>{view.provider}</span>
              {view.region ? <span class="mono">{view.region}</span> : null}
            </div>
            <h1 class="disp">
              {view.url ? (
                <a class="dp-url" href={view.url} target="_blank" rel="noopener noreferrer">
                  <Host name={view.name} />
                  <span class="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <Host name={view.name} />
              )}
            </h1>
            <div class="dp-meta">
              <StatusPill tone={view.tone} label={view.statusLabel} />
              {pendingAction ? <TransitionChip label={pendingAction.pendingLabel} awaiting={Boolean(pending?.awaiting)} /> : null}
              <span class="health" data-health={view.health}>
                <span class="health-dot" aria-hidden="true" />
                {view.healthLabel}
              </span>
            </div>
          </div>
          <div class="dp-actions">
            <a class="btn" href={`/deploy/${encodeURIComponent(view.id)}/settings`}><IconSliders /> Settings</a>
            {headerActions.map((a) => (
              <ActionButton key={a.id} action={a} pendingId={pending?.id ?? null} blocked={blocked} onRun={run} icon={ACTION_ICON[a.id]} />
            ))}
            {live ? (
              <a class="btn primary" href={view.url!} target="_blank" rel="noopener noreferrer">
                Open environment <IconExternal />
              </a>
            ) : view.status !== 'deleted' && view.status !== 'deleting' ? (
              <span class="btn primary" role="link" aria-disabled="true" title="Opens once Papyrus answers its health check">
                Open environment <IconExternal />
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div class="dp-grid">
        <div class="dp-col dp-main">
          <section class="card dp-progress" aria-labelledby="progress-h">
            <h2 id="progress-h" class="card-h">
              <span>Progress</span>
              <span class="card-h-note">{view.progress.label}</span>
            </h2>
            <div class="pg-top">
              <Halo
                size={72}
                milestones={view.milestones}
                progress={view.progress}
                center={
                  view.status === 'stopped' ? (
                    <span class="halo-done halo-off">
                      <IconPower />
                    </span>
                  ) : allDone ? (
                    <span class="halo-done">
                      <IconCheck />
                    </span>
                  ) : view.failure ? (
                    <span class="halo-fail">!</span>
                  ) : view.milestones.length ? (
                    <span class="halo-count">
                      <b>{view.progress.completed}</b>/{view.progress.total}
                    </span>
                  ) : (
                    <span class="halo-count">—</span>
                  )
                }
              />
              <div class="pg-now">
                <div class="pg-head disp">{view.operation?.label ?? HEADLINE[view.status]}</div>
                <p class="pg-detail">{view.operation?.detail ?? (view.failure ? `Failed at ${view.failure.stage}. Details and recovery below.` : view.status === 'running' ? 'Every milestone is complete.' : view.status === 'stopped' ? 'Scaled to zero. Start brings it back.' : view.statusLabel)}</p>
                {view.operation?.startedAt ? <p class="pg-since mono">since {mounted ? relative(view.operation.startedAt, now) : stamp(view.operation.startedAt, false)}</p> : null}
                {checkAction ? (
                  <div class="pg-actions">
                    <ActionButton action={checkAction} pendingId={pending?.id ?? null} blocked={blocked} onRun={run} size="sm" />
                  </div>
                ) : null}
              </div>
            </div>

            {view.failure ? (
              <div class="fail" role="alert">
                <div class="fail-head">
                  <IconAlert />
                  <span>Failed at {view.failure.stage}</span>
                </div>
                <FailureText text={view.failure.message} />
                {view.failure.recovery.length ? (
                  <div class="fail-actions">
                    {view.failure.recovery.map((id) => {
                      const a = view.actions.find((x) => x.id === id)
                      return a ? <ActionButton key={id} action={a} pendingId={pending?.id ?? null} blocked={blocked} onRun={run} size="sm" icon={ACTION_ICON[id]} /> : null
                    })}
                  </div>
                ) : null}
                <p class="fail-help">
                  Still failing? Email <a href="mailto:james@beaglabs.com">james@beaglabs.com</a> with the deployment ID <span class="mono">{view.id}</span>.
                </p>
              </div>
            ) : null}

            {view.next ? (
              <div class="next">
                <div class="next-k">Next step</div>
                <strong>{view.next.title}</strong>
                <p>{view.next.body}</p>
                {view.next.link ? (
                  <a class="btn sm dark" href={view.next.link.href} target={view.next.link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    {view.next.link.label} {view.next.link.href.startsWith('http') ? <IconExternal /> : null}
                  </a>
                ) : null}
                {view.microsoft ? (
                  view.microsoft.termsAccepted ? (
                    <a class="btn sm primary" href={view.microsoft.href} data-connect-microsoft>
                      <IconMicrosoft /> Connect Microsoft
                    </a>
                  ) : (
                    <button type="button" class="btn sm primary" data-connect-microsoft onClick={() => setTerms(true)}>
                      <IconMicrosoft /> Connect Microsoft
                    </button>
                  )
                ) : null}
              </div>
            ) : null}

            {view.milestones.length ? (
              allDone ? (
                <details class="ms-wrap">
                  <summary>Show all {view.milestones.length} milestones</summary>
                  <MilestoneList milestones={view.milestones} now={now} mounted={mounted} />
                </details>
              ) : (
                <MilestoneList milestones={view.milestones} now={now} mounted={mounted} />
              )
            ) : null}
          </section>

          <ActivityPanel deploymentId={view.id} initial={events.events} next={events.next} now={now} mounted={mounted} onRelevant={onRelevant} />
        </div>

        <div class="dp-col dp-side">
          <section class="card dp-overview" aria-labelledby="overview-h">
            <h2 id="overview-h" class="card-h">
              <span>Overview</span>
              <button type="button" class="card-h-btn" onClick={() => setSheet(true)}>
                <IconSliders /> All details
              </button>
            </h2>
            <dl class="kv-list">
              <div>
                <dt>Health</dt>
                <dd>
                  <span class="health" data-health={view.health}>
                    <span class="health-dot" aria-hidden="true" />
                    {view.healthLabel}
                  </span>
                  {view.timestamps.lastCheckAt && view.health !== 'unknown' && view.health !== 'stopped' ? <span class="kv-sub"> · checked {mounted ? relative(view.timestamps.lastCheckAt, now) : stamp(view.timestamps.lastCheckAt, false)}</span> : null}
                </dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{view.provider}</dd>
              </div>
              {view.region ? (
                <div>
                  <dt>Region</dt>
                  <dd class="mono">{view.region}</dd>
                </div>
              ) : null}
              {view.configuration ? (
                <div>
                  <dt>Configuration</dt>
                  <dd>{view.configuration}</dd>
                </div>
              ) : null}
              <div>
                <dt>Created</dt>
                <dd>{day(view.createdAt, mounted, now)}</dd>
              </div>
              <div>
                <dt>Last change</dt>
                <dd title={view.updatedAt}>{mounted ? relative(view.updatedAt, now) : stamp(view.updatedAt, false)}</dd>
              </div>
            </dl>
          </section>

          {view.plan ? (
            <section class="card dp-plan" aria-labelledby="plan-h">
              <h2 id="plan-h" class="card-h">
                <span>Plan</span>
                <span class="card-h-accent">{view.plan.label}</span>
              </h2>
              <div class="card-b">
                {view.plan.status ? (
                  <p class="plan-status" data-trial={view.plan.label === 'Trial' ? '' : undefined}>
                    {view.plan.status}
                  </p>
                ) : null}
                <table class="mini-price">
                  <caption class="sr-only">Pricing</caption>
                  <tbody>
                    {view.plan.pricing.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td>
                          <b>{row.amount}</b> <span>{row.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {view.plan.usage ? <p class="plan-usage mono">{view.plan.usage}</p> : null}
                <form method="post" action={view.plan.billing.action} class="plan-form">
                  <input type="hidden" name="deployment" value={view.id} />
                  <button class="btn sm" type="submit">
                    {view.plan.billing.label}
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          {view.cleanup.length ? (
            <section class="card" aria-labelledby="cleanup-h" data-cleanup>
              <h2 id="cleanup-h" class="card-h">
                <span>Remove from your cloud account</span>
              </h2>
              <div class="card-b">
                <p class="small">Beag Labs deleted nothing in your account. These resources still exist (and still cost you) until you remove them, roughly in this order:</p>
                <ol class="cleanup">
                  {view.cleanup.map((item) => (
                    <li key={`${item.what}-${item.name}`}>
                      <strong>{item.what}</strong>
                      <span class="mono">{item.name}</span>
                      {item.note ? <small>{item.note}</small> : null}
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <Overlay open={sheet} onClose={() => setSheet(false)} title="Deployment details" kicker={view.name} variant="sheet">
        <dl class="kv-list kv-wide">
          {view.details.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd class={row.mono ? 'mono' : undefined}>{/^\d{4}-\d\d-\d\dT/.test(row.value) ? stamp(row.value, mounted) : row.value}</dd>
            </div>
          ))}
        </dl>
        {view.dnsRecords.length ? (
          <>
            <h3 class="ov-sub">DNS records</h3>
            <div class="table-scroll">
              <table class="dns">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {view.dnsRecords.map((r) => (
                    <tr key={`${r.type}${r.name}`}>
                      <td>{r.type}</td>
                      <td>{r.name}</td>
                      <td>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="small">If your DNS is on Cloudflare, set these to "DNS only" (grey cloud).</p>
          </>
        ) : null}
        <h3 class="ov-sub">Danger zone</h3>
        <p class="small">
          Deleting is separate from Stop and can't be undone. It lives in <a href={`/deploy/${encodeURIComponent(view.id)}/settings`}>deployment settings</a>, where you confirm it by typing the name.
        </p>
      </Overlay>

      <Overlay
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.confirm?.title ?? ''}
        variant="dialog"
        footer={
          confirm ? (
            <>
              <button type="button" class="btn" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                class="btn primary"
                data-autofocus
                onClick={() => {
                  const id = confirm.id
                  setConfirm(null)
                  void runner.current?.run(id)
                }}
              >
                {confirm.confirm?.confirmLabel}
              </button>
            </>
          ) : null
        }
      >
        <p class="confirm-body">{confirm?.confirm?.body}</p>
      </Overlay>

      {view.microsoft && !view.microsoft.termsAccepted ? (
        <Overlay open={terms} onClose={() => setTerms(false)} title="Connect Microsoft" variant="dialog">
          <form method="post" action={view.microsoft.href} class="terms-form">
            <label class="terms-check">
              <input type="checkbox" name="terms" value="accept" required />
              <span>
                I accept the Papyrus{' '}
                <a href={view.microsoft.termsUrl} target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href={view.microsoft.privacyUrl} target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>{' '}
                for my organization and am authorized to do so
              </span>
            </label>
            <div class="terms-actions">
              <button type="button" class="btn" onClick={() => setTerms(false)}>
                Cancel
              </button>
              <button type="submit" class="btn primary" data-autofocus>
                <IconMicrosoft /> Connect Microsoft
              </button>
            </div>
          </form>
        </Overlay>
      ) : null}

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  )
}

/** Errors from providers can be long and multi-line: first line, expandable. */
const FailureText = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false)
  const long = text.length > 160 || text.includes('\n')
  if (!long) return <p class="fail-msg">{text}</p>
  return (
    <div class="fail-msg">
      <p class={open ? 'fail-pre' : 'fail-clip'}>{open ? text : `${text.split('\n', 1)[0]!.slice(0, 160)}…`}</p>
      <button type="button" class="tl-more" aria-expanded={open ? 'true' : 'false'} onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'Show full error'}
      </button>
    </div>
  )
}
