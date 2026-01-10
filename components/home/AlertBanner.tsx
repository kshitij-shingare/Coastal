'use client'

import { Badge } from '@/components/ui/Badge'

interface AlertBannerProps {
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
}

export function AlertBanner({ severity, title, message }: AlertBannerProps) {
  const severityConfig = {
    high: {
      bg: 'bg-red-50 border-[var(--alert-red)]',
      icon: 'text-[var(--alert-red)]',
      badge: 'alert' as const,
      pulse: true,
    },
    medium: {
      bg: 'bg-amber-50 border-[var(--warning-orange)]',
      icon: 'text-[var(--warning-orange)]',
      badge: 'warning' as const,
      pulse: false,
    },
    low: {
      bg: 'bg-blue-50 border-[var(--info-blue)]',
      icon: 'text-[var(--info-blue)]',
      badge: 'info' as const,
      pulse: false,
    },
  }

  const config = severityConfig[severity]

  return (
    <div
      className={`${config.bg} border-l-4 rounded-lg p-4 md:p-5`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={`${config.icon} flex-shrink-0 mt-0.5`}>
          {config.pulse ? (
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <svg className="relative w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
            <Badge variant={config.badge} size="sm">
              {severity.charAt(0).toUpperCase() + severity.slice(1)} Risk
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        </div>
      </div>
    </div>
  )
}
