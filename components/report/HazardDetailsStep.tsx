'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { hazardTypes } from '@/data/hazardTypes'
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  detectHazardFromText,
  type ReportFormData,
} from '@/lib/reportValidation'

interface HazardDetailsStepProps {
  data: ReportFormData
  onUpdate: (data: Partial<ReportFormData>) => void
  onNext: () => void
}

export function HazardDetailsStep({ data, onUpdate, onNext }: HazardDetailsStepProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [showOtherInput, setShowOtherInput] = useState(data.hazardType === 'other')
  const [otherDescription, setOtherDescription] = useState('')

  // Auto-suggest hazard based on description using useMemo
  const suggestedHazard = useMemo(() => {
    if (data.description.length > 10) {
      const detected = detectHazardFromText(data.description)
      if (detected && detected !== data.hazardType) {
        return detected
      }
    }
    return null
  }, [data.description, data.hazardType])

  const selectedHazard = hazardTypes.find(h => h.id === data.hazardType)

  const handleHazardChange = (hazardId: string) => {
    onUpdate({ hazardType: hazardId })
    setShowOtherInput(hazardId === 'other')
  }

  const handleNext = () => {
    const newErrors: string[] = []

    if (!data.hazardType) {
      newErrors.push('Please select a hazard type')
    }

    if (data.hazardType === 'other' && !otherDescription.trim()) {
      newErrors.push('Please describe the hazard type')
    }

    if (data.description.length < MIN_DESCRIPTION_LENGTH) {
      newErrors.push(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
    }

    setErrors(newErrors)

    if (newErrors.length === 0) {
      onNext()
    }
  }

  const applySuggestion = () => {
    if (suggestedHazard) {
      handleHazardChange(suggestedHazard)
    }
  }

  const descriptionLength = data.description.length
  const isDescriptionShort = descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION_LENGTH

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="heading-m mb-6">Hazard Details</h2>

        {/* Hazard Type Selection - Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Hazard Type <span className="text-[var(--alert-red)]">*</span>
          </label>
          <div className="relative">
            <select
              value={data.hazardType}
              onChange={(e) => handleHazardChange(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)] focus:border-transparent"
            >
              <option value="">Select hazard type...</option>
              {hazardTypes.map((hazard) => (
                <option key={hazard.id} value={hazard.id}>
                  {hazard.name}
                </option>
              ))}
            </select>
            {/* Dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Selected hazard indicator */}
          {selectedHazard && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedHazard.color }}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                Selected: {selectedHazard.name}
              </span>
            </div>
          )}

          {/* Other hazard input */}
          {showOtherInput && (
            <div className="mt-3">
              <input
                type="text"
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                placeholder="Please describe the hazard type..."
                className="w-full p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]"
              />
            </div>
          )}

          {/* AI Suggestion */}
          {suggestedHazard && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">AI Suggestion</Badge>
                <span className="text-sm">
                  This might be a{' '}
                  <strong>{hazardTypes.find(h => h.id === suggestedHazard)?.name}</strong>
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={applySuggestion}>
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-[var(--alert-red)]">*</span>
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe the hazard situation in detail. Include what you observed, severity, and any immediate dangers..."
            className={`
              w-full p-3 rounded-lg border bg-[var(--bg-card)] min-h-[120px] resize-none
              focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]
              ${isDescriptionShort ? 'border-[var(--warning-orange)]' : 'border-[var(--border-soft)]'}
            `}
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${isDescriptionShort ? 'text-[var(--warning-orange)]' : 'text-[var(--text-secondary)]'}`}>
              {isDescriptionShort && `Minimum ${MIN_DESCRIPTION_LENGTH} characters required`}
            </span>
            <span className={`text-xs ${descriptionLength > MAX_DESCRIPTION_LENGTH - 50 ? 'text-[var(--warning-orange)]' : 'text-[var(--text-secondary)]'}`}>
              {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-[var(--alert-red)] rounded-lg">
            <ul className="text-sm text-[var(--alert-red)] space-y-1">
              {errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={handleNext}>
            Next: Location & Media
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
