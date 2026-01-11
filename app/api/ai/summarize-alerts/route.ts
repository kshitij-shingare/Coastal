import { NextRequest, NextResponse } from 'next/server'
import { summarizeAlerts } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { alerts } = body
    
    if (!alerts || !Array.isArray(alerts)) {
      return NextResponse.json(
        { error: 'Missing required field: alerts (array)' },
        { status: 400 }
      )
    }

    const summary = await summarizeAlerts(alerts)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summarization error:', error)
    return NextResponse.json(
      { error: 'Summarization failed' },
      { status: 500 }
    )
  }
}
