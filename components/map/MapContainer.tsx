'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { HeatZones } from './HeatZones'
import { hazardTypes } from '@/data/hazardTypes'
import { dummyMapReports, type MapReport } from '@/data/dummyMapReports'

import 'leaflet/dist/leaflet.css'

interface MapContainerProps {
  selectedHazards: string[]
  confidenceThreshold: number
  onMarkerClick: (report: MapReport) => void
}

// Fix Leaflet default icon issue
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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export function MapContainerComponent({
  selectedHazards,
  confidenceThreshold,
  onMarkerClick,
}: MapContainerProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredReports = useMemo(() => {
    return dummyMapReports.filter(
      (report) =>
        selectedHazards.includes(report.hazardType) &&
        report.confidence >= confidenceThreshold
    )
  }, [selectedHazards, confidenceThreshold])

  const getMarkerIcon = useCallback((hazardType: string) => {
    const hazard = hazardTypes.find((h) => h.id === hazardType)
    return createHazardIcon(hazard?.color || '#6B7280')
  }, [])

  // Center on India's west coast
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

      {/* Heat Zones */}
      <HeatZones selectedHazards={selectedHazards} />

      {/* Markers */}
      {filteredReports.map((report) => (
        <Marker
          key={report.id}
          position={[report.lat, report.lng]}
          icon={getMarkerIcon(report.hazardType)}
          eventHandlers={{
            click: () => onMarkerClick(report),
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{report.locationName}</strong>
              <br />
              <span className="text-gray-600">
                {hazardTypes.find((h) => h.id === report.hazardType)?.name}
              </span>
              <br />
              <span className="text-xs">Click for details</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMap>
  )
}
