import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🤖 Assistant IA - Analyse projet:', body)

    const response = await fetch(`${BACKEND_URL}/api/assistant-ia/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Erreur analyse IA')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ Erreur Assistant IA:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
