'use client'

import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { hazardTypes } from '@/data/hazardTypes'
import { safetyTipsByHazard, type MapReport } from '@/data/dummyMapReports'

interface ZoneInfoModalProps {
  report: MapReport | null
  onClose: () => void
}

export function ZoneInfoModal({ report, onClose }: ZoneInfoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!report) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    modalRef.current?.focus()

    return () => document.removeEventListener('keydown', handleEscape)
  }, [report, onClose])

  if (!report) return null

  const hazard = hazardTypes.find((h) => h.id === report.hazardType)
  const tips = safetyTipsByHazard[report.hazardType] || []

  const severityVariant = {
    high: 'alert' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  }

  const confidenceVariant = report.confidence >= 85 ? 'safe' : report.confidence >= 70 ? 'warning' : 'neutral'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000] lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Bottom sheet on mobile, side panel on desktop */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="zone-title"
        tabIndex={-1}
        className="fixed z-[1001] bg-[var(--bg-card)] shadow-xl
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[70vh] overflow-y-auto
          lg:bottom-auto lg:top-4 lg:right-4 lg:left-auto lg:w-96 lg:rounded-xl lg:max-h-[calc(100vh-2rem)]"
      >
        {/* Handle bar for mobile */}
        <div className="lg:hidden flex justify-center py-2">
          <div className="w-10 h-1 bg-[var(--border-soft)] rounded-full" />
        </div>

        <div className="p-4 lg:p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="zone-title" className="heading-m mb-2">
                {report.locationName}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={severityVariant[report.severity]}
                  style={{ backgroundColor: hazard?.color + '20', color: hazard?.color }}
                >
                  {hazard?.name}
                </Badge>
                <Badge variant={severityVariant[report.severity]} size="sm">
                  {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)} Risk
                </Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-[var(--text-secondary)]">AI Confidence:</span>
            <Badge variant={confidenceVariant}>{report.confidence}%</Badge>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">AI Analysis</h3>
            <p className="text-sm text-[var(--text-secondary)]">{report.summary}</p>
          </div>

          {/* Safety Tips */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Safety Recommendations</h3>
            <ul className="space-y-2">
              {tips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <svg className="w-4 h-4 mt-0.5 text-[var(--safe-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Coordinates */}
          <div className="text-xs text-[var(--text-secondary)] mb-4">
            <span>Coordinates: {report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" className="flex-1">
              Report Update
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
