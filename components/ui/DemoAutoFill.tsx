'use client'

import { isDemoMode, demoReportData } from '@/lib/demoMode'
import { Button } from './Button'

interface DemoAutoFillProps {
  onFill: (data: typeof demoReportData) => void
}

export function DemoAutoFill({ onFill }: DemoAutoFillProps) {
  if (!isDemoMode) return null

  return (
    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-sm text-purple-700 font-medium">
            Demo Mode: Auto-fill with sample data
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onFill(demoReportData)}
          aria-label="Auto-fill form with demo data"
        >
          Auto-Fill
        </Button>
      </div>
    </div>
  )
}
