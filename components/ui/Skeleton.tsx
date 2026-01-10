import { HTMLAttributes, forwardRef } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  shimmer?: boolean
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', width, height, shimmer = true, className = '', style, ...props }, ref) => {
    const baseStyles = 'bg-[var(--bg-muted)]'
    const shimmerStyles = shimmer ? 'relative overflow-hidden' : 'animate-pulse'

    const variants = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${shimmerStyles} ${variants[variant]} ${className}`}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      >
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        )}
      </div>
    )
  }
)

Skeleton.displayName = 'Skeleton'

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton height={24} width={80} />
        <Skeleton height={24} width={60} />
      </div>
      <Skeleton height={20} width="60%" />
      <Skeleton height={40} width="100%" />
      <div className="flex justify-between">
        <Skeleton height={14} width={120} />
        <Skeleton height={14} width={60} />
      </div>
    </div>
  )
}

function SkeletonReportCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton height={24} width={80} />
        <Skeleton height={24} width={70} />
        <Skeleton height={24} width={50} />
      </div>
      <Skeleton height={16} width="95%" />
      <Skeleton height={16} width="75%" />
      <div className="flex justify-between pt-1">
        <Skeleton height={14} width={140} />
        <Skeleton height={14} width={60} />
      </div>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4">
      <Skeleton height={24} width="40%" className="mb-4" />
      <div className="space-y-2">
        <Skeleton height={200} width="100%" />
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <Skeleton height={16} width={60} />
        <Skeleton height={16} width={60} />
        <Skeleton height={16} width={60} />
      </div>
    </div>
  )
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton height={32} width={60} />
              <Skeleton height={14} width={80} />
            </div>
            <Skeleton height={40} width={40} variant="circular" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonMap() {
  return (
    <div className="w-full h-full bg-[var(--bg-muted)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--info-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-sm">Loading map...</p>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonReportCard, SkeletonChart, SkeletonStats, SkeletonMap }
export type { SkeletonProps }
