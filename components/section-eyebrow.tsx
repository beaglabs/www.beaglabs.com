import { cn } from '@/lib/utils'

export function SectionEyebrow({
  children,
  className,
  number,
}: {
  children: React.ReactNode
  className?: string
  number?: string
}) {
  return (
    <div className={cn('mb-3 flex items-center gap-3', className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
        {children}
      </span>
      {number && (
        <>
          <span className="block h-px flex-1 max-w-[40px] bg-[#111]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">
            {number}
          </span>
        </>
      )}
    </div>
  )
}
