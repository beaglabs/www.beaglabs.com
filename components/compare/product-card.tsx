import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ProductLogo } from '@/components/compare/product-logo'
import { CATEGORY_LABELS, hasSourcedAnswer, logoUrl, productHref, type Platform } from '@/lib/compare'

/** Compact profile card used wherever a platform is listed. The whole card links to its profile. */
export function ProductCard({ platform }: { platform: Platform }) {
  const cells = Object.values(platform.cells)
  const verified = cells.filter((cell) => hasSourcedAnswer(cell.status)).length
  const tags = [
    ...platform.cells.deployment.categories,
    ...platform.cells.licensing.categories,
  ].filter((tag) => tag !== 'unknown')

  return (
    <Link
      href={productHref(platform)}
      className="group flex h-full flex-col border-[3px] border-[#1a1714] bg-[#fffaf3] p-5 shadow-[5px_5px_0_#1a1714] transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#e5632f] motion-reduce:transform-none"
    >
      <div className="flex items-start gap-4">
        <ProductLogo name={platform.name} src={logoUrl(platform)} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-extrabold leading-tight tracking-[-0.03em]">{platform.name}</h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f5a4b]">{platform.vendor}</p>
        </div>
        <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-4 text-[13px] font-medium leading-[1.6] text-[#4a3d33]">{platform.summary}</p>
      {tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag} className="border border-[#1a1714] bg-[#fdeee1] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em]">{CATEGORY_LABELS[tag] ?? tag}</li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex justify-between font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#5b4a3d]">
          <span>Evidence coverage</span>
          <span>{verified}/{cells.length}</span>
        </div>
        <div role="img" aria-label={`${verified} of ${cells.length} attributes with a sourced answer`} className="h-2 border-[1.5px] border-[#1a1714] bg-[#fffaf3]">
          <div className="h-full bg-[#e5632f]" style={{ width: `${(verified / cells.length) * 100}%` }} />
        </div>
      </div>
    </Link>
  )
}
