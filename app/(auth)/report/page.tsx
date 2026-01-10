'use client'

import { useState } from 'react'
import { StepIndicator } from '@/components/report/StepIndicator'
import { HazardDetailsStep } from '@/components/report/HazardDetailsStep'
import { LocationMediaStep } from '@/components/report/LocationMediaStep'
import { AIVerificationStep } from '@/components/report/AIVerificationStep'
import { SubmissionSuccess } from '@/components/report/SubmissionSuccess'
import type { ReportFormData, AIVerificationResult } from '@/lib/reportValidation'

const STEPS = [
  { id: 1, label: 'Hazard Details' },
  { id: 2, label: 'Location & Media' },
  { id: 3, label: 'AI Verification' },
  { id: 4, label: 'Confirmation' },
]

const initialFormData: ReportFormData = {
  hazardType: '',
  description: '',
  location: null,
  media: [],
}

export default function ReportPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ReportFormData>(initialFormData)
  const [aiResult, setAiResult] = useState<AIVerificationResult | null>(null)

  const updateFormData = (data: Partial<ReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleAIComplete = (result: AIVerificationResult) => {
    setAiResult(result)
    setCurrentStep(4)
  }

  const handleSubmitAnother = () => {
    setFormData(initialFormData)
    setAiResult(null)
    setCurrentStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="heading-l mb-2">Report Hazard</h1>
        <p className="text-[var(--text-secondary)]">
          Submit a hazard report to help keep your community safe.
        </p>
      </div>

      {/* Step Indicator */}
      {currentStep < 4 && <StepIndicator steps={STEPS} currentStep={currentStep} />}

      {/* Step Content */}
      <div className="transition-all duration-300">
        {currentStep === 1 && (
          <HazardDetailsStep
            data={formData}
            onUpdate={updateFormData}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <LocationMediaStep
            data={formData}
            onUpdate={updateFormData}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <AIVerificationStep
            data={formData}
            onComplete={handleAIComplete}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && aiResult && (
          <SubmissionSuccess
            data={formData}
            result={aiResult}
            onSubmitAnother={handleSubmitAnother}
          />
        )}
      </div>
    </div>
  )
}
