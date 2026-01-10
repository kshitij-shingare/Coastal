'use client'

import { HTMLAttributes } from 'react'

interface ShimmerProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export function Shimmer({
  width = '100%',
  height = 20,
  rounded = 'md',
  className = '',
  ...props
}: ShimmerProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  return (
    <div
      className={`relative overflow-hidden bg-[var(--bg-muted)] ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

// Preset shimmer components
export function ShimmerText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          height={16}
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  )
}

export function ShimmerAvatar({ size = 40 }: { size?: number }) {
  return <Shimmer width={size} height={size} rounded="full" />
}

export function ShimmerButton({ width = 100, height = 36 }: { width?: number; height?: number }) {
  return <Shimmer width={width} height={height} rounded="lg" />
}
