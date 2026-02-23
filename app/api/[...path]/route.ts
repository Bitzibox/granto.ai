import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    const backendUrl = `${BACKEND_URL}/api/${path}${queryString ? '?' + queryString : ''}`
    
    console.log('🔄 Proxy GET:', backendUrl)
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ Erreur proxy GET:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const body = await request.json()
    
    const backendUrl = `${BACKEND_URL}/api/${path}`
    
    console.log('🔄 Proxy POST:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ Erreur proxy POST:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const body = await request.json()
    
    const backendUrl = `${BACKEND_URL}/api/${path}`
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ Erreur proxy PUT:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')

    const backendUrl = `${BACKEND_URL}/api/${path}`

    console.log('🔄 Proxy DELETE:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 204 No Content n'a pas de body
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ Erreur proxy DELETE:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
