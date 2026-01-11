'use client'

import type { TimeRange } from '@/data/dummyAnalytics'

interface TimeFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const options: { value: TimeRange; label: string; shortLabel: string }[] = [
  { value: '24h', label: '24 Hours', shortLabel: '24h' },
  { value: '7d', label: '7 Days', shortLabel: '7d' },
  { value: '30d', label: '30 Days', shortLabel: '30d' },
]

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  return (
    <div className="flex gap-1 p-1 bg-[var(--bg-muted)] rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
            value === option.value
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-pressed={value === option.value}
        >
          <span className="sm:hidden">{option.shortLabel}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
