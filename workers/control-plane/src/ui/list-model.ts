import type { DeploymentStatus, DeploymentSummary } from './types'

/** The deployments table: search, status filter, sort and pagination as one pure function. */

export const STATUS_FILTERS = {
  all: { label: 'All', statuses: null },
  live: { label: 'Running', statuses: ['running'] },
  progress: { label: 'In progress', statuses: ['setup', 'provisioning', 'starting', 'deleting'] },
  stopped: { label: 'Stopped', statuses: ['stopped'] },
  attention: { label: 'Needs attention', statuses: ['failed', 'suspended'] },
} as const satisfies Record<string, { label: string; statuses: readonly DeploymentStatus[] | null }>

export type StatusFilter = keyof typeof STATUS_FILTERS
export type SortKey = 'name' | 'status' | 'provider' | 'createdAt' | 'updatedAt'
export type SortDir = 'asc' | 'desc'

export interface ListQuery {
  search: string
  status: StatusFilter
  sort: SortKey
  dir: SortDir
  page: number
  pageSize: number
}

export const DEFAULT_QUERY: ListQuery = { search: '', status: 'all', sort: 'updatedAt', dir: 'desc', page: 1, pageSize: 10 }

/** Problems first, then work in flight, then live, then stopped. */
const STATUS_RANK: Record<DeploymentStatus, number> = { failed: 0, suspended: 1, provisioning: 2, starting: 2, setup: 3, deleting: 4, running: 5, stopped: 6, deleted: 7 }

const haystack = (row: DeploymentSummary) => [row.name, row.url ?? '', row.provider, row.region ?? '', row.configuration ?? '', row.statusLabel, row.healthLabel, row.environment, row.id].join(' ').toLowerCase()

export const matchesSearch = (row: DeploymentSummary, search: string) => {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const text = haystack(row)
  return terms.every((term) => text.includes(term))
}

export const matchesStatus = (row: DeploymentSummary, status: StatusFilter) => {
  const statuses = STATUS_FILTERS[status].statuses as readonly DeploymentStatus[] | null
  return !statuses || statuses.includes(row.status)
}

const compare = (a: DeploymentSummary, b: DeploymentSummary, key: SortKey) => {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'provider':
      return a.provider.localeCompare(b.provider) || (a.region ?? '').localeCompare(b.region ?? '')
    case 'status':
      return STATUS_RANK[a.status] - STATUS_RANK[b.status]
    case 'createdAt':
      return Date.parse(a.createdAt) - Date.parse(b.createdAt)
    case 'updatedAt':
      return Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
  }
}

export interface ListResult {
  rows: DeploymentSummary[]
  /** Rows matching search and filter, before paging. */
  matched: number
  total: number
  page: number
  pages: number
  counts: Record<StatusFilter, number>
}

export const queryDeployments = (all: readonly DeploymentSummary[], query: ListQuery): ListResult => {
  const searched = all.filter((row) => matchesSearch(row, query.search))
  const counts = Object.fromEntries((Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => [key, searched.filter((row) => matchesStatus(row, key)).length])) as Record<StatusFilter, number>
  const matched = searched.filter((row) => matchesStatus(row, query.status))
  const direction = query.dir === 'asc' ? 1 : -1
  // Stable: ties keep name order.
  const sorted = [...matched].sort((a, b) => compare(a, b, query.sort) * direction || a.name.localeCompare(b.name))
  const pageSize = Math.max(1, query.pageSize)
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = Math.min(Math.max(1, query.page), pages)
  return { rows: sorted.slice((page - 1) * pageSize, page * pageSize), matched: sorted.length, total: all.length, page, pages, counts }
}

/** Replace rows in place by id (polling), keeping the order of what is shown and adding new ones. */
export const upsertRows = (current: readonly DeploymentSummary[], incoming: readonly DeploymentSummary[]) => {
  const next = new Map(current.map((row) => [row.id, row]))
  for (const row of incoming) {
    const shown = next.get(row.id)
    if (!shown || row.version >= shown.version) next.set(row.id, row)
  }
  // Gone from the server (deleted) → gone here.
  const ids = new Set(incoming.map((row) => row.id))
  return [...next.values()].filter((row) => ids.has(row.id))
}

/** One row came back from an action: replace it if it is not older than what is shown. */
export const replaceRow = (current: readonly DeploymentSummary[], row: DeploymentSummary) => current.map((shown) => (shown.id === row.id && row.version >= shown.version ? row : shown))
