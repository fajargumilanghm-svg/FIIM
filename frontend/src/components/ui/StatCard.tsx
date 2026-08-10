import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'muted'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: Tone
  href?: string
  hint?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', href, hint }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {href && (
          <ArrowRight
            className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground/80">{hint}</p>}
    </>
  )

  const base = 'rounded-xl border border-border bg-card p-5 shadow-sm'

  if (href) {
    return (
      <Link to={href} className={cn('group transition-shadow hover:shadow-md', base)}>
        {inner}
      </Link>
    )
  }
  return <div className={base}>{inner}</div>
}
