'use client'

import { useMemo, useCallback, useSyncExternalStore } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { HeatZones } from './HeatZones'
import { hazardTypes } from '@/data/hazardTypes'
import { dummyMapReports, type MapReport } from '@/data/dummyMapReports'

import 'leaflet/dist/leaflet.css'

interface MapContainerProps {
  selectedHazards: string[]
  confidenceThreshold: number
  onMarkerClick: (report: MapReport) => void
  extraReports?: MapReport[]
}

// Extended type to handle both coordinate formats
interface ExtendedMapReport extends MapReport {
  lat?: number
  lng?: number
  locationName?: string
}

const createHazardIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

// Use useSyncExternalStore for client-side detection
function subscribe() {
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function MapContainerComponent({
  selectedHazards,
  confidenceThreshold,
  onMarkerClick,
  extraReports,
}: MapContainerProps) {
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Use extraReports if provided, otherwise use dummy data
  const allReports = useMemo(() => {
    if (extraReports && extraReports.length > 0) {
      return extraReports
    }
    return dummyMapReports
  }, [extraReports])

  const filteredReports = useMemo(() => {
    return allReports.filter(
      (report) =>
        selectedHazards.includes(report.hazardType) &&
        report.confidence >= confidenceThreshold
    )
  }, [allReports, selectedHazards, confidenceThreshold])

  const getMarkerIcon = useCallback((hazardType: string) => {
    const hazard = hazardTypes.find((h) => h.id === hazardType)
    return createHazardIcon(hazard?.color || '#6B7280')
  }, [])

  const center: [number, number] = [17.5, 73.5]
  const zoom = 7

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--info-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <LeafletMap
      center={center}
      zoom={zoom}
      className="w-full h-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <HeatZones selectedHazards={selectedHazards} />

      {filteredReports.map((report) => {
        // Handle both coordinate formats
        const extReport = report as ExtendedMapReport
        const lat = report.coordinates?.lat ?? extReport.lat
        const lng = report.coordinates?.lng ?? extReport.lng
        const locationName = report.location ?? extReport.locationName
        
        if (!lat || !lng) return null

        return (
          <Marker
            key={report.id}
            position={[lat, lng]}
            icon={getMarkerIcon(report.hazardType)}
            eventHandlers={{
              click: () => onMarkerClick(report),
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{locationName}</strong>
                <br />
                <span className="text-gray-600">
                  {hazardTypes.find((h) => h.id === report.hazardType)?.name}
                </span>
                <br />
                <span className="text-xs">Click for details</span>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </LeafletMap>
  )
}
