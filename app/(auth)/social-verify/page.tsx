'use client'

import { useState, useCallback } from 'react'
import { SocialInput } from '@/components/social/SocialInput'
import { VerificationProgress } from '@/components/social/VerificationProgress'
import { VerificationResult } from '@/components/social/VerificationResult'
import { VerificationHistory } from '@/components/social/VerificationHistory'
import { TrustTips } from '@/components/social/TrustTips'
import { 
  SocialVerificationResult, 
  VERIFICATION_STEPS, 
  generateMockResult, 
  simulateVerification,
  VerificationStep
} from '@/lib/mockSocialVerification'

type VerificationStatus = 'idle' | 'verifying' | 'complete'

export default function SocialVerifyPage() {
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [result, setResult] = useState<SocialVerificationResult | null>(null)
  const [steps, setSteps] = useState<VerificationStep[]>(VERIFICATION_STEPS.map(s => ({ ...s })))

  const handleVerify = useCallback(async (input: { type: 'text' | 'link' | 'screenshot'; content: string; file?: File }) => {
    setStatus('verifying')
    // Reset steps
    setSteps(VERIFICATION_STEPS.map(s => ({ ...s, status: 'pending' as const })))
    
    // Simulate verification process with step updates
    await simulateVerification((stepId, stepStatus) => {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status: stepStatus } : s
      ))
    })
    
    try {
      // Call the real AI verification API
      const response = await fetch('/api/ai/verify-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: input.type,
          content: input.content,
        }),
      })

      if (!response.ok) {
        throw new Error('Verification failed')
      }

      const apiResult = await response.json()
      setResult(apiResult)
    } catch (error) {
      console.error('Social verification error:', error)
      // Fallback to mock result
      const mockResult = generateMockResult(input.content)
      setResult(mockResult)
    }
    
    setStatus('complete')
  }, [])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setSteps(VERIFICATION_STEPS.map(s => ({ ...s, status: 'pending' as const })))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-l mb-2">Social Media Verification</h1>
        <p className="text-[var(--text-secondary)]">
          Verify the reliability of social media posts about coastal hazards using AI analysis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {status === 'idle' && (
            <SocialInput 
              onVerify={handleVerify} 
              isVerifying={false}
            />
          )}
          
          {status === 'verifying' && (
            <VerificationProgress 
              steps={steps}
              isActive={true}
            />
          )}
          
          {status === 'complete' && result && (
            <VerificationResult 
              result={result} 
              onVerifyAnother={handleReset} 
            />
          )}

          <VerificationHistory />
        </div>

        <div>
          <TrustTips />
        </div>
      </div>
    </div>
  )
}
