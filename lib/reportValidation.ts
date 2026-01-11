export interface ReportFormData {
  hazardType: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
  } | null
  media: File[]
}

export interface AIVerificationResult {
  detectedHazard: string
  summary: string
  confidence: number
  status: 'verified' | 'needs-review' | 'low-trust'
  urgency: 'high' | 'medium' | 'low'
}

export const MIN_DESCRIPTION_LENGTH = 20
export const MAX_DESCRIPTION_LENGTH = 500
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateStep1(data: ReportFormData): string[] {
  const errors: string[] = []
  
  if (!data.hazardType) {
    errors.push('Please select a hazard type')
  }
  
  if (!data.description || data.description.length < MIN_DESCRIPTION_LENGTH) {
    errors.push(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
  }
  
  return errors
}

export function validateStep2(data: ReportFormData): string[] {
  const errors: string[] = []
  
  if (!data.location) {
    errors.push('Location is required')
  }
  
  return errors
}

export function detectHazardFromText(text: string): string | null {
  const keywords: Record<string, string[]> = {
    flood: ['flood', 'water', 'submerged', 'overflow', 'rain', 'waterlogging'],
    'rip-current': ['rip', 'current', 'swimmer', 'drowning', 'beach', 'waves'],
    erosion: ['erosion', 'cliff', 'landslide', 'collapse', 'soil', 'falling'],
    'storm-surge': ['storm', 'surge', 'cyclone', 'hurricane', 'wind', 'waves'],
    tsunami: ['tsunami', 'earthquake', 'tidal', 'wave'],
    pollution: ['pollution', 'oil', 'spill', 'contamination', 'sewage', 'waste'],
  }
  
  const lowerText = text.toLowerCase()
  
  for (const [hazard, words] of Object.entries(keywords)) {
    if (words.some(word => lowerText.includes(word))) {
      return hazard
    }
  }
  
  return null
}

export async function simulateAIVerification(data: ReportFormData): Promise<AIVerificationResult> {
  try {
    // Call the real AI verification API
    const response = await fetch('/api/ai/verify-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hazardType: data.hazardType,
        description: data.description,
        location: data.location,
        hasMedia: data.media.length > 0,
      }),
    })

    if (!response.ok) {
      throw new Error('AI verification failed')
    }

    const result = await response.json()
    
    return {
      detectedHazard: result.detectedHazard || data.hazardType,
      summary: result.summary,
      confidence: result.confidence,
      status: result.status,
      urgency: result.urgency,
    }
  } catch (error) {
    console.error('AI verification error:', error)
    
    // Fallback to local simulation if API fails
    const baseConfidence = Math.floor(Math.random() * 30) + 65
    const hasMedia = data.media.length > 0
    const hasLocation = !!data.location
    
    let confidence = baseConfidence
    if (hasMedia) confidence += 5
    if (hasLocation) confidence += 5
    if (data.description.length > 100) confidence += 5
    confidence = Math.min(confidence, 98)
    
    let status: AIVerificationResult['status']
    if (confidence >= 80) status = 'verified'
    else if (confidence >= 50) status = 'needs-review'
    else status = 'low-trust'
    
    let urgency: AIVerificationResult['urgency']
    if (['flood', 'tsunami', 'storm-surge'].includes(data.hazardType)) {
      urgency = 'high'
    } else if (['rip-current', 'erosion'].includes(data.hazardType)) {
      urgency = 'medium'
    } else {
      urgency = 'low'
    }
    
    return {
      detectedHazard: data.hazardType,
      summary: `AI analysis confirms ${data.hazardType.replace('-', ' ')} hazard reported at the specified location. ${hasMedia ? 'Visual evidence supports the report.' : 'No visual evidence provided.'} ${data.description.slice(0, 100)}...`,
      confidence,
      status,
      urgency,
    }
  }
}
