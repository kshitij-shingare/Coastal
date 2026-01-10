'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { MAX_FILE_SIZE, type ReportFormData } from '@/lib/reportValidation'

interface LocationMediaStepProps {
  data: ReportFormData
  onUpdate: (data: Partial<ReportFormData>) => void
  onNext: () => void
  onBack: () => void
}

type LocationStatus = 'idle' | 'fetching' | 'success' | 'error'

export function LocationMediaStep({ data, onUpdate, onNext, onBack }: LocationMediaStepProps) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(data.location ? 'success' : 'idle')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [manualAddress, setManualAddress] = useState(data.location?.address || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchLocation = () => {
    setLocationStatus('fetching')
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        }
        onUpdate({ location })
        setManualAddress(location.address)
        setLocationStatus('success')
      },
      (error) => {
        setLocationStatus('error')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location or enter manually.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please enter manually.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.')
            break
          default:
            setLocationError('Unable to get location. Please enter manually.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleManualAddress = (address: string) => {
    setManualAddress(address)
    if (address.trim()) {
      // Simulate geocoding with dummy coordinates
      onUpdate({
        location: {
          lat: 19.0760 + Math.random() * 0.1,
          lng: 72.8777 + Math.random() * 0.1,
          address: address.trim(),
        },
      })
      setLocationStatus('success')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const errors: string[] = []
    const validFiles: File[] = []

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 10MB limit`)
      } else if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        errors.push(`${file.name} is not a valid image or video`)
      } else {
        validFiles.push(file)
      }
    })

    setFileErrors(errors)
    onUpdate({ media: [...data.media, ...validFiles] })
  }

  const removeFile = (index: number) => {
    const newMedia = data.media.filter((_, i) => i !== index)
    onUpdate({ media: newMedia })
  }

  const handleNext = () => {
    if (!data.location) {
      setLocationError('Please provide a location')
      return
    }
    onNext()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="heading-m mb-6">Location & Media</h2>

        {/* Location Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Location <span className="text-[var(--alert-red)]">*</span>
          </label>

          <div className="flex gap-2 mb-3">
            <Button
              variant="secondary"
              onClick={fetchLocation}
              disabled={locationStatus === 'fetching'}
              className="flex items-center gap-2"
            >
              {locationStatus === 'fetching' ? (
                <Loader size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {locationStatus === 'fetching' ? 'Getting location...' : 'Use Current Location'}
            </Button>

            {locationStatus === 'success' && (
              <Badge variant="safe" className="self-center">Location Set</Badge>
            )}
          </div>

          <input
            type="text"
            value={manualAddress}
            onChange={(e) => handleManualAddress(e.target.value)}
            placeholder="Or enter address manually..."
            className="w-full p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]"
          />

          {locationError && (
            <p className="mt-2 text-sm text-[var(--alert-red)]">{locationError}</p>
          )}

          {data.location && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              📍 {data.location.address} ({data.location.lat.toFixed(4)}, {data.location.lng.toFixed(4)})
            </p>
          )}
        </div>

        {/* Media Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Photos/Videos <span className="text-[var(--text-secondary)]">(Optional)</span>
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-soft)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--info-blue)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            <svg className="w-10 h-10 mx-auto mb-2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-[var(--text-secondary)]">
              Click to upload images or videos
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Max 10MB per file
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Errors */}
          {fileErrors.length > 0 && (
            <div className="mt-2 text-sm text-[var(--alert-red)]">
              {fileErrors.map((error, i) => (
                <p key={i}>• {error}</p>
              ))}
            </div>
          )}

          {/* File Previews */}
          {data.media.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {data.media.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[var(--bg-muted)]">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--alert-red)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Next: AI Verification
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
