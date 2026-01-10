'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapFilters } from '@/components/map/MapFilters'
import { MapLegend } from '@/components/map/MapLegend'
import { ZoneInfoModal } from '@/components/map/ZoneInfoModal'
import { hazardTypes } from '@/data/hazardTypes'
import { dummyMapReports, type MapReport } from '@/data/dummyMapReports'
import { Skeleton } from '@/components/ui/Skeleton'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainerComponent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--info-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading map...</p>
        </div>
      </div>
    ),
  }
)

export default function MapPage() {
  const [selectedHazards, setSelectedHazards] = useState<string[]>(
    hazardTypes.map((h) => h.id)
  )
  const [confidenceThreshold, setConfidenceThreshold] = useState(50)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null)

  // Debounced confidence change
  const handleConfidenceChange = useCallback((value: number) => {
    setConfidenceThreshold(value)
  }, [])

  const handleMarkerClick = useCallback((report: MapReport) => {
    setSelectedReport(report)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedReport(null)
  }, [])

  // Stats for header
  const stats = useMemo(() => {
    const filtered = dummyMapReports.filter(
      (r) => selectedHazards.includes(r.hazardType) && r.confidence >= confidenceThreshold
    )
    return {
      total: filtered.length,
      high: filtered.filter((r) => r.severity === 'high').length,
    }
  }, [selectedHazards, confidenceThreshold])

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 md:-my-8">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-soft)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-m">Safety Map</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {stats.total} hazards shown • {stats.high} high risk
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--alert-red)]" />
              High Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning-orange)]" />
              Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--safe-green)]" />
              Low
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          selectedHazards={selectedHazards}
          confidenceThreshold={confidenceThreshold}
          onMarkerClick={handleMarkerClick}
        />

        {/* Filters Overlay */}
        <MapFilters
          selectedHazards={selectedHazards}
          confidenceThreshold={confidenceThreshold}
          timeRange={timeRange}
          onHazardsChange={setSelectedHazards}
          onConfidenceChange={handleConfidenceChange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Legend Overlay */}
        <MapLegend />

        {/* Zone Info Modal */}
        <ZoneInfoModal report={selectedReport} onClose={handleCloseModal} />
      </div>
    </div>
  )
}
