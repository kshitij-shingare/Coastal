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
  const selectStyles = `
    px-3 py-2 rounded-lg border border-[var(--border-soft)] 
    bg-[var(--bg-card)] text-sm text-[var(--text-primary)]
    focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]
    cursor-pointer min-w-[140px]
  `

  return (
    <div className="sticky top-16 z-40 bg-[var(--bg-main)] py-3 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        <select
          value={selectedHazard}
          onChange={(e) => onHazardChange(e.target.value)}
          className={selectStyles}
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
          className={selectStyles}
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
          className={selectStyles}
          aria-label="Filter by time range"
        >
          {timeRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
