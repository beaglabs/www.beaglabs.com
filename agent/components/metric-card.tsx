import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('nb-card bg-white p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {label}
          </p>
          <p className="text-3xl font-extrabold mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <p
          className={cn(
            'text-xs font-medium mt-2',
            changeType === 'positive' && 'text-green-600',
            changeType === 'negative' && 'text-red-600',
            changeType === 'neutral' && 'text-[var(--muted-foreground)]'
          )}
        >
          {change}
        </p>
      )}
    </div>
  )
}
