'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { hazardTypes } from '@/data/hazardTypes'

interface MapHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function MapHelp({ isOpen, onClose }: MapHelpProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    modalRef.current?.focus()

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        tabIndex={-1}
        className="fixed z-[1001] bg-[var(--bg-card)] shadow-xl rounded-xl max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="help-title" className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Use the Safety Map
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Interactive guide to understanding hazard information
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
              aria-label="Close help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Map Controls */}
          <section className="mb-5">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Map Controls
            </h3>
            <div className="bg-[var(--bg-muted)] rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-lg">🖱️</span>
                <span><strong>Scroll</strong> to zoom in/out</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">👆</span>
                <span><strong>Click & drag</strong> to pan around</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <span><strong>Click markers</strong> to see hazard details</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📱</span>
                <span><strong>Pinch</strong> to zoom on mobile</span>
              </div>
            </div>
          </section>

          {/* Understanding Markers */}
          <section className="mb-5">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Hazard Markers
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Colored dots represent different types of coastal hazards:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {hazardTypes.map((hazard) => (
                <div key={hazard.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: hazard.color }}
                  />
                  <span>{hazard.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Risk Zones */}
          <section className="mb-5">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Risk Zones (Colored Circles)
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Transparent circles show the affected area around each hazard:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-4 rounded bg-red-500/40 border border-red-500" />
                <span><strong>Red</strong> - High risk, immediate danger</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-4 rounded bg-amber-500/40 border border-amber-500" />
                <span><strong>Orange</strong> - Medium risk, use caution</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-4 rounded bg-yellow-500/40 border border-yellow-500" />
                <span><strong>Yellow</strong> - Low risk, stay aware</span>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="mb-5">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              Using Filters
            </h3>
            <div className="bg-[var(--bg-muted)] rounded-lg p-3 space-y-2 text-sm">
              <p>Click the <strong>Filters</strong> button (top-left) to:</p>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                <li>Show/hide specific hazard types</li>
                <li>Adjust minimum confidence level</li>
                <li>Filter by time range</li>
              </ul>
            </div>
          </section>

          {/* Tips */}
          <section className="mb-5">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">💡</span>
              Pro Tips
            </h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Zoom in to see individual hazard locations clearly</li>
              <li>• Click on a marker to get safety recommendations</li>
              <li>• Use filters to focus on hazards that affect you</li>
              <li>• Check the legend (bottom-right) for quick reference</li>
            </ul>
          </section>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Got it, start exploring
          </Button>
        </div>
      </div>
    </>
  )
}
