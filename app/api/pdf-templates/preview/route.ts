import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/pdf-templates/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erreur preview PDF' }))
      return NextResponse.json(err, { status: response.status })
    }

    const pdfBuffer = await response.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="apercu-template.pdf"',
        'Content-Length': String(pdfBuffer.byteLength),
      },
    })
  } catch (error: any) {
    console.error('Erreur proxy preview PDF:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
