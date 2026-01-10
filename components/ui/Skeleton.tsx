import { HTMLAttributes, forwardRef } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', width, height, className = '', style, ...props }, ref) => {
    const baseStyles = 'animate-pulse bg-[var(--bg-muted)]'

    const variants = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4 space-y-3">
      <Skeleton height={20} width="60%" />
      <Skeleton height={40} width="40%" />
      <Skeleton height={16} width="80%" />
    </div>
  )
}

function SkeletonReportCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton height={24} width={80} />
        <Skeleton height={24} width={60} />
      </div>
      <Skeleton height={16} width="90%" />
      <Skeleton height={16} width="70%" />
      <div className="flex justify-between">
        <Skeleton height={14} width={100} />
        <Skeleton height={14} width={80} />
      </div>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-soft)] p-4">
      <Skeleton height={24} width="40%" className="mb-4" />
      <Skeleton height={200} width="100%" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonReportCard, SkeletonChart }
export type { SkeletonProps }
