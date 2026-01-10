export interface MapReport {
  id: string
  lat: number
  lng: number
  hazardType: 'flood' | 'erosion' | 'rip-current' | 'storm-surge' | 'tsunami' | 'pollution'
  confidence: number
  locationName: string
  severity: 'high' | 'medium' | 'low'
  summary: string
  timestamp: string
}

export interface HeatZone {
  id: string
  lat: number
  lng: number
  radius: number
  riskLevel: 'high' | 'medium' | 'low'
  hazardType: string
}

// Coastal India region - centered around Mumbai/Goa coast
export const dummyMapReports: MapReport[] = [
  {
    id: 'm1',
    lat: 19.0760,
    lng: 72.8777,
    hazardType: 'flood',
    confidence: 94,
    locationName: 'Mumbai Marina',
    severity: 'high',
    summary: 'Severe flooding reported due to high tide and monsoon drainage overflow. Water levels at 1.2m above normal.',
    timestamp: '2026-01-10T08:30:00Z',
  },
  {
    id: 'm2',
    lat: 15.4909,
    lng: 73.8278,
    hazardType: 'rip-current',
    confidence: 89,
    locationName: 'Calangute Beach, Goa',
    severity: 'high',
    summary: 'Strong rip currents detected. Multiple swimmer rescues reported. Red flag warning in effect.',
    timestamp: '2026-01-10T07:15:00Z',
  },
  {
    id: 'm3',
    lat: 18.9220,
    lng: 72.8347,
    hazardType: 'erosion',
    confidence: 82,
    locationName: 'Worli Sea Face',
    severity: 'medium',
    summary: 'Coastal erosion observed along sea wall. Structural monitoring recommended.',
    timestamp: '2026-01-10T06:45:00Z',
  },
  {
    id: 'm4',
    lat: 15.2993,
    lng: 74.1240,
    hazardType: 'storm-surge',
    confidence: 91,
    locationName: 'Panjim Harbor',
    severity: 'high',
    summary: 'Storm surge warning active. Expected wave heights of 2-3 meters during evening high tide.',
    timestamp: '2026-01-09T22:00:00Z',
  },
  {
    id: 'm5',
    lat: 19.1136,
    lng: 72.8697,
    hazardType: 'pollution',
    confidence: 78,
    locationName: 'Juhu Beach',
    severity: 'medium',
    summary: 'Elevated bacteria levels detected. Swimming not recommended until further notice.',
    timestamp: '2026-01-09T18:30:00Z',
  },
  {
    id: 'm6',
    lat: 18.5204,
    lng: 73.8567,
    hazardType: 'flood',
    confidence: 86,
    locationName: 'Pune River Basin',
    severity: 'medium',
    summary: 'Minor flooding in low-lying areas near river. Roads may be affected during peak hours.',
    timestamp: '2026-01-09T14:00:00Z',
  },
  {
    id: 'm7',
    lat: 15.5524,
    lng: 73.7519,
    hazardType: 'rip-current',
    confidence: 76,
    locationName: 'Baga Beach',
    severity: 'low',
    summary: 'Moderate rip current activity. Swimmers advised to stay near lifeguard stations.',
    timestamp: '2026-01-09T10:20:00Z',
  },
  {
    id: 'm8',
    lat: 16.8524,
    lng: 73.3120,
    hazardType: 'erosion',
    confidence: 72,
    locationName: 'Ratnagiri Coast',
    severity: 'low',
    summary: 'Minor erosion patterns observed. Long-term monitoring initiated.',
    timestamp: '2026-01-08T23:00:00Z',
  },
]

export const heatZones: HeatZone[] = [
  { id: 'hz1', lat: 19.0760, lng: 72.8777, radius: 8000, riskLevel: 'high', hazardType: 'flood' },
  { id: 'hz2', lat: 15.4909, lng: 73.8278, radius: 5000, riskLevel: 'high', hazardType: 'rip-current' },
  { id: 'hz3', lat: 18.9220, lng: 72.8347, radius: 4000, riskLevel: 'medium', hazardType: 'erosion' },
  { id: 'hz4', lat: 15.2993, lng: 74.1240, radius: 6000, riskLevel: 'high', hazardType: 'storm-surge' },
  { id: 'hz5', lat: 19.1136, lng: 72.8697, radius: 3000, riskLevel: 'medium', hazardType: 'pollution' },
  { id: 'hz6', lat: 16.8524, lng: 73.3120, radius: 4000, riskLevel: 'low', hazardType: 'erosion' },
]

export const safetyTipsByHazard: Record<string, string[]> = {
  flood: [
    'Move to higher ground immediately',
    'Avoid walking or driving through flood waters',
    'Stay away from power lines and electrical wires',
    'Keep emergency supplies ready',
  ],
  'rip-current': [
    'Swim parallel to shore to escape the current',
    'Do not fight against the current',
    'Signal for help if needed',
    'Swim at lifeguard-protected beaches',
  ],
  erosion: [
    'Stay away from cliff edges and unstable ground',
    'Report any new cracks or land movement',
    'Follow posted warning signs',
    'Avoid building near eroding coastlines',
  ],
  'storm-surge': [
    'Evacuate if ordered by authorities',
    'Move to higher floors in sturdy buildings',
    'Stay away from windows during storms',
    'Have an emergency kit prepared',
  ],
  tsunami: [
    'Move inland and to higher ground immediately',
    'Stay away from the coast until all-clear is given',
    'Follow official evacuation routes',
    'Do not return until authorities say it is safe',
  ],
  pollution: [
    'Avoid swimming in affected waters',
    'Do not consume seafood from polluted areas',
    'Report any unusual discharges or spills',
    'Keep children and pets away from contaminated areas',
  ],
}
