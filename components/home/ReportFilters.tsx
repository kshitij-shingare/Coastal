'use client'

import { hazardTypes } from '@/data/hazardTypes'
import { regions, timeRanges } from '@/data/dummyReports'

interface ReportFiltersProps {
  selectedHazard: string
  selectedRegion: string
  selectedTime: string
  onHazardChange: (value: string) => void
  onRegionChange: (value: string) => void
  onTimeChange: (value: string) => void
}

export function ReportFilters({
  selectedHazard,
  selectedRegion,
  selectedTime,
  onHazardChange,
  onRegionChange,
  onTimeChange,
}: ReportFiltersProps) {
  const hasActiveFilters = selectedHazard !== 'all' || selectedRegion !== 'All Regions' || selectedTime !== '24h'

  return (
    <div className="sticky top-14 md:top-16 z-40 bg-[var(--bg-main)]/95 backdrop-blur-sm py-2 md:py-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-[var(--border-soft)] md:border-none">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Filter icon - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 text-[var(--text-secondary)] pr-3 border-r border-[var(--border-soft)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium">Filters</span>
        </div>

        {/* Filter selects - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 -mx-1 px-1">
          <select
            value={selectedHazard}
            onChange={(e) => onHazardChange(e.target.value)}
            className={`
              px-2 md:px-3 py-1.5 md:py-2 rounded-lg border text-xs md:text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              cursor-pointer min-w-[100px] md:min-w-[130px] transition-colors shrink-0
              ${selectedHazard !== 'all' 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-[var(--bg-card)] border-[var(--border-soft)] text-[var(--text-primary)]'
              }
            `}
            aria-label="Filter by hazard type"
          >
            <option value="all">All Hazards</option>
            {hazardTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className={`
              px-2 md:px-3 py-1.5 md:py-2 rounded-lg border text-xs md:text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              cursor-pointer min-w-[100px] md:min-w-[130px] transition-colors shrink-0
              ${selectedRegion !== 'All Regions' 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-[var(--bg-card)] border-[var(--border-soft)] text-[var(--text-primary)]'
              }
            `}
            aria-label="Filter by region"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className={`
              px-2 md:px-3 py-1.5 md:py-2 rounded-lg border text-xs md:text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              cursor-pointer min-w-[90px] md:min-w-[130px] transition-colors shrink-0
              ${selectedTime !== '24h' 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-[var(--bg-card)] border-[var(--border-soft)] text-[var(--text-primary)]'
              }
            `}
            aria-label="Filter by time range"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onHazardChange('all')
              onRegionChange('All Regions')
              onTimeChange('24h')
            }}
            className="shrink-0 p-1.5 md:px-3 md:py-2 text-xs md:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            aria-label="Clear filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden md:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  )
}
