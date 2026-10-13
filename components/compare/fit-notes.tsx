import Link from 'next/link'
import { ATTRIBUTES, type Platform, type PlatformNote } from '@/lib/compare'

const labelFor = (key: string) => ATTRIBUTES.find((attribute) => attribute.key === key)?.label ?? key

/** Fit statements always carry the cell(s) they derive from, so each one can be checked. */
export function FitNotes({ platform, notes, empty }: { platform: Platform; notes: PlatformNote[]; empty: string }) {
  if (notes.length === 0) return empty ? <p className="text-[13px] font-medium text-[#666]">{empty}</p> : null
  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.text} className="text-[14px] font-medium leading-[1.6] text-[#333]">
          {note.text}
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#666]">
            Basis:
            {note.basis.map((key) => {
              const claimId = platform.cells[key].claimId
              return claimId ? (
                <Link key={key} href={`/claims/${encodeURIComponent(claimId)}`} className="text-[#b33d0d] underline underline-offset-2 hover:text-[#111]">
                  {labelFor(key)} ({claimId})
                </Link>
              ) : (
                <span key={key}>{labelFor(key)}</span>
              )
            })}
          </span>
        </li>
      ))}
    </ul>
  )
}
