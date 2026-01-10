'use client'

import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { NoVerificationHistory } from '@/components/ui/EmptyState'
import { FreshnessIndicator } from '@/components/ui/ConfidenceBadge'
import { useRecentVerifications } from '@/store/useReportStore'

function VerificationHistoryComponent() {
  const verifications = useRecentVerifications(5)

  const statusConfig = {
    verified: { variant: 'safe' as const, label: 'Verified' },
    uncertain: { variant: 'warning' as const, label: 'Uncertain' },
    likely_false: { variant: 'alert' as const, label: 'Likely False' },
  }

  const inputTypeIcons = {
    text: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    link: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    screenshot: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Verifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verifications.length === 0 ? (
          <NoVerificationHistory />
        ) : (
          <div className="space-y-3">
            {verifications.map((verification, index) => {
              const config = statusConfig[verification.status]
              return (
                <div
                  key={verification.id}
                  className="flex items-start gap-3 p-3 bg-[var(--bg-muted)] rounded-lg transition-all hover:bg-gray-100 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-[var(--text-secondary)] mt-0.5 flex-shrink-0">
                    {inputTypeIcons[verification.inputType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {verification.inputContent.slice(0, 50)}
                      {verification.inputContent.length > 50 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={config.variant} className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {verification.confidence}%
                      </span>
                    </div>
                  </div>
                  <FreshnessIndicator timestamp={verification.timestamp} />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const VerificationHistory = memo(VerificationHistoryComponent)
