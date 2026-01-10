'use client'

import { useState } from 'react'
import { hazardTypes } from '@/data/hazardTypes'

interface MapFiltersProps {
  selectedHazards: string[]
  confidenceThreshold: number
  timeRange: string
  onHazardsChange: (hazards: string[]) => void
  onConfidenceChange: (value: number) => void
  onTimeRangeChange: (value: string) => void
}

export function MapFilters({
  selectedHazards,
  confidenceThreshold,
  timeRange,
  onHazardsChange,
  onConfidenceChange,
  onTimeRangeChange,
}: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleHazard = (hazardId: string) => {
    if (selectedHazards.includes(hazardId)) {
      onHazardsChange(selectedHazards.filter((h) => h !== hazardId))
    } else {
      onHazardsChange([...selectedHazards, hazardId])
    }
  }

  const selectAll = () => onHazardsChange(hazardTypes.map((h) => h.id))
  const clearAll = () => onHazardsChange([])

  return (
    <div className="absolute top-4 left-4 z-[500]">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] rounded-lg shadow-lg text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors"
        aria-expanded={isExpanded}
        aria-controls="map-filters"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {selectedHazards.length < hazardTypes.length && (
          <span className="bg-[var(--info-blue)] text-white text-xs px-1.5 py-0.5 rounded-full">
            {selectedHazards.length}
          </span>
        )}
      </button>

      {/* Filter panel */}
      {isExpanded && (
        <div
          id="map-filters"
          className="mt-2 bg-[var(--bg-card)] rounded-lg shadow-lg p-4 w-72"
        >
          {/* Hazard Types */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Hazard Types</label>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={selectAll}
                  className="text-[var(--info-blue)] hover:underline"
                >
                  All
                </button>
                <span className="text-[var(--text-secondary)]">|</span>
                <button
                  onClick={clearAll}
                  className="text-[var(--info-blue)] hover:underline"
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {hazardTypes.map((hazard) => (
                <label
                  key={hazard.id}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedHazards.includes(hazard.id)}
                    onChange={() => toggleHazard(hazard.id)}
                    className="w-4 h-4 rounded border-[var(--border-soft)] text-[var(--info-blue)] focus:ring-[var(--info-blue)]"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: hazard.color }}
                  />
                  <span className="truncate">{hazard.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2">
              Min. Confidence: {confidenceThreshold}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => onConfidenceChange(Number(e.target.value))}
              className="w-full h-2 bg-[var(--bg-muted)] rounded-lg appearance-none cursor-pointer accent-[var(--info-blue)]"
            />
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="text-sm font-semibold block mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
