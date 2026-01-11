import { NextRequest, NextResponse } from 'next/server'
import { verifyHazardReport } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { hazardType, description, location, hasMedia } = body
    
    if (!hazardType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: hazardType and description' },
        { status: 400 }
      )
    }

    const result = await verifyHazardReport({
      hazardType,
      description,
      location,
      hasMedia: hasMedia || false,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
