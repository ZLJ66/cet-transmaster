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

const KNOWLEDGE_BASE = `
## 翻译技巧核心知识

### 七大翻译策略
1. 确立主干 - 识别并构建句子核心结构（主语+谓语）
2. 语序调整 - 定语/状语位置调整、叙事重心调整
3. 正反表达转换 - 汉语正说英语反译、汉语反说英语正译
4. 语态转换 - 主动↔被动灵活转换
5. 句式重构 - 增词法、减词法、分译与合译
6. 词类转换 - 名↔动、动↔名、形↔副转换

### 高频句式（必须掌握）
- "not only…, but also…"（最重要，39次）
- "especially for…"（23次）
- "A enjoys great popularity"（受欢迎）
- "It is one of the + 最高级"（最...之一）
- "has a history of…years"（有...年历史）
- "Since ancient times, …"（自古以来）
- "With the rapid development of…"（随着...发展）
- "the+比较级+…, the+比较级"（越...越...）
- "倍数词+as+形容词+as"（是...的几倍）

### 翻译方法论
- 套用模板法：优先匹配高频句式
- 避免直译：意译或功能对等
- 灵活连接：使用逻辑连接词增强连贯性
- 语境适配：根据话题选择恰当词汇风格
`

const SYSTEM_PROMPT = `你是一位专业的四六级英语老师，擅长四六级及专业四八级考试翻译指导。

## 学习资料
${KNOWLEDGE_BASE}

## 任务要求
请对比用户译文与参考译文（如果有），根据上述翻译技巧和句式知识进行分析。

请输出 JSON 格式的分析结果：
{
  "overallScore": 85,
  "overallComment": "总体评价",
  "sentenceAnalyses": [
    {
      "sentenceIndex": 0,
      "originalSentence": "中文原句",
      "userTranslation": "用户翻译",
      "referenceTranslation": "参考翻译（如果有）",
      "score": 85,
      "errors": [
        {
          "original": "错误的表达",
          "suggestion": "正确的表达",
          "reason": "错误原因说明"
        }
      ],
      "polish": [
        "进阶表达建议1",
        "进阶表达建议2",
        "进阶表达建议3"
      ],
      "comment": "该句评价"
    }
  ]
}

**重要**：polish 字段必须是数组，包含 3-5 条进阶表达建议。如果句子比较简单，可以只提供 1-2 条。每条建议必须是**不同的表达方式**，使用不同的词汇、句式或短语，避免重复。

评分标准：
- 100分：完全正确，地道表达，恰当使用高频句式
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

    const userFullTranslation = userTranslations.join('\n')
    const referenceFull = referenceTranslations[0] || ''
    const sentencesText = sentences.join('\n')
    
    const userMessages = `中文原文:
${sentencesText}

用户完整译文:
${userFullTranslation}
${referenceFull ? `\n参考译文:\n${referenceFull}` : ''}`

    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessages }
      ],
      temperature: 0.3,
    }

    let url = ''
    const headers: Record<string, string> = {
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

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return NextResponse.json(result)
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
