import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
 * Verify a hazard report using AI
 */
export async function verifyHazardReport(input: HazardVerificationInput): Promise<HazardVerificationResult> {
  const systemPrompt = `You are an AI assistant specialized in verifying coastal hazard reports in India. 
Your task is to analyze hazard reports and determine their credibility, urgency, and provide a summary.

Hazard types include: flood, rip-current, erosion, storm-surge, tsunami, pollution, jellyfish, algae-bloom.

Respond in JSON format with these fields:
- detectedHazard: the hazard type you detected (use the exact type names above)
- summary: a brief 1-2 sentence summary of the hazard situation
- confidence: a number 0-100 indicating how confident you are in the report's accuracy
- status: "verified" (confidence >= 75), "needs-review" (confidence 40-74), or "low-trust" (confidence < 40)
- urgency: "high" (immediate danger to life), "medium" (potential danger), or "low" (informational)
- reasoning: brief explanation of your assessment`

  const userPrompt = `Analyze this coastal hazard report:

Reported Hazard Type: ${input.hazardType}
Description: ${input.description}
Location: ${input.location ? `${input.location.address} (${input.location.lat}, ${input.location.lng})` : 'Not specified'}
Has Photo/Video Evidence: ${input.hasMedia ? 'Yes' : 'No'}

Provide your verification assessment.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const result = JSON.parse(content)
    return {
      detectedHazard: result.detectedHazard || input.hazardType,
      summary: result.summary || 'Unable to generate summary',
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      status: result.status || 'needs-review',
      urgency: result.urgency || 'medium',
      reasoning: result.reasoning || '',
    }
  } catch (error) {
    console.error('AI verification error:', error)
    // Return a fallback result
    return {
      detectedHazard: input.hazardType,
      summary: `${input.hazardType.replace('-', ' ')} hazard reported. ${input.description.slice(0, 100)}`,
      confidence: 60,
      status: 'needs-review',
      urgency: 'medium',
      reasoning: 'AI verification unavailable, manual review recommended',
    }
  }
}

/**
 * Verify social media content about coastal hazards
 */
export async function verifySocialContent(input: SocialVerificationInput): Promise<SocialVerificationResult> {
  const systemPrompt = `You are an AI assistant specialized in verifying social media posts about coastal hazards in India.
Your task is to analyze social media content and determine its credibility.

Analyze for:
1. Emotional manipulation or sensationalism
2. Factual accuracy and consistency
3. Geographic plausibility
4. Signs of misinformation

Respond in JSON format with these fields:
- status: "verified" (likely accurate), "uncertain" (cannot confirm), or "likely_false" (signs of misinformation)
- confidenceScore: 0-100 indicating confidence in your assessment
- explanation: 2-3 sentence explanation of your assessment
- factors: array of {label, score (0-100), description} for: "Language Analysis", "Source Credibility", "Geographic Consistency", "Factual Accuracy"
- advice: one sentence recommendation for the user`

  const userPrompt = `Analyze this social media content about coastal hazards:

Content Type: ${input.type}
Content: ${input.content}

Provide your credibility assessment.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const result = JSON.parse(content)
    return {
      status: result.status || 'uncertain',
      confidenceScore: Math.min(100, Math.max(0, result.confidenceScore || 50)),
      explanation: result.explanation || 'Unable to analyze content',
      factors: result.factors || [
        { label: 'Language Analysis', score: 50, description: 'Analysis unavailable' },
        { label: 'Source Credibility', score: 50, description: 'Cannot verify source' },
        { label: 'Geographic Consistency', score: 50, description: 'Location not verified' },
        { label: 'Factual Accuracy', score: 50, description: 'Facts not verified' },
      ],
      matchingReports: [], // Would need database integration
      advice: result.advice || 'Exercise caution and verify with official sources.',
    }
  } catch (error) {
    console.error('Social verification error:', error)
    return {
      status: 'uncertain',
      confidenceScore: 50,
      explanation: 'AI verification is currently unavailable. Please verify with official sources.',
      factors: [
        { label: 'Language Analysis', score: 50, description: 'Analysis unavailable' },
        { label: 'Source Credibility', score: 50, description: 'Cannot verify source' },
        { label: 'Geographic Consistency', score: 50, description: 'Location not verified' },
        { label: 'Factual Accuracy', score: 50, description: 'Facts not verified' },
      ],
      matchingReports: [],
      advice: 'AI verification unavailable. Please verify with official sources.',
    }
  }
}

/**
 * Summarize multiple alerts
 */
export async function summarizeAlerts(alerts: { title: string; description: string; severity: string }[]): Promise<string> {
  if (alerts.length === 0) {
    return 'No active alerts at this time.'
  }

  const systemPrompt = `You are an AI assistant that summarizes coastal hazard alerts for the public.
Create a brief, clear summary that highlights the most important information.
Keep it under 100 words and focus on actionable information.`

  const alertsText = alerts.map((a, i) => `${i + 1}. [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`).join('\n')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Summarize these coastal hazard alerts:\n\n${alertsText}` },
      ],
      temperature: 0.5,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || 'Unable to generate summary.'
  } catch (error) {
    console.error('Alert summarization error:', error)
    return `${alerts.length} active alert(s). Please review individual alerts for details.`
  }
}

export default openai
