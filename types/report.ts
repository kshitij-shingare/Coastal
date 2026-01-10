export interface Report {
  id: string
  title: string
  description: string
  hazardType: string
  severity: 'high' | 'medium' | 'low'
  location: string
  coordinates: { lat: number; lng: number }
  createdAt: string
  verified: boolean
  media?: string[]
}
