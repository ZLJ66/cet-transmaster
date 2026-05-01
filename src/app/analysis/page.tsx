'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTransStore, HistoryItem } from '@/store/useTransStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, RefreshCw, Clock, Trophy, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'

interface SentenceAnalysis {
  sentenceIndex: number
  originalSentence: string
  userTranslation: string
  referenceTranslation?: string
  score: number
  errors: Array<{
    original: string
    suggestion: string
    reason: string
  }>
  polish: string[]
  comment: string
}

interface AnalysisResponse {
  overallScore: number
  overallComment: string
  sentenceAnalyses: SentenceAnalysis[]
}

export default function AnalysisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResponse | null>(null)
  const analyzedRef = useRef(false)

  const {
    sentences,
    userTranslations,
    referenceTranslations,
    timer,
    currentTitle,
    apiConfig,
    addHistory,
    status,
    setStatus,
    reset,
  } = useTransStore()

  useEffect(() => {
    if (status !== 'completed' || sentences.length === 0) {
      if (status !== 'completed' && sentences.length > 0) {
        router.push('/setup')
      }
      return
    }
    
    if (analyzedRef.current) return
    
    analyzedRef.current = true
    analyzeTranslations()
  }, [status, sentences.length, router])

  const analyzeTranslations = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: apiConfig.provider,
          apiKey: apiConfig.apiKey,
          model: apiConfig.model,
          baseUrl: apiConfig.baseUrl,
          sentences,
          userTranslations,
          referenceTranslations,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '分析失败')
      }

      setResults(data)
      
      const historyItem: Omit<HistoryItem, 'id'> = {
        date: new Date().toLocaleDateString('zh-CN'),
        title: currentTitle || '未命名练习',
        totalTime: timer,
        score: data.overallScore,
        sentences,
        userTranslations,
        referenceTranslations,
        analysis: data.sentenceAnalyses,
      }
      addHistory(historyItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setAnalyzing(false)
      setLoading(false)
    }
  }

  const averageScore = results?.overallScore ?? 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleNewPractice = () => {
    reset()
    router.push('/setup')
  }

  const handleBackHome = () => {
    reset()
    router.push('/')
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              AI 正在分析中...
            </h2>
            <p className="text-slate-500">
              请稍候，这可能需要几秒钟
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              分析失败
            </h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleBackHome}>
                返回主页
              </Button>
              <Button variant="primary" onClick={analyzeTranslations}>
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={handleBackHome}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回主页
          </Button>
          <Button variant="primary" onClick={handleNewPractice}>
            练习下一篇
          </Button>
        </div>

        {/* 总览区 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">练习完成！</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-sm text-slate-500">总用时</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-2xl font-semibold">{formatTime(timer)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">综合评分</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Trophy className={`w-5 h-5 ${
                      averageScore >= 80 ? 'text-green-500' :
                      averageScore >= 60 ? 'text-amber-500' :
                      'text-red-500'
                    }`} />
                    <span className={`text-2xl font-semibold ${
                      averageScore >= 80 ? 'text-green-600' :
                      averageScore >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {averageScore}分
                    </span>
                  </div>
                </div>
              </div>
              <Progress 
                value={averageScore} 
                className="w-32"
                style={{
                  '--progress-foreground': averageScore >= 80 ? '#16a34a' : averageScore >= 60 ? '#f59e0b' : '#ef4444'
                } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>

        {/* 逐句分析 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">详细分析</h2>
          
          {results?.sentenceAnalyses.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    第 {index + 1} 句
                  </CardTitle>
                  <div className={`text-lg font-semibold ${
                    result.score >= 80 ? 'text-green-600' :
                    result.score >= 60 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {result.score}分
                  </div>
                </div>
                <p className="text-sm text-slate-500">{result.originalSentence}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">你的译文</p>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded">
                    {result.userTranslation || '(未翻译)'}
                  </p>
                </div>

                {result.referenceTranslation && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">参考译文</p>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded">
                      {result.referenceTranslation}
                    </p>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">错误诊断</p>
                    <div className="space-y-2">
                      {result.errors.map((err, errIndex) => (
                        <div key={errIndex} className="bg-red-50 border border-red-100 p-3 rounded">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm">
                                <span className="line-through text-red-500">{err.original}</span>
                                {' → '}
                                <span className="text-green-600 font-medium">{err.suggestion}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-1">{err.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.polish && result.polish.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-indigo-600 mb-2">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      进阶表达建议
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded space-y-2">
                      {result.polish.map((p, idx) => (
                        <p key={idx} className="text-sm text-indigo-900">{idx + 1}. {p}</p>
                      ))}
                    </div>
                  </div>
                )}

                {result.comment && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{result.comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

        </div>
      </div>
    </div>
  )
}
