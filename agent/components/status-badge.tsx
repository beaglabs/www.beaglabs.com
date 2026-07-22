import { cn, statusDot, statusColor } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'nb-chip text-xs capitalize',
        statusColor(status),
        className
      )}
    >
      <span className={cn('inline-block w-2 h-2 rounded-full mr-2', statusDot(status))} />
      {status}
    </span>
  )
}
