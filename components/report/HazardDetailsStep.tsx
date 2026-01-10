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

  const handleNext = () => {
    const newErrors: string[] = []

    if (!data.hazardType) {
      newErrors.push('Please select a hazard type')
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
      onUpdate({ hazardType: suggestedHazard })
    }
  }

  const descriptionLength = data.description.length
  const isDescriptionShort = descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION_LENGTH

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="heading-m mb-6">Hazard Details</h2>

        {/* Hazard Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Hazard Type <span className="text-[var(--alert-red)]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hazardTypes.map((hazard) => (
              <button
                key={hazard.id}
                type="button"
                onClick={() => onUpdate({ hazardType: hazard.id })}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${data.hazardType === hazard.id
                    ? 'border-[var(--info-blue)] bg-blue-50'
                    : 'border-[var(--border-soft)] hover:border-[var(--info-blue)] hover:bg-[var(--bg-muted)]'
                  }
                `}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block mr-2"
                  style={{ backgroundColor: hazard.color }}
                />
                <span className="text-sm font-medium">{hazard.name}</span>
              </button>
            ))}
          </div>

          {/* AI Suggestion */}
          {suggestedHazard && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">AI Suggestion</Badge>
                <span className="text-sm">
                  Based on your description, this might be a{' '}
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
            placeholder="Describe the hazard situation in detail. You can write in your local language..."
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
