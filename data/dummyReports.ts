export interface DummyReport {
  id: string
  hazardType: 'flood' | 'erosion' | 'rip-current' | 'storm-surge' | 'tsunami' | 'pollution'
  region: string
  location: string
  timestamp: string
  confidence: number
  summary: string
  hasMedia: boolean
  severity: 'high' | 'medium' | 'low'
}

export const dummyReports: DummyReport[] = [
  {
    id: '1',
    hazardType: 'flood',
    region: 'North Coast',
    location: 'Marina Bay Area',
    timestamp: '2026-01-10T08:30:00Z',
    confidence: 94,
    summary: 'AI verified flooding reported near Marina Bay. Water levels rising due to high tide combined with recent rainfall.',
    hasMedia: true,
    severity: 'high',
  },
  {
    id: '2',
    hazardType: 'rip-current',
    region: 'South Beach',
    location: 'Sunset Beach',
    timestamp: '2026-01-10T07:15:00Z',
    confidence: 89,
    summary: 'Strong rip currents detected at Sunset Beach. Multiple reports confirmed by lifeguard stations.',
    hasMedia: true,
    severity: 'high',
  },
  {
    id: '3',
    hazardType: 'erosion',
    region: 'East Shore',
    location: 'Cliff Walk Trail',
    timestamp: '2026-01-10T06:45:00Z',
    confidence: 82,
    summary: 'Coastal erosion observed along Cliff Walk Trail. Trail section temporarily closed for safety.',
    hasMedia: false,
    severity: 'medium',
  },
  {
    id: '4',
    hazardType: 'storm-surge',
    region: 'West Harbor',
    location: 'Harbor District',
    timestamp: '2026-01-09T22:00:00Z',
    confidence: 91,
    summary: 'Storm surge warning issued for Harbor District. Expected wave heights of 2-3 meters.',
    hasMedia: true,
    severity: 'high',
  },
  {
    id: '5',
    hazardType: 'pollution',
    region: 'Central Bay',
    location: 'Industrial Pier',
    timestamp: '2026-01-09T18:30:00Z',
    confidence: 78,
    summary: 'Water quality alert near Industrial Pier. Elevated bacteria levels detected after runoff.',
    hasMedia: false,
    severity: 'medium',
  },
  {
    id: '6',
    hazardType: 'flood',
    region: 'North Coast',
    location: 'River Delta',
    timestamp: '2026-01-09T14:00:00Z',
    confidence: 86,
    summary: 'Minor flooding at River Delta area. Low-lying roads may be affected during high tide.',
    hasMedia: true,
    severity: 'medium',
  },
  {
    id: '7',
    hazardType: 'rip-current',
    region: 'South Beach',
    location: 'Palm Cove',
    timestamp: '2026-01-09T10:20:00Z',
    confidence: 76,
    summary: 'Moderate rip current activity at Palm Cove. Swimmers advised to stay near lifeguard stations.',
    hasMedia: false,
    severity: 'low',
  },
  {
    id: '8',
    hazardType: 'tsunami',
    region: 'All Regions',
    location: 'Coastal Areas',
    timestamp: '2026-01-08T23:00:00Z',
    confidence: 65,
    summary: 'Tsunami advisory lifted. Previous seismic activity did not generate significant waves.',
    hasMedia: false,
    severity: 'low',
  },
]

export const regions = ['All Regions', 'North Coast', 'South Beach', 'East Shore', 'West Harbor', 'Central Bay']

export const timeRanges = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
]
