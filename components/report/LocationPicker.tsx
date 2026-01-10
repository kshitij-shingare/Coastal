'use client'

import { useLocation } from '@/hooks/useLocation'
import { Button } from '@/components/ui/Button'

interface Props {
  onSelect: (location: { lat: number; lng: number }) => void
}

export default function LocationPicker({ onSelect }: Props) {
  const { location, loading, error, getLocation } = useLocation()

  const handleGetLocation = () => {
    getLocation()
    if (location) {
      onSelect(location)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Location</label>
      <div className="flex gap-2">
        <Button type="button" onClick={handleGetLocation} disabled={loading}>
          {loading ? 'Getting location...' : 'Use Current Location'}
        </Button>
      </div>
      {location && (
        <p className="text-sm text-gray-600 mt-1">
          Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}
