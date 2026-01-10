export interface SocialPost {
  id: string
  url: string
  platform: 'twitter' | 'facebook' | 'instagram' | 'other'
  content: string
  author: string
  timestamp: string
  verified: boolean
  credibility: 'high' | 'medium' | 'low'
}

export interface VerificationResult {
  credibility: 'high' | 'medium' | 'low'
  analysis: string
  confidence: number
}
