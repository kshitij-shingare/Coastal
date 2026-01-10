'use client'

import { isDemoMode, demoBannerMessage } from '@/lib/demoMode'

export function DemoBanner() {
  if (!isDemoMode) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-purple-600 text-white px-4 py-2 text-center text-sm font-medium"
    >
      <div className="flex items-center justify-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{demoBannerMessage}</span>
      </div>
    </div>
  )
}
