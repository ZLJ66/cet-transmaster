import { NextRequest, NextResponse } from 'next/server'

interface AnalyzeRequest {
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  sentences: string[]
  userTranslations: string[]
  referenceTranslations: string[]
}

const SYSTEM_PROMPT = `你是一位专业的四六级英语老师。请对比用户译文与标准译文。

请对每句话进行分析，输出 JSON 格式数组：
[
  {
    "sentenceIndex": 0,
    "score": 85,
    "errors": [
      {
        "original": "错误的表达",
        "suggestion": "正确的表达",
        "reason": "错误原因说明"
      }
    ],
    "polish": "更地道的表达建议",
    "comment": "总体评价"
  }
]

评分标准：
- 100分：完全正确，地道表达
- 90-99分：基本正确，有小错误或可以改进的地方
- 80-89分：有一些语法错误或用词不当
- 70-79分：有多处语法错误或表达不够准确
- 60-69分：基本能表达意思，但有多处错误
- 60分以下：理解有偏差或错误较多

请严格按照 JSON 格式输出，不要添加任何解释。`

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()
    const { provider, apiKey, model, baseUrl, sentences, userTranslations, referenceTranslations } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 API Key' },
        { status: 400 }
      )
    }

    const userMessages = sentences.map((sentence, index) => {
      const userTranslation = userTranslations[index] || ''
      const reference = referenceTranslations[index] || ''
      
      return `原句: ${sentence}
你的译文: ${userTranslation}
${reference ? `参考译文: ${reference}` : ''}`
    }).join('\n\n')

    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessages }
      ],
      temperature: 0.3,
    }

    let url = ''
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    switch (provider) {
      case 'openai':
        url = (baseUrl || 'https://api.openai.com/v1') + '/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'deepseek':
        url = (baseUrl || 'https://api.deepseek.com/v1') + '/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'gemini':
        url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`
        requestBody.contents = [{
          parts: [{ text: userMessages }]
        }]
        break
      case 'zhipu':
        url = (baseUrl || 'https://open.bigmodel.cn/api/paas/v4') + '/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'minimax':
        url = `https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${apiKey.split(':')[0]}`
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'qwen':
        url = (baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1') + '/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'anthropic':
        url = (baseUrl || 'https://api.anthropic.com') + '/v1/messages'
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        requestBody.system = SYSTEM_PROMPT
        requestBody.messages = [{ role: 'user', content: userMessages }]
        break
      case 'ollama':
        url = (baseUrl || 'http://localhost:11434') + '/api/chat'
        requestBody.stream = false
        break
      case 'custom':
        if (!baseUrl) {
          return NextResponse.json(
            { error: '自定义 API 需要填写 Base URL' },
            { status: 400 }
          )
        }
        url = baseUrl + '/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      default:
        return NextResponse.json(
          { error: '不支持的 AI 服务商' },
          { status: 400 }
        )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json(
          { error: `API 请求失败: ${response.status} - ${errorText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      
      let content = ''
      if (provider === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else if (provider === 'anthropic') {
        content = data.content?.[0]?.text || ''
      } else if (provider === 'ollama') {
        content = data.message?.content || ''
      } else {
        content = data.choices?.[0]?.message?.content || ''
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0])
        return NextResponse.json({ results })
      } else {
        return NextResponse.json(
          { error: '无法解析 AI 返回的内容' },
          { status: 500 }
        )
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: '请求超时，请检查网络或 API 配置' },
          { status: 408 }
        )
      }
      
      throw error
    }
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '分析失败' },
      { status: 500 }
    )
  }
}
