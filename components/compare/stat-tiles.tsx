import type { Stat } from '@/lib/compare'

const tile = 'border-[2.5px] border-[#111] bg-white p-4'
const label = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]'

/** Renders each typed stat in the form that suits it: meter, count, tag list or plain text. */
export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className={tile}>
          <dt className={label}>{stat.label}</dt>
          <dd className="mt-3">
            {stat.kind === 'meter' && (
              <>
                <div className="text-[34px] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
                  {stat.value}<span className="text-[18px] text-[#666]"> / {stat.max}</span>
                </div>
                <div role="img" aria-label={`${stat.value} of ${stat.max}`} className="mt-3 h-2.5 border-[1.5px] border-[#111]">
                  <div className="h-full bg-[#ff5f1f]" style={{ width: `${(stat.value / stat.max) * 100}%` }} />
                </div>
                <p className="mt-2 text-[12px] font-medium leading-snug text-[#555]">{stat.note}</p>
              </>
            )}
            {stat.kind === 'count' && (
              <>
                <div className="text-[34px] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{stat.value}</div>
                <p className="mt-2 text-[12px] font-medium leading-snug text-[#555]">{stat.note}</p>
              </>
            )}
            {stat.kind === 'tags' && (
              stat.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {stat.tags.map((tag) => <li key={tag} className="border-[1.5px] border-[#111] bg-[#ffdeca] px-2 py-1 text-[12px] font-bold">{tag}</li>)}
                </ul>
              ) : <span className="text-[13px] font-semibold text-[#555]">Not categorised</span>
            )}
            {stat.kind === 'text' && <span className="text-[15px] font-bold">{stat.value}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
