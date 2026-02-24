import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    // Transférer le formData tel quel au backend
    const formData = await request.formData()

    const response = await fetch(`${BACKEND_URL}/api/upload/logo`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Erreur proxy upload:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
