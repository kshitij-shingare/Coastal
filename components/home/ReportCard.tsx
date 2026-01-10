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
      padding="none"
      className="overflow-hidden hover:shadow-md transition-shadow"
      role="article"
      aria-label={`${hazard?.name} report at ${report.location}`}
    >
      {/* Severity indicator bar */}
      <div 
        className="h-1"
        style={{ backgroundColor: hazard?.color || '#6B7280' }}
      />
      
      <div className="p-3 md:p-4">
        {/* Header with badges */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
          <Badge
            variant={severityVariant[report.severity]}
            size="sm"
            className="font-medium text-xs"
            style={{ backgroundColor: hazard?.color + '20', color: hazard?.color }}
          >
            {hazard?.name}
          </Badge>
          
          {/* Trust signals */}
          {report.confidence >= 85 && <VerifiedBadge />}
          <ConfidenceBadge confidence={report.confidence} size="sm" />
          
          {report.hasMedia && (
            <span 
              className="text-[var(--text-secondary)] flex items-center gap-1 text-xs" 
              title="Has media evidence"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Media</span>
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="text-sm text-[var(--text-primary)] mb-2 md:mb-3 line-clamp-2">
          {report.summary}
        </p>

        {/* Footer with location and freshness */}
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1 text-[var(--text-secondary)] min-w-0">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate">{report.location}</span>
            <span className="hidden sm:inline text-[var(--text-secondary)]">• {report.region}</span>
          </div>
          <FreshnessIndicator timestamp={report.timestamp} />
        </div>
      </div>
    </Card>
  )
}

export const ReportCard = memo(ReportCardComponent)
