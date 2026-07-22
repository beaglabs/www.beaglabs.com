import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'nb-card bg-white flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
    >
      <div className="w-14 h-14 bg-[var(--secondary)] border-2 border-black flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-md">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
