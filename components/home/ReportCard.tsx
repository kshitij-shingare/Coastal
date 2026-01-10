'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ConfidenceBadge, VerifiedBadge, FreshnessIndicator } from '@/components/ui/ConfidenceBadge'
import { hazardTypes } from '@/data/hazardTypes'
import type { DummyReport } from '@/data/dummyReports'

interface ReportCardProps {
  report: DummyReport
}

function ReportCardComponent({ report }: ReportCardProps) {
  const hazard = hazardTypes.find((h) => h.id === report.hazardType)

  const severityVariant = {
    high: 'alert' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  }

  return (
    <Card
      padding="md"
      className="card-interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--info-blue)]"
      tabIndex={0}
      role="article"
      aria-label={`${hazard?.name} report at ${report.location}`}
    >
      {/* Header with badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge
          variant={severityVariant[report.severity]}
          size="sm"
          style={{ backgroundColor: hazard?.color + '20', color: hazard?.color }}
        >
          {hazard?.name}
        </Badge>
        
        {/* Trust signals */}
        {report.confidence >= 85 && <VerifiedBadge />}
        <ConfidenceBadge confidence={report.confidence} size="sm" />
        
        {report.hasMedia && (
          <span className="text-[var(--text-secondary)]" title="Has media evidence">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--text-primary)] mb-3 line-clamp-2">
        {report.summary}
      </p>

      {/* Footer with location and freshness */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>{report.location}, {report.region}</span>
        </div>
        <FreshnessIndicator timestamp={report.timestamp} />
      </div>
    </Card>
  )
}

export const ReportCard = memo(ReportCardComponent)
