import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface HazardVerificationInput {
  hazardType: string
  description: string
  location?: {
    lat: number
    lng: number
    address: string
  } | null
  hasMedia: boolean
}

export interface HazardVerificationResult {
  detectedHazard: string
  summary: string
  confidence: number
  status: 'verified' | 'needs-review' | 'low-trust'
  urgency: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface SocialVerificationInput {
  type: 'text' | 'link' | 'screenshot'
  content: string
}

export interface SocialVerificationResult {
  status: 'verified' | 'uncertain' | 'likely_false'
  confidenceScore: number
  explanation: string
  factors: {
    label: string
    score: number
    description: string
  }[]
  matchingReports: {
    id: string
    title: string
    location: string
    date: string
    similarity: number
  }[]
  advice: string
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
function parseJsonResponse(text: string): Record<string, unknown> {
  // Remove markdown code blocks if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return JSON.parse(cleaned.trim())
}

/**
 * Get hazard type display name
 */
function getHazardDisplayName(hazardType: string): string {
  const names: Record<string, string> = {
    'flood': 'Flooding',
    'rip-current': 'Rip Current',
    'erosion': 'Coastal Erosion',
    'storm-surge': 'Storm Surge',
    'tsunami': 'Tsunami',
    'pollution': 'Water Pollution',
    'jellyfish': 'Jellyfish Swarm',
    'algae-bloom': 'Harmful Algae Bloom',
  }
  return names[hazardType] || hazardType.replace('-', ' ')
}

/**
 * Verify a hazard report using Gemini AI
 */
export async function verifyHazardReport(input: HazardVerificationInput): Promise<HazardVerificationResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const hazardDisplayName = getHazardDisplayName(input.hazardType)
  
