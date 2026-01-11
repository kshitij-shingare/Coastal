'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapFilters } from '@/components/map/MapFilters'
import { MapLegend } from '@/components/map/MapLegend'
import { ZoneInfoModal } from '@/components/map/ZoneInfoModal'
import { MapHelp } from '@/components/map/MapHelp'
import { hazardTypes } from '@/data/hazardTypes'
import { dummyMapReports, type MapReport } from '@/data/dummyMapReports'
import { useReportStore } from '@/store/useReportStore'
import { VISIBILITY_THRESHOLD } from '@/types/report'

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
  const [showHelp, setShowHelp] = useState(false)

  const storeReports = useReportStore((state) => state.reports)

  const allMapReports = useMemo(() => {
    const convertedStoreReports: MapReport[] = storeReports
      .filter(r => r.status === 'verified' && r.confidence >= VISIBILITY_THRESHOLD)
      .map(r => ({
        id: r.id,
        hazardType: r.hazardType,
        location: r.location.name,
        coordinates: { lat: r.location.lat, lng: r.location.lng },
        confidence: r.confidence,
        severity: r.severity,
        timestamp: r.timestamp,
        summary: r.aiSummary,
        hasMedia: r.hasMedia,
      }))

    return [...convertedStoreReports, ...dummyMapReports]
  }, [storeReports])

  const handleConfidenceChange = useCallback((value: number) => {
    setConfidenceThreshold(value)
  }, [])

  const handleMarkerClick = useCallback((report: MapReport) => {
    setSelectedReport(report)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedReport(null)
  }, [])

  const stats = useMemo(() => {
    const filtered = allMapReports.filter(
      (r) => selectedHazards.includes(r.hazardType) && r.confidence >= confidenceThreshold
    )
    return {
      total: filtered.length,
      high: filtered.filter((r) => r.severity === 'high').length,
      medium: filtered.filter((r) => r.severity === 'medium').length,
      low: filtered.filter((r) => r.severity === 'low').length,
    }
  }, [allMapReports, selectedHazards, confidenceThreshold])

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 md:-my-8">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-soft)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Coastal Safety Map
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
              Click on markers to view hazard details • Colored circles show risk zones
            </p>
          </div>
          
          {/* Stats & Help */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--alert-red)] animate-pulse" />
                <span className="font-medium">{stats.high}</span>
                <span className="text-[var(--text-secondary)]">High</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning-orange)]" />
                <span className="font-medium">{stats.medium}</span>
                <span className="text-[var(--text-secondary)]">Medium</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--safe-green)]" />
                <span className="font-medium">{stats.low}</span>
                <span className="text-[var(--text-secondary)]">Low</span>
              </span>
            </div>
            
            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
              aria-label="Map help"
              title="How to use this map"
            >
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Stats */}
        <div className="flex md:hidden items-center gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--alert-red)]" />
            {stats.high} High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--warning-orange)]" />
            {stats.medium} Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--safe-green)]" />
            {stats.low} Low
          </span>
          <span className="text-[var(--text-secondary)]">• {stats.total} total</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          selectedHazards={selectedHazards}
          confidenceThreshold={confidenceThreshold}
          onMarkerClick={handleMarkerClick}
          extraReports={allMapReports}
        />

        <MapFilters
          selectedHazards={selectedHazards}
          confidenceThreshold={confidenceThreshold}
          timeRange={timeRange}
          onHazardsChange={setSelectedHazards}
          onConfidenceChange={handleConfidenceChange}
          onTimeRangeChange={setTimeRange}
        />

        <MapLegend />
        
        {/* Zoom Controls Hint - shown briefly */}
        <div className="absolute bottom-20 left-4 z-[400] bg-[var(--bg-card)]/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] shadow-md pointer-events-none lg:hidden">
          <span>Pinch to zoom • Drag to pan</span>
        </div>
        
        <ZoneInfoModal report={selectedReport} onClose={handleCloseModal} />
        <MapHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </div>
  )
}
