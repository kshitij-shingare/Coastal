'use client'

import { ReportCard } from './ReportCard'
import { SkeletonReportCard } from '@/components/ui/Skeleton'
import type { DummyReport } from '@/data/dummyReports'

interface ReportFeedProps {
  reports: DummyReport[]
  isLoading?: boolean
  minConfidence?: number
}

export function ReportFeed({ reports, isLoading = false, minConfidence = 75 }: ReportFeedProps) {
  const filteredReports = reports
    .filter((r) => r.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="heading-m">Verified Reports</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <SkeletonReportCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="heading-m">Verified Reports</h2>
        <span className="text-sm text-[var(--text-secondary)]">
          {filteredReports.length} reports
        </span>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No verified reports match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
