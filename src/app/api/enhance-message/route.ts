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
    أنت خبير تسويق واتصال محترف متخصص في السوق الجزائري. مهمتك تحسين رسالة SMS التالية:
    "${text}"

    القواعد الصارمة:
    1. اكتشف لغة الرسالة وحسنها بنفس الأسلوب (دارجة أو فصحى).
    2. حافظ على المتغيرات الموجودة بين أقواس مربعة كما هي بالضبط (مثل [المستلم]) ولا تكررها أو تحشوها بلا داع.
    3. اجعل الرسالة قصيرة (أقل من 160 حرف) ومباشرة.
    4. هام جداً: لا تكتب أي مقدمات مثل "إليك الرسالة المحسنة" أو أي تعليقات. أكتب فقط نص الرسالة النهائي.
    
    أمثلة:
    Input: "مرحبا [المستلم] راهي لحقت سلعتك"
    Output: "سلام [المستلم]، طلبيتك وصلت! يرجى استلامها في أقرب وقت. شكراً"
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
