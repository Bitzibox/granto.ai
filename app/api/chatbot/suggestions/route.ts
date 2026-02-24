import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || 'default'

    const response = await fetch(`${BACKEND_URL}/api/chatbot/suggestions?page=${page}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { suggestions: ['Comment fonctionne Granto ?', 'Quelles subventions pour ma commune ?'] },
      { status: 200 }
    )
  }
}
