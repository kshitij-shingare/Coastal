'use client'

import { Circle } from 'react-leaflet'
import { heatZones } from '@/data/dummyMapReports'

interface HeatZonesProps {
  selectedHazards: string[]
  onZoneClick?: (zoneId: string) => void
}

const riskColors = {
  high: { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3 },
  medium: { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.25 },
  low: { color: '#FBBF24', fillColor: '#FBBF24', fillOpacity: 0.2 },
}

export function HeatZones({ selectedHazards, onZoneClick }: HeatZonesProps) {
  const filteredZones = heatZones.filter((zone) =>
    selectedHazards.includes(zone.hazardType)
  )

  return (
    <>
      {filteredZones.map((zone) => {
        const style = riskColors[zone.riskLevel]
        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onZoneClick?.(zone.id),
            }}
          />
        )
      })}
    </>
  )
}
