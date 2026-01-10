'use client'

import { Tooltip } from './Tooltip'

interface ConfidenceBadgeProps {
  confidence: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ConfidenceBadge({
  confidence,
  showLabel = true,
  size = 'md',
}: ConfidenceBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' }
    if (score >= 70) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' }
    return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' }
  }

  const colors = getColor(confidence)
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <Tooltip content="AI confidence reflects analysis of consistency, evidence, and source reliability">
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${colors.bg} ${colors.text} ${sizeClasses}
        `}
      >
        {/* Verified icon for high confidence */}
        {confidence >= 85 && (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        {showLabel && <span>{confidence}%</span>}
        {!showLabel && (
          <div className="w-8 h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div className={`h-full ${colors.bar}`} style={{ width: `${confidence}%` }} />
          </div>
        )}
      </div>
    </Tooltip>
  )
}

// Verified badge for reports
export function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <Tooltip content="This report has been verified by AI analysis">
      <span
        className={`
          inline-flex items-center gap-1 text-xs font-medium
          text-green-700 bg-green-100 px-2 py-0.5 rounded-full
          ${className}
        `}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        AI Verified
      </span>
    </Tooltip>
  )
}

// Data freshness indicator
export function FreshnessIndicator({ timestamp }: { timestamp: string }) {
  const getTimeAgo = (ts: string) => {
    const now = new Date()
    const date = new Date(ts)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return { text: 'Just now', fresh: true }
    if (seconds < 3600) return { text: `${Math.floor(seconds / 60)}m ago`, fresh: true }
    if (seconds < 86400) return { text: `${Math.floor(seconds / 3600)}h ago`, fresh: seconds < 21600 }
    return { text: `${Math.floor(seconds / 86400)}d ago`, fresh: false }
  }

  const { text, fresh } = getTimeAgo(timestamp)

  return (
    <span
      className={`
        inline-flex items-center gap-1 text-xs
        ${fresh ? 'text-green-600' : 'text-[var(--text-secondary)]'}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${fresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      {text}
    </span>
  )
}
