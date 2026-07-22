import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-8', className)}>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        {description && (
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

interface PageHeaderActionProps {
  children: React.ReactNode
}

export function PageHeaderAction({ children }: PageHeaderActionProps) {
  return <div className="flex items-center gap-3">{children}</div>
}
