'use client'

import Link from 'next/link'
import { useId, useMemo, useState } from 'react'
import {
  ATTRIBUTES,
  CATEGORY_LABELS,
  hasSourcedAnswer,
  logoUrl,
  productHref,
  type AttributeKey,
  type Platform,
} from '@/lib/compare'
import { EvidenceCell } from '@/components/compare/evidence-cell'
import { ProductLogo } from '@/components/compare/product-logo'

interface FilterDef {
  key: AttributeKey
  label: string
  options: string[]
}

const COLUMNS = ATTRIBUTES.filter(({ key }) => key !== 'capabilities')

/** Filterable comparison table. Every cell links to its record in the Claim Ledger. */
export function PlatformMatrix({ platforms, filters }: { platforms: Platform[]; filters: FilterDef[] }) {
  const id = useId()
  const [selected, setSelected] = useState<Partial<Record<AttributeKey, string>>>({})
  const [approvalOnly, setApprovalOnly] = useState(false)

  const visible = useMemo(
    () =>
      platforms.filter((platform) => {
        for (const { key } of filters) {
          const wanted = selected[key]
          if (wanted && !platform.cells[key].categories.includes(wanted)) return false
        }
        if (approvalOnly && !hasSourcedAnswer(platform.cells.humanApproval.status) || platform.cells.humanApproval.status === 'Not supported') return false
        return true
      }),
    [platforms, filters, selected, approvalOnly],
  )

  const active = Object.values(selected).filter(Boolean).length + (approvalOnly ? 1 : 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-4 border-[3px] border-[#111] bg-white p-4">
        {filters.map(({ key, label, options }) => (
          <label key={key} htmlFor={`${id}-${key}`} className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#555]">
            {label}
            <select
              id={`${id}-${key}`}
              value={selected[key] ?? ''}
              onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.value || undefined }))}
              className="min-w-[180px] border-2 border-[#111] bg-white px-3 py-2 text-[13px] font-bold normal-case tracking-normal text-[#111]"
            >
              <option value="">Any</option>
              {options.map((option) => (
                <option key={option} value={option}>{CATEGORY_LABELS[option] ?? option}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex items-center gap-2 border-2 border-[#111] px-3 py-2 text-[13px] font-bold">
          <input type="checkbox" checked={approvalOnly} onChange={(event) => setApprovalOnly(event.target.checked)} className="h-4 w-4 accent-[#ff5f1f]" />
          Human approval documented
        </label>
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelected({})
              setApprovalOnly(false)
            }}
            className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
        <p aria-live="polite" className="ml-auto font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#555]">
          Showing {visible.length} of {platforms.length}
        </p>
      </div>

      <div className="overflow-x-auto border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <caption className="sr-only">Self-hosted AI agent platforms compared by attribute, with a source link on every verified cell</caption>
          <thead>
            <tr className="border-b-[3px] border-[#111] bg-[#fafaf9]">
              <th scope="col" className="sticky left-0 z-10 w-[220px] bg-[#fafaf9] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">Platform</th>
              {COLUMNS.map(({ key, label }) => (
                <th key={key} scope="col" className="min-w-[190px] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#555]">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((platform) => (
              <tr key={platform.slug} className="border-b border-[#bbb] align-top last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-4 align-top">
                  <Link href={productHref(platform)} className="flex items-center gap-3 hover:text-[#b33d0d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff5f1f]">
                    <ProductLogo name={platform.name} src={logoUrl(platform)} size="sm" />
                    <span className="block text-[17px] font-extrabold leading-tight tracking-[-0.02em] underline decoration-1 underline-offset-4">{platform.name}</span>
                  </Link>
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-[#666]">{platform.vendor}</span>
                  {platform.isBeag && <span className="mt-2 inline-block border border-[#111] bg-[#ffdeca] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]">Made by Beag Labs</span>}
                  <span className="mt-2 block text-[12px] font-medium leading-[1.5] text-[#444]">{platform.summary}</span>
                </th>
                {COLUMNS.map(({ key }) => (
                  <td key={key} className="px-4 py-4"><EvidenceCell cell={platform.cells[key]} /></td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-[14px] font-medium text-[#555]">No platform matches every selected filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
