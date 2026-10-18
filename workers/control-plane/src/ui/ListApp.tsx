import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { createActionRunner, type ActionRunner, type PendingAction } from './actions'
import { day, relative } from './format'
import { IconExternal, IconPlay, IconPower, IconSearch, IconSort } from './icons'
import { DEFAULT_QUERY, STATUS_FILTERS, queryDeployments, replaceRow, upsertRows, type ListQuery, type SortKey, type StatusFilter } from './list-model'
import { createPoller, type Poller, type PollStatus } from './polling'
import { ActionButton, Host, Overlay, StatusPill, SyncBadge, Toasts, TransitionChip, useToasts } from './primitives'
import { useMounted, useNow, useRuntime } from './runtime'
import type { Action, ActionResult, DeploymentSummary, ListPayload } from './types'

/**
 * /deploy with several deployments: the inventory table. Search, status filter, sorting and paging live in component
 * state, so background refreshes replace rows in place without resetting them.
 */

const COLUMNS: { key: SortKey | null; label: string; className?: string }[] = [
  { key: 'name', label: 'Deployment' },
  { key: 'provider', label: 'Where' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created', className: 'dt-num' },
  { key: 'updatedAt', label: 'Updated', className: 'dt-num' },
  { key: null, label: 'URL' },
  { key: null, label: 'Actions', className: 'dt-act' },
]

export const ListApp = ({ payload }: { payload: ListPayload }) => {
  const runtime = useRuntime()
  const mounted = useMounted()
  const now = useNow(payload.serverTime)
  const [rows, setRows] = useState(payload.deployments)
  const [query, setQuery] = useState<ListQuery>(DEFAULT_QUERY)
  const [sync, setSync] = useState<PollStatus>({ inFlight: false, failures: 0, lastSuccessAt: Date.parse(payload.serverTime) || null, lastError: null, stale: false, running: false, nextDelayMs: null })
  const [pending, setPending] = useState<Record<string, PendingAction | null>>({})
  const [confirm, setConfirm] = useState<{ row: DeploymentSummary; action: Action } | null>(null)
  const { toasts, push, dismiss } = useToasts()
  const rowsRef = useRef(rows)
  const poller = useRef<Poller | null>(null)
  const runners = useRef(new Map<string, ActionRunner>())

  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const show = (next: DeploymentSummary[]) => {
    rowsRef.current = next
    setRows(next)
    for (const row of next) runners.current.get(row.id)?.observe(row)
  }

  useEffect(() => {
    const p = createPoller<ListPayload>({
      load: () => runtime.getJson<ListPayload>('/api/deployments'),
      onData: (data) => show(upsertRows(rowsRef.current, data.deployments)),
      isBusy: () => rowsRef.current.some((r) => r.busy) || Object.values(pendingRef.current).some(Boolean),
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

  const runnerFor = (id: string) => {
    let runner = runners.current.get(id)
    if (!runner) {
      runner = createActionRunner({
        post: async (action) => (await runtime.postJson<ActionResult>(`/api/deployments/${encodeURIComponent(id)}/actions/${action}`)).body,
        onSnapshot: (view) => show(replaceRow(rowsRef.current, view)),
        notify: push,
        onPending: (p) => setPending((current) => ({ ...current, [id]: p })),
      })
      runners.current.set(id, runner)
    }
    return runner
  }

  const run = (row: DeploymentSummary, action: Action) => {
    if (action.confirm) setConfirm({ row, action })
    else void runnerFor(row.id).run(action.id)
  }

  const result = useMemo(() => queryDeployments(rows, query), [rows, query])
  const set = (patch: Partial<ListQuery>) => setQuery((q) => ({ ...q, page: 1, ...patch }))
  const sortBy = (key: SortKey) => setQuery((q) => ({ ...q, sort: key, dir: q.sort === key && q.dir === 'asc' ? 'desc' : q.sort === key ? 'asc' : key === 'name' || key === 'provider' ? 'asc' : 'desc' }))
  const first = result.matched ? (result.page - 1) * query.pageSize + 1 : 0
  const last = Math.min(result.matched, result.page * query.pageSize)

  return (
    <div class="dl">
      <header class="dl-head">
        <div>
          <div class="kicker">Control plane</div>
          <h1 class="disp">Deployments</h1>
          <p class="dl-sub">
            {rows.length} deployment{rows.length === 1 ? '' : 's'} · {rows.filter((r) => r.status === 'running').length} running
          </p>
        </div>
        <div class="dl-head-r">
          <SyncBadge status={sync} now={now} mounted={mounted} onRefresh={() => void poller.current?.refresh()} />
          <form method="post" action="/billing/checkout">
            <button class="btn primary" type="submit">
              + Add a deployment
            </button>
          </form>
        </div>
      </header>

      <section class="card dl-card" aria-label="Deployments">
        <div class="dl-tools">
          <label class="search">
            <IconSearch />
            <span class="sr-only">Search deployments</span>
            <input type="search" placeholder="Search name, URL, provider, region…" value={query.search} onInput={(e) => set({ search: (e.currentTarget as HTMLInputElement).value })} />
          </label>
          <div class="seg" role="group" aria-label="Filter by status">
            {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => (
              <button key={key} type="button" class={`seg-b${query.status === key ? ' on' : ''}`} aria-pressed={query.status === key ? 'true' : 'false'} onClick={() => set({ status: key })}>
                {STATUS_FILTERS[key].label}
                <span class="seg-n">{result.counts[key]}</span>
              </button>
            ))}
          </div>
          <label class="dl-sort">
            Sort
            <select
              value={`${query.sort}:${query.dir}`}
              onChange={(e) => {
                const [sort, dir] = (e.currentTarget as HTMLSelectElement).value.split(':') as [SortKey, 'asc' | 'desc']
                setQuery((q) => ({ ...q, sort, dir }))
              }}
            >
              <option value="updatedAt:desc">Recently updated</option>
              <option value="createdAt:desc">Newest</option>
              <option value="createdAt:asc">Oldest</option>
              <option value="name:asc">Name A–Z</option>
              <option value="status:asc">Needs attention first</option>
              <option value="provider:asc">Provider</option>
            </select>
          </label>
        </div>

        <div class="table-scroll">
          <table class="dt">
            <caption class="sr-only">
              Deployments, sorted by {query.sort} {query.dir === 'asc' ? 'ascending' : 'descending'}
            </caption>
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.label} scope="col" class={col.className} aria-sort={col.key && query.sort === col.key ? (query.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {col.key ? (
                      <button type="button" class="dt-sort" onClick={() => sortBy(col.key!)}>
                        {col.label}
                        <IconSort dir={query.sort === col.key ? query.dir : null} />
                      </button>
                    ) : col.label === 'Actions' ? (
                      <span class="sr-only">Actions</span>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => {
                const p = pending[row.id] ?? null
                const pendingAction = p ? row.actions.find((a) => a.id === p.id) : null
                const power = row.actions.find((a) => a.id === 'stop' || a.id === 'start')
                return (
                  <tr key={row.id} data-status={row.status}>
                    <td data-label="Deployment">
                      <a class="dt-name" href={`/deploy/${encodeURIComponent(row.id)}`}>
                        <Host name={row.name} />
                      </a>
                      <div class="dt-sub">
                        <span class="env">{row.environment}</span>
                        <span class="mono">{row.id}</span>
                      </div>
                    </td>
                    <td data-label="Where">
                      <div class="dt-where">{row.provider}</div>
                      <div class="dt-sub dt-where">
                        {row.region ? <span class="mono">{row.region}</span> : null}
                        {row.configuration ? <span>{row.configuration.replace(/^AWS /, '')}</span> : null}
                      </div>
                    </td>
                    <td data-label="Status">
                      <div class="dt-status">
                        <StatusPill tone={row.tone} label={row.statusLabel} size="sm" />
                        {pendingAction ? <TransitionChip label={pendingAction.pendingLabel} awaiting={Boolean(p?.awaiting)} /> : null}
                      </div>
                      <div class="dt-sub">
                        <span class="health" data-health={row.health}>
                          <span class="health-dot" aria-hidden="true" />
                          {row.healthLabel}
                        </span>
                        {row.busy && row.progress.total ? (
                          <span class="mini-bar" role="progressbar" aria-valuemin={0} aria-valuemax={row.progress.total} aria-valuenow={row.progress.completed} aria-label={row.progress.label}>
                            <span style={{ width: `${(row.progress.completed / row.progress.total) * 100}%` }} />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="Created" class="dt-num">
                      <time dateTime={row.createdAt}>{day(row.createdAt, mounted, now)}</time>
                    </td>
                    <td data-label="Updated" class="dt-num">
                      <time dateTime={row.updatedAt} title={row.updatedAt}>
                        {mounted ? relative(row.updatedAt, now) : day(row.updatedAt, false, now)}
                      </time>
                    </td>
                    <td data-label="URL">
                      {row.url ? (
                        <a class="dt-url" href={row.url} target="_blank" rel="noopener noreferrer" title={row.url}>
                          Open
                          <IconExternal />
                          <span class="sr-only"> {row.url} in a new tab</span>
                        </a>
                      ) : (
                        <span class="muted">—</span>
                      )}
                    </td>
                    <td data-label="Actions" class="dt-act">
                      <div class="dt-actions">
                        {power ? <ActionButton action={power} pendingId={p?.id ?? null} blocked={Boolean(p)} onRun={(a) => run(row, a)} size="sm" icon={power.id === 'stop' ? <IconPower /> : <IconPlay />} /> : null}
                        <a class="btn sm" href={`/deploy/${encodeURIComponent(row.id)}`} aria-label={`Open ${row.name}`}>
                          View →
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {result.matched === 0 ? (
          <div class="dl-empty" role="status">
            <strong>No deployments match.</strong>
            <p>{query.search ? `Nothing matches “${query.search}”` : 'Nothing has this status'}{query.status !== 'all' ? ` in ${STATUS_FILTERS[query.status].label.toLowerCase()}` : ''}.</p>
            <button type="button" class="btn sm" onClick={() => set({ search: '', status: 'all' })}>
              Clear filters
            </button>
          </div>
        ) : null}

        <footer class="dl-foot">
          <span>
            {result.matched ? `${first}–${last} of ${result.matched}` : '0 results'}
            {result.matched !== result.total ? ` (filtered from ${result.total})` : ''}
          </span>
          {result.pages > 1 ? (
            <nav class="pager" aria-label="Pages">
              <button type="button" class="btn sm" disabled={result.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>
                ← Prev
              </button>
              <span class="mono">
                {result.page} / {result.pages}
              </span>
              <button type="button" class="btn sm" disabled={result.page >= result.pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>
                Next →
              </button>
            </nav>
          ) : null}
        </footer>
      </section>

      <Overlay
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.action.confirm?.title ?? ''}
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
                  const { row, action } = confirm
                  setConfirm(null)
                  void runnerFor(row.id).run(action.id)
                }}
              >
                {confirm.action.confirm?.confirmLabel}
              </button>
            </>
          ) : null
        }
      >
        <p class="confirm-body">{confirm?.action.confirm?.body}</p>
      </Overlay>
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
