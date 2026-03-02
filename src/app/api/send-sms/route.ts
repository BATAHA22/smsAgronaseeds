import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phone, message, from } = await request.json()

    // Validate inputs
    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing phone or message' },
        { status: 400 }
      )
    }

    // Always read API Key from server env only
    const key = process.env.HTTPSMS_API_KEY

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'API Key is required' },
        { status: 401 }
      )
    }

    // Whitelist allowed sender numbers
    const allowedFrom = new Set(['+213660591470', '+213550090981'])
    const finalFrom =
      (typeof from === 'string' && allowedFrom.has(from) ? from : undefined) ||
      process.env.HTTPSMS_FROM_NUMBER ||
      '+213660591470'

    const payload = {
      content: message,
      encrypted: false,
      from: finalFrom,
      to: phone,
    }

    console.log('Sending to HTTPSMS:', JSON.stringify(payload, null, 2))

    const response = await fetch('https://api.httpsms.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('HTTPSMS Error:', data)
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to send SMS' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Internal Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
