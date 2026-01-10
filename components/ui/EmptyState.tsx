'use client'

import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'compact'
}

const defaultIcons = {
  reports: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  map: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  history: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${isCompact ? 'py-6 px-4' : 'py-12 px-6'}
      `}
    >
      {icon && (
        <div className={`text-[var(--text-secondary)] opacity-40 ${isCompact ? 'mb-3' : 'mb-4'}`}>
          {icon}
        </div>
      )}
      <h3
        className={`
          font-semibold text-[var(--text-primary)]
          ${isCompact ? 'text-sm mb-1' : 'text-lg mb-2'}
        `}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`
            text-[var(--text-secondary)] max-w-sm
            ${isCompact ? 'text-xs' : 'text-sm'}
          `}
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          size={isCompact ? 'sm' : 'md'}
          className={isCompact ? 'mt-3' : 'mt-4'}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Preset empty states
export function NoReportsFound({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title="No reports found"
      description="Try adjusting your filters or check back later for new reports."
      action={onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
    />
  )
}

export function NoVerificationHistory() {
  return (
    <EmptyState
      icon={defaultIcons.history}
      title="No verification history"
      description="Your recent social media verifications will appear here."
      variant="compact"
    />
  )
}

export function NoHighRiskZones() {
  return (
    <EmptyState
      icon={defaultIcons.map}
      title="No high-risk zones"
      description="Great news! There are currently no high-risk areas in your region."
      variant="compact"
    />
  )
}
