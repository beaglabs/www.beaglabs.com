"use client"

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type CrmColumn<T> = {
  id: string
  label: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  className?: string
}

export function CrmDataTable<T>({
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = 'Search records…',
  empty = 'No records yet.',
  onRowClick,
  onDeleteRow,
  deleteLabel,
  pageSize = 12,
}: {
  rows: T[]
  columns: CrmColumn<T>[]
  rowKey: (row: T) => string
  searchText: (row: T) => string
  searchPlaceholder?: string
  empty?: string
  onRowClick?: (row: T) => void
  onDeleteRow?: (row: T) => Promise<void> | void
  deleteLabel?: (row: T) => string
  pageSize?: number
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(0)
  const [compact, setCompact] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let next = needle ? rows.filter((row) => searchText(row).toLowerCase().includes(needle)) : [...rows]
    if (sort) {
      const column = columns.find((item) => item.id === sort.id)
      if (column?.sortValue) {
        next.sort((a, b) => {
          const av = column.sortValue?.(a)
          const bv = column.sortValue?.(b)
          const aValue = av ?? ''
          const bValue = bv ?? ''
          const compared = typeof aValue === 'number' && typeof bValue === 'number'
            ? aValue - bValue
            : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
          return sort.direction === 'asc' ? compared : -compared
        })
      }
    }
    return next
  }, [columns, query, rows, searchText, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  const toggleSort = (column: CrmColumn<T>) => {
    if (!column.sortValue) return
    setPage(0)
    setSort((current) => current?.id === column.id
      ? { id: column.id, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { id: column.id, direction: 'asc' })
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 border-b-[3px] border-[#111] bg-[#FAFAF9] p-4 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 border-2 border-[#111] bg-white px-3 shadow-[3px_3px_0_#111]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0) }}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[13px] font-semibold outline-none placeholder:text-[#999]"
          />
        </label>
        <button
          type="button"
          onClick={() => setCompact((value) => !value)}
          className="nb-btn-white inline-flex items-center justify-center gap-2 px-3 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.08em]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> {compact ? 'Comfortable' : 'Compact'}
        </button>
      </div>

      <Table className="min-w-[860px]">
        <TableHeader className="bg-[#111] text-white">
          <TableRow className="border-0 hover:bg-[#111]">
            {columns.map((column) => {
              const active = sort?.id === column.id
              return (
                <TableHead key={column.id} className="h-11 border-r border-white/20 px-4 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white last:border-r-0">
                  {column.sortValue ? (
                    <button type="button" onClick={() => toggleSort(column)} className="inline-flex items-center gap-2">
                      {column.label}
                      {active ? (sort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-60" />}
                    </button>
                  ) : column.label}
                </TableHead>
              )
            })}
            {onDeleteRow ? <TableHead className="h-11 w-[86px] px-4 text-right font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length ? visible.map((row) => (
            <TableRow
              key={rowKey(row)}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') onRowClick(row) } : undefined}
              className={`border-b-2 border-[#111] bg-white hover:bg-[#fff1e9] ${onRowClick ? 'cursor-pointer focus:bg-[#fff1e9] focus:outline-none' : ''}`}
            >
              {columns.map((column) => (
                <TableCell key={column.id} className={`${compact ? 'px-4 py-2' : 'px-4 py-4'} whitespace-normal ${column.className ?? ''}`}>
                  {column.render(row)}
                </TableCell>
              ))}
              {onDeleteRow ? <TableCell className={`${compact ? 'px-4 py-2' : 'px-4 py-4'} text-right`}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Delete ${deleteLabel?.(row) ?? 'record'}`}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#111] bg-[#fee2e2] shadow-[2px_2px_0_#111] hover:bg-[#fecaca]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-none border-[3px] border-[#111] bg-white p-0 shadow-[7px_7px_0_#111]">
                    <AlertDialogHeader className="border-b-[3px] border-[#111] bg-[#fee2e2] p-6">
                      <AlertDialogTitle>Delete {deleteLabel?.(row) ?? 'record'}?</AlertDialogTitle>
                      <AlertDialogDescription>This permanently removes this record and its owned CRM links. Protected licensing or commercial dependencies will block deletion.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="p-5">
                      <AlertDialogCancel className="nb-btn-white rounded-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(event) => { event.stopPropagation(); void onDeleteRow(row) }}
                        className="rounded-none border-[3px] border-[#111] bg-[#ef4444] px-5 py-2.5 font-mono text-[9px] font-black uppercase text-white shadow-[3px_3px_0_#111] hover:bg-[#dc2626]"
                      >
                        Delete permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell> : null}
            </TableRow>
          )) : (
            <TableRow className="border-b-0">
              <TableCell colSpan={columns.length + (onDeleteRow ? 1 : 0)} className="h-32 text-center text-[13px] font-semibold text-[#777]">{empty}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t-[3px] border-[#111] bg-[#FAFAF9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[9px] font-black uppercase tracking-[0.1em] text-[#666]">
          {filtered.length} record{filtered.length === 1 ? '' : 's'} · page {currentPage + 1} / {pageCount}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="nb-btn-white inline-flex items-center gap-1 px-3 py-2 font-mono text-[9px] font-black uppercase disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /> Previous</button>
          <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="nb-btn-white inline-flex items-center gap-1 px-3 py-2 font-mono text-[9px] font-black uppercase disabled:opacity-40">Next <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  )
}
