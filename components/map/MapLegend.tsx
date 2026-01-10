'use client'

import { useState } from 'react'
import { hazardTypes } from '@/data/hazardTypes'

export function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const riskLevels = [
    { level: 'High Risk', color: '#EF4444', opacity: 0.4 },
    { level: 'Medium Risk', color: '#F59E0B', opacity: 0.35 },
    { level: 'Low Risk', color: '#FBBF24', opacity: 0.3 },
  ]

  return (
    <div className="absolute bottom-4 right-4 z-[500]">
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden mb-2 ml-auto flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] rounded-lg shadow-md text-sm font-medium"
        aria-expanded={!isCollapsed}
        aria-controls="map-legend"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Legend
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Legend panel */}
      <div
        id="map-legend"
        className={`bg-[var(--bg-card)] rounded-lg shadow-lg p-4 transition-all ${
          isCollapsed ? 'hidden lg:block' : 'block'
        }`}
      >
        <h3 className="text-sm font-semibold mb-3">Map Legend</h3>

        {/* Hazard Types */}
        <div className="mb-4">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Hazard Types</p>
          <div className="space-y-1.5">
            {hazardTypes.map((hazard) => (
              <div key={hazard.id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: hazard.color }}
                />
                <span className="text-xs">{hazard.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Levels */}
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2">Risk Zones</p>
          <div className="space-y-1.5">
            {riskLevels.map((risk) => (
              <div key={risk.level} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: risk.color, opacity: risk.opacity + 0.3 }}
                />
                <span className="text-xs">{risk.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
