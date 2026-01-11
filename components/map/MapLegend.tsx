'use client'

import { useState } from 'react'
import { hazardTypes } from '@/data/hazardTypes'

export function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const riskLevels = [
    { level: 'High Risk', color: '#EF4444', description: 'Immediate danger' },
    { level: 'Medium Risk', color: '#F59E0B', description: 'Use caution' },
    { level: 'Low Risk', color: '#FBBF24', description: 'Stay aware' },
  ]

  return (
    <div className="absolute bottom-4 right-4 z-[500]">
      {/* Collapsed state - just show toggle */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] rounded-lg shadow-lg text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors"
          aria-expanded={false}
          aria-controls="map-legend"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Legend
        </button>
      ) : (
        /* Expanded legend panel */
        <div
          id="map-legend"
          className="bg-[var(--bg-card)] rounded-lg shadow-lg overflow-hidden w-56"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-muted)] border-b border-[var(--border-soft)]">
            <h3 className="text-sm font-semibold">Map Legend</h3>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded hover:bg-[var(--bg-card)] transition-colors"
              aria-label="Collapse legend"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3">
            {/* Hazard Types */}
            <div className="mb-3">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Hazard Types
              </p>
              <div className="space-y-1.5">
                {hazardTypes.map((hazard) => (
                  <div key={hazard.id} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0"
                      style={{ backgroundColor: hazard.color }}
                    />
                    <span className="text-xs">{hazard.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border-soft)] my-3" />

            {/* Risk Zones */}
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Risk Zones
              </p>
              <div className="space-y-1.5">
                {riskLevels.map((risk) => (
                  <div key={risk.level} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded border shrink-0"
                      style={{ 
                        backgroundColor: risk.color + '40',
                        borderColor: risk.color 
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{risk.level}</span>
                      <span className="text-xs text-[var(--text-secondary)] ml-1">
                        - {risk.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
              <p className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                <span className="text-blue-500">💡</span>
                Click markers for details
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
