import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.Mistral

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Mistral API Key is missing' },
        { status: 500 }
      )
    }

    const prompt = `
    أنت خبير تسويق واتصال محترف. قم بتحسين رسالة الـ SMS التالية لتكون أكثر جاذبية، احترافية، وقصيرة (أقل من 160 حرف قدر الإمكان).
    حافظ على المتغيرات الموجودة بين أقواس مربعة كما هي مثل [المستلم]، [الهاتف]، [المنتج]، [الولاية].
    اجعل اللهجة ودودة ومناسبة للعملاء في الجزائر.
    
    الرسالة الأصلية:
    "${text}"
    
    فقط أعد النص المحسن بدون أي مقدمات أو شرح.
    `

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mistral API Error:', response.status, errorText)
      return NextResponse.json(
        { success: false, error: `Failed to enhance message: ${response.status} ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    let enhancedText = data?.choices?.[0]?.message?.content?.trim() || text

    // Clean quotes if the model wrapped the response in them
    if (enhancedText.startsWith('"') && enhancedText.endsWith('"')) {
      enhancedText = enhancedText.slice(1, -1)
    } else if (enhancedText.startsWith("'") && enhancedText.endsWith("'")) {
      enhancedText = enhancedText.slice(1, -1)
    }

    return NextResponse.json({ success: true, enhancedText })
  } catch (error) {
    console.error('Internal Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
