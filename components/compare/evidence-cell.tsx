import Link from 'next/link'
import type { EvidenceCell as Cell, EvidenceStatus } from '@/lib/compare'

const STATUS: Record<EvidenceStatus, { icon: string; className: string }> = {
  Verified: { icon: '✓', className: 'border-[#111] bg-[#111] text-white' },
  'Partially supported': { icon: '◐', className: 'border-[#111] bg-[#ffdeca] text-[#111]' },
  'Not documented': { icon: '?', className: 'border-dashed border-[#111] bg-white text-[#333]' },
  'Not supported': { icon: '×', className: 'border-[#111] bg-[#ff5f1f] text-[#111]' },
}

export function StatusBadge({ status }: { status: EvidenceStatus }) {
  const { icon, className } = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 border-[1.5px] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${className}`}>
      <span aria-hidden="true">{icon}</span>
      {status}
    </span>
  )
}

/** One attribute for one platform: status, neutral summary, and a link into the Claim Ledger. */
export function EvidenceCell({ cell }: { cell: Cell }) {
  return (
    <div className="min-w-0 space-y-2">
      <StatusBadge status={cell.status} />
      <p className="text-[13px] font-medium leading-[1.55] text-[#333]">{cell.value}</p>
      {cell.claimId && (
        <Link
          href={`/claims/${encodeURIComponent(cell.claimId)}`}
          className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#b33d0d] underline decoration-1 underline-offset-2 hover:text-[#111]"
        >
          Source: {cell.claimId} ↗
        </Link>
      )}
      {cell.status === 'Not documented' && cell.checked.length > 0 && (
        <details className="text-[11px] text-[#555]">
          <summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
            {cell.checked.length} source{cell.checked.length === 1 ? '' : 's'} checked
          </summary>
          <ul className="mt-1 space-y-1 break-all">
            {cell.checked.map((url) => (
              <li key={url}>
                <a href={url} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">
                  {url.replace(/^https?:\/\//, '')}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