  const prompt = `You are an expert AI system for verifying coastal hazard reports in India. Your job is to analyze citizen-submitted hazard reports and assess their credibility, urgency, and provide actionable insights.

## Report to Analyze:
- **Hazard Type Selected**: ${hazardDisplayName} (${input.hazardType})
- **Description**: "${input.description}"
- **Location**: ${input.location ? `${input.location.address} (Coordinates: ${input.location.lat.toFixed(4)}, ${input.location.lng.toFixed(4)})` : 'Not provided'}
- **Photo/Video Evidence**: ${input.hasMedia ? 'Yes - visual evidence attached' : 'No visual evidence'}

## Your Analysis Tasks:
1. **Verify the hazard type** - Does the description match the selected hazard type? If not, what hazard does it actually describe?
2. **Assess credibility** - Based on specificity, coherence, and plausibility of the report
3. **Determine urgency** - Is this an immediate threat to life, potential danger, or informational?
4. **Generate summary** - Create a clear, actionable summary for emergency responders

## Scoring Guidelines:
- **Confidence 75-100**: Report is detailed, specific, plausible, and consistent → status: "verified"
- **Confidence 40-74**: Report has some issues but could be valid → status: "needs-review"  
- **Confidence 0-39**: Report is vague, inconsistent, or implausible → status: "low-trust"

- **High urgency**: Immediate danger to human life (active flooding, tsunami warning, dangerous rip currents with swimmers present)
- **Medium urgency**: Potential danger that needs monitoring (erosion near structures, pollution affecting water quality)
- **Low urgency**: Informational or non-immediate (minor pollution, general observations)

Respond with ONLY a valid JSON object (no markdown formatting, no explanation outside JSON):
{
  "detectedHazard": "${input.hazardType}",
  "summary": "A clear 2-3 sentence summary describing the hazard situation and recommended actions",
  "confidence": 75,
  "status": "verified",
  "urgency": "medium",
  "reasoning": "Brief explanation of why you gave this assessment"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('Gemini raw response:', text)
    
    const parsed = parseJsonResponse(text) as {
      detectedHazard?: string
      summary?: string
      confidence?: number
      status?: string
      urgency?: string
      reasoning?: string
    }
    
    // Validate and normalize the response
    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 60))
    
    // Determine status based on confidence if not provided correctly
    let status: HazardVerificationResult['status']
    if (parsed.status === 'verified' || parsed.status === 'needs-review' || parsed.status === 'low-trust') {
      status = parsed.status
    } else if (confidence >= 75) {
      status = 'verified'
    } else if (confidence >= 40) {
      status = 'needs-review'
    } else {
      status = 'low-trust'
    }
    
    // Validate urgency
    let urgency: HazardVerificationResult['urgency']
    if (parsed.urgency === 'high' || parsed.urgency === 'medium' || parsed.urgency === 'low') {
      urgency = parsed.urgency
    } else {
      // Default based on hazard type
      if (['flood', 'tsunami', 'storm-surge'].includes(input.hazardType)) {
        urgency = 'high'
      } else if (['rip-current', 'erosion'].includes(input.hazardType)) {
        urgency = 'medium'
      } else {
        urgency = 'low'
      }
    }
    
    return {
      detectedHazard: parsed.detectedHazard || input.hazardType,
      summary: parsed.summary || `${hazardDisplayName} hazard reported. ${input.description.slice(0, 150)}`,
      confidence,
      status,
      urgency,
      reasoning: parsed.reasoning || 'AI analysis completed',
    }
  } catch (error) {
    console.error('Gemini verification error:', error)
    
    // Intelligent fallback analysis without AI
    const descLength = input.description.length
    const hasLocation = !!input.location
    const hasMedia = input.hasMedia
    const hazardDisplayName = getHazardDisplayName(input.hazardType)
    
    // Analyze description quality
    const words = input.description.trim().split(/\s+/)
    const wordCount = words.length
    const hasRealWords = words.some(w => w.length > 3 && /^[a-zA-Z]+$/.test(w))
    const isGibberish = !hasRealWords || wordCount < 3
    
    // Calculate confidence based on report quality
    let confidence = 40 // Base confidence
    
    if (isGibberish) {
      confidence = 25 // Low confidence for gibberish
    } else {
      if (descLength > 100) confidence += 20
      else if (descLength > 50) confidence += 10
      if (wordCount > 10) confidence += 10
    }
    
    if (hasLocation) confidence += 15
    if (hasMedia) confidence += 15
    
    confidence = Math.min(confidence, 90)
    
    // Determine status
    const status: HazardVerificationResult['status'] = 
      confidence >= 75 ? 'verified' : 
      confidence >= 40 ? 'needs-review' : 'low-trust'
    
    // Determine urgency based on hazard type
    const urgency: HazardVerificationResult['urgency'] = 
      ['flood', 'tsunami', 'storm-surge'].includes(input.hazardType) ? 'high' :
      ['rip-current', 'erosion'].includes(input.hazardType) ? 'medium' : 'low'
    
    // Generate meaningful summary
    let summary: string
    let reasoning: string
    
    if (isGibberish) {
      summary = `${hazardDisplayName} report received but description appears unclear or incomplete. Please provide more details about the hazard situation for accurate verification.`
      reasoning = 'Description lacks meaningful content. Manual review recommended.'
    } else {
      const locationText = hasLocation ? ` near ${input.location!.address}` : ''
      const mediaText = hasMedia ? ' Visual evidence provided.' : ''
      summary = `${hazardDisplayName} hazard reported${locationText}. ${input.description.slice(0, 120)}${input.description.length > 120 ? '...' : ''}${mediaText}`
      reasoning = `Report analyzed based on: description quality (${wordCount} words), ${hasLocation ? 'location provided' : 'no location'}, ${hasMedia ? 'media attached' : 'no media'}. AI service unavailable - using automated assessment.`
    }
    
    return {
      detectedHazard: input.hazardType,
      summary,
      confidence,
      status,
      urgency,
      reasoning,
    }
  }
}

/**
 * Verify social media content about coastal hazards using Gemini
 */
export async function verifySocialContent(input: SocialVerificationInput): Promise<SocialVerificationResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an expert AI system for detecting misinformation about coastal hazards in India. Analyze this social media content and determine if it's credible or potentially false/misleading.

## Content to Analyze:
- **Type**: ${input.type}
- **Content**: "${input.content}"

## Analysis Criteria:
1. **Language Analysis** - Check for sensationalism, emotional manipulation, ALL CAPS, excessive punctuation
2. **Source Credibility** - Does it cite official sources? Is the account/source verifiable?
3. **Geographic Consistency** - Are location details specific and plausible for Indian coastal areas?
4. **Factual Accuracy** - Does the information align with known weather patterns, geography, and hazard behavior?

## Scoring:
- **verified** (70-100): Content appears factual, measured language, specific details
- **uncertain** (40-69): Cannot fully verify, some red flags but not conclusive
- **likely_false** (0-39): Clear signs of misinformation, sensationalism, or fabrication

Respond with ONLY a valid JSON object:
{
  "status": "verified",
  "confidenceScore": 75,
  "explanation": "2-3 sentence explanation of your assessment",
  "factors": [
    {"label": "Language Analysis", "score": 80, "description": "Brief assessment"},
    {"label": "Source Credibility", "score": 70, "description": "Brief assessment"},
    {"label": "Geographic Consistency", "score": 85, "description": "Brief assessment"},
    {"label": "Factual Accuracy", "score": 75, "description": "Brief assessment"}
  ],
  "advice": "One sentence recommendation for the user"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const parsed = parseJsonResponse(text) as {
      status?: string
      confidenceScore?: number
      explanation?: string
      factors?: { label: string; score: number; description: string }[]
      advice?: string
    }
    
    // Validate status
    let status: SocialVerificationResult['status']
    if (parsed.status === 'verified' || parsed.status === 'uncertain' || parsed.status === 'likely_false') {
      status = parsed.status
    } else {
      const score = Number(parsed.confidenceScore) || 50
      status = score >= 70 ? 'verified' : score >= 40 ? 'uncertain' : 'likely_false'
    }
    
    return {
      status,
      confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 50)),
      explanation: parsed.explanation || 'Analysis completed.',
      factors: parsed.factors || [
        { label: 'Language Analysis', score: 50, description: 'Analysis completed' },
        { label: 'Source Credibility', score: 50, description: 'Cannot verify source' },
        { label: 'Geographic Consistency', score: 50, description: 'Location details reviewed' },
        { label: 'Factual Accuracy', score: 50, description: 'Facts checked against known data' },
      ],
      matchingReports: [],
      advice: parsed.advice || 'Always verify information with official sources like IMD or NDMA.',
    }
  } catch (error) {
    console.error('Gemini social verification error:', error)
    return {
      status: 'uncertain',
      confidenceScore: 50,
      explanation: 'AI verification service is temporarily unavailable. Please verify this information with official sources.',
      factors: [
        { label: 'Language Analysis', score: 50, description: 'Service unavailable' },
        { label: 'Source Credibility', score: 50, description: 'Cannot verify' },
        { label: 'Geographic Consistency', score: 50, description: 'Cannot verify' },
        { label: 'Factual Accuracy', score: 50, description: 'Cannot verify' },
      ],
      matchingReports: [],
      advice: 'Please verify with official sources like IMD (India Meteorological Department) or NDMA.',
    }
  }
}

/**
 * Summarize multiple alerts using Gemini
 */
export async function summarizeAlerts(alerts: { title: string; description: string; severity: string }[]): Promise<string> {
  if (alerts.length === 0) {
    return 'No active alerts at this time. Stay safe and monitor official channels for updates.'
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const alertsText = alerts.map((a, i) => 
    `${i + 1}. [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`
  ).join('\n')

  const prompt = `You are an emergency communication specialist. Create a brief, clear public safety summary of these coastal hazard alerts for Indian citizens.

## Active Alerts:
${alertsText}

## Requirements:
- Keep under 100 words
- Prioritize high severity alerts
- Include actionable safety advice
- Use clear, simple language
- Mention affected areas if known

Provide only the summary text, no JSON or formatting.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text() || `${alerts.length} active coastal hazard alert(s). Please review individual alerts and follow official guidance.`
  } catch (error) {
    console.error('Gemini alert summarization error:', error)
    return `${alerts.length} active coastal hazard alert(s). Please review individual alerts for details and follow guidance from local authorities.`
  }
}
