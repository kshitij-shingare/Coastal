'use client'

import { memo } from 'react'
import { ReportCard } from './ReportCard'
import { SkeletonReportCard } from '@/components/ui/Skeleton'
import { NoReportsFound } from '@/components/ui/EmptyState'
import type { DummyReport } from '@/data/dummyReports'

interface ReportFeedProps {
  reports: DummyReport[]
  isLoading?: boolean
  minConfidence?: number
  onClearFilters?: () => void
}

function ReportFeedComponent({
  reports,
  isLoading = false,
  minConfidence = 75,
  onClearFilters,
}: ReportFeedProps) {
  const filteredReports = reports
    .filter((r) => r.confidence >= minConfidence)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="heading-m">Verified Reports</h2>
        </div>
        <div className="space-y-3 stagger-children">
          {[1, 2, 3].map((i) => (
            <SkeletonReportCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="heading-m">Verified Reports</h2>
        <span className="text-sm text-[var(--text-secondary)]">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredReports.length === 0 ? (
        <NoReportsFound onClearFilters={onClearFilters} />
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report, index) => (
            <div
              key={report.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ReportCard report={report} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const ReportFeed = memo(ReportFeedComponent)
