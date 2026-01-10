'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { hazardTypes } from '@/data/hazardTypes'
import {
  simulateAIVerification,
  type ReportFormData,
  type AIVerificationResult,
} from '@/lib/reportValidation'

interface AIVerificationStepProps {
  data: ReportFormData
  onComplete: (result: AIVerificationResult) => void
  onBack: () => void
}

interface PipelineStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'complete'
}

export function AIVerificationStep({ data, onComplete, onBack }: AIVerificationStepProps) {
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 'translate', label: 'Translating to English', status: 'pending' },
    { id: 'classify', label: 'Classifying hazard type', status: 'pending' },
    { id: 'urgency', label: 'Checking urgency level', status: 'pending' },
    { id: 'confidence', label: 'Estimating confidence', status: 'pending' },
  ])
  const [result, setResult] = useState<AIVerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    runVerification()
  }, [])

  const runVerification = async () => {
    // Animate pipeline steps
    for (let i = 0; i < pipelineSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setPipelineSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          status: idx < i ? 'complete' : idx === i ? 'processing' : 'pending',
        }))
      )
    }

    // Complete last step
    await new Promise((resolve) => setTimeout(resolve, 800))
    setPipelineSteps((prev) =>
      prev.map((step) => ({ ...step, status: 'complete' }))
    )

    // Get AI result
    try {
      const aiResult = await simulateAIVerification(data)
      setResult(aiResult)
    } catch {
      setError('AI verification failed. Please try again.')
    }
  }

  const handleConfirm = () => {
    if (result) {
      onComplete(result)
    }
  }

  const hazard = hazardTypes.find((h) => h.id === data.hazardType)

  const statusConfig = {
    verified: { variant: 'safe' as const, label: 'Verified', color: 'text-[var(--safe-green)]' },
    'needs-review': { variant: 'warning' as const, label: 'Needs Review', color: 'text-[var(--warning-orange)]' },
    'low-trust': { variant: 'alert' as const, label: 'Low Trust', color: 'text-[var(--alert-red)]' },
  }

  const urgencyConfig = {
    high: { variant: 'alert' as const, label: 'High Urgency' },
    medium: { variant: 'warning' as const, label: 'Medium Urgency' },
    low: { variant: 'info' as const, label: 'Low Urgency' },
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="heading-m mb-6">AI Verification</h2>

        {/* Pipeline Progress */}
        <div className="mb-8">
          <div className="space-y-3">
            {pipelineSteps.map((step) => (
              <div
                key={step.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all
                  ${step.status === 'processing' ? 'bg-blue-50' : 'bg-[var(--bg-muted)]'}
                `}
              >
                {/* Status Icon */}
                <div className="w-6 h-6 flex items-center justify-center">
                  {step.status === 'complete' ? (
                    <svg className="w-5 h-5 text-[var(--safe-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.status === 'processing' ? (
                    <div className="w-5 h-5 border-2 border-[var(--info-blue)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--border-soft)]" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-sm font-medium
                    ${step.status === 'complete' ? 'text-[var(--safe-green)]' : ''}
                    ${step.status === 'processing' ? 'text-[var(--info-blue)]' : ''}
                    ${step.status === 'pending' ? 'text-[var(--text-secondary)]' : ''}
                  `}
                >
                  {step.label}
                </span>

                {/* Processing shimmer */}
                {step.status === 'processing' && (
                  <div className="flex-1 h-2 bg-[var(--bg-muted)] rounded overflow-hidden">
                    <div className="h-full w-1/2 bg-[var(--info-blue)] rounded animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-[var(--alert-red)] rounded-lg">
            <p className="text-[var(--alert-red)]">{error}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={runVerification}>
              Retry
            </Button>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="mb-6 p-4 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-soft)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Verification Result</h3>
              <Badge variant={statusConfig[result.status].variant}>
                {statusConfig[result.status].label}
              </Badge>
            </div>

            {/* Detected Hazard */}
            <div className="mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Detected Hazard:</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: hazard?.color }}
                />
                <span className="font-medium">{hazard?.name}</span>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Confidence Score:</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-3 bg-[var(--bg-card)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result.confidence >= 80
                        ? 'bg-[var(--safe-green)]'
                        : result.confidence >= 50
                          ? 'bg-[var(--warning-orange)]'
                          : 'bg-[var(--alert-red)]'
                    }`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <span className={`font-bold ${statusConfig[result.status].color}`}>
                  {result.confidence}%
                </span>
              </div>
            </div>

            {/* Urgency */}
            <div className="mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Urgency Level:</span>
              <div className="mt-1">
                <Badge variant={urgencyConfig[result.urgency].variant}>
                  {urgencyConfig[result.urgency].label}
                </Badge>
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <span className="text-sm text-[var(--text-secondary)]">AI Summary:</span>
              <p className="mt-1 text-sm">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack} disabled={!result}>
            Back to Edit
          </Button>
          <Button onClick={handleConfirm} disabled={!result}>
            Confirm & Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
