import { NextRequest, NextResponse } from 'next/server'
import { verifySocialContent } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { type, content } = body
    
    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type and content' },
        { status: 400 }
      )
    }

    const result = await verifySocialContent({ type, content })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Social verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
