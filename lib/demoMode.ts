// Demo Mode Utilities
// Enable with NEXT_PUBLIC_DEMO_MODE=true in .env.local

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Demo report data for auto-fill
export const demoReportData = {
  hazardType: 'flood',
  description: 'Severe flooding observed near the coastal road. Water level rising rapidly due to high tide combined with heavy rainfall. Multiple vehicles stranded. Immediate attention required.',
  location: {
    lat: 19.0760,
    lng: 72.8777,
    address: 'Marine Drive, Mumbai',
  },
}

// Demo social verification examples
export const demoSocialPosts = [
  {
    type: 'text' as const,
    content: 'URGENT: Massive flooding at Marina Beach! Water everywhere, people evacuating. Stay safe everyone! #ChennaiFloods #Emergency',
    expectedResult: 'uncertain',
  },
  {
    type: 'text' as const,
    content: 'Minor water logging observed near Juhu Beach after morning rain. Drainage working, situation under control. Local authorities monitoring.',
    expectedResult: 'verified',
  },
  {
    type: 'text' as const,
    content: 'BREAKING: 50 foot tsunami wave heading to Mumbai coast!!! EVACUATE NOW!!! Share before deleted!!!',
    expectedResult: 'likely_false',
  },
]

// Demo alert trigger
export const demoHighRiskAlert = {
  severity: 'high' as const,
  title: 'DEMO: Cyclone Warning Issued',
  message: 'This is a demo alert. Cyclone expected to make landfall in 24 hours. All coastal residents advised to evacuate.',
}

// Demo mode banner message
export const demoBannerMessage = 'Demo Mode Active - Data shown is simulated for demonstration purposes'
