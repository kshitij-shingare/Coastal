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
  const locationName = report.locationName || report.location
  const lat = report.lat ?? report.coordinates?.lat ?? 0
  const lng = report.lng ?? report.coordinates?.lng ?? 0

  const severityConfig = {
    high: { 
      variant: 'alert' as const, 
      label: 'High Risk',
      icon: '🚨',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    medium: { 
      variant: 'warning' as const, 
      label: 'Medium Risk',
      icon: '⚠️',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    low: { 
      variant: 'info' as const, 
      label: 'Low Risk',
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
  }

  const severity = severityConfig[report.severity]

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

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
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[75vh] overflow-y-auto
          lg:bottom-auto lg:top-4 lg:right-4 lg:left-auto lg:w-96 lg:rounded-xl lg:max-h-[calc(100vh-2rem)]"
      >
        {/* Handle bar for mobile */}
        <div className="lg:hidden flex justify-center py-2">
          <div className="w-10 h-1 bg-[var(--border-soft)] rounded-full" />
        </div>

        <div className="p-4 lg:p-5">
          {/* Severity Banner */}
          <div className={`${severity.bgColor} ${severity.borderColor} border rounded-lg p-3 mb-4 flex items-center gap-3`}>
            <span className="text-2xl">{severity.icon}</span>
            <div>
              <p className="font-semibold text-sm">{severity.label}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {report.severity === 'high' ? 'Avoid this area if possible' : 
                 report.severity === 'medium' ? 'Exercise caution' : 'Stay informed'}
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="zone-title" className="text-lg font-semibold mb-1">
                {locationName}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={severity.variant}
                  style={{ backgroundColor: hazard?.color + '20', color: hazard?.color }}
                >
                  {hazard?.name}
                </Badge>
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTimestamp(report.timestamp)}
                </span>
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

          {/* AI Confidence */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">AI Confidence</span>
              <span className={`text-sm font-bold ${
                report.confidence >= 85 ? 'text-green-600' : 
                report.confidence >= 70 ? 'text-amber-600' : 'text-gray-600'
              }`}>
                {report.confidence}%
              </span>
            </div>
            <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  report.confidence >= 85 ? 'bg-green-500' : 
                  report.confidence >= 70 ? 'bg-amber-500' : 'bg-gray-400'
                }`}
                style={{ width: `${report.confidence}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {report.confidence >= 85 ? 'High confidence - verified by multiple sources' : 
               report.confidence >= 70 ? 'Moderate confidence - additional verification recommended' : 
               'Lower confidence - treat as preliminary report'}
            </p>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              AI Analysis
            </h3>
            <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-muted)] rounded-lg p-3">
              {report.summary}
            </p>
          </div>

          {/* Safety Tips */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Safety Recommendations
            </h3>
            <ul className="space-y-2">
              {tips.slice(0, 4).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-[var(--text-secondary)]">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Location Info */}
          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-muted)] rounded-lg p-2 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>Coordinates: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" className="flex-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Report Update
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
