'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTransStore, HistoryItem, AnalysisResult } from '@/store/useTransStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Clock, Trophy, AlertCircle, CheckCircle, Sparkles, FileText } from 'lucide-react'

interface SentenceAnalysis {
  sentenceIndex: number
  score: number
  errors: Array<{
    original: string
    suggestion: string
    reason: string
  }>
  polish: string
  comment: string
}

export default function HistoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null)
  const { history } = useTransStore()

  useEffect(() => {
    const id = params.id as string
    const item = history.find(h => h.id === id)
    if (item) {
      setHistoryItem(item)
    } else if (history.length > 0) {
      router.push('/')
    }
  }, [params.id, history, router])

  if (!historyItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">加载中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const results = historyItem.analysis as SentenceAnalysis[] | undefined
  const averageScore = historyItem.score
  const sentences = historyItem.sentences
  const userTranslations = historyItem.userTranslations
  const referenceTranslations = historyItem.referenceTranslations

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回主页
          </Button>
        </div>

        {/* 标题和总览区 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{historyItem.title}</CardTitle>
            <p className="text-sm text-slate-500">{historyItem.date}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-sm text-slate-500">总用时</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-2xl font-semibold">{formatTime(historyItem.totalTime)}</span>
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
              />
            </div>
          </CardContent>
        </Card>

        {/* 逐句分析 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">详细分析</h2>
          
          {sentences.map((sentence, index) => {
            const result = results?.[index]
            const userTranslation = userTranslations[index] || ''
            const refTranslation = referenceTranslations?.[index] || ''

            return (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      第 {index + 1} 句
                    </CardTitle>
                    {result && (
                      <div className={`text-lg font-semibold ${
                        result.score >= 80 ? 'text-green-600' :
                        result.score >= 60 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {result.score}分
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{sentence}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">你的译文</p>
                    <p className="text-slate-900 bg-slate-50 p-3 rounded">
                      {userTranslation || '(未翻译)'}
                    </p>
                  </div>

                  {refTranslation && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">参考译文</p>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded">
                        {refTranslation}
                      </p>
                    </div>
                  )}

                  {result && result.errors && result.errors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-2">错误诊断</p>
                      <div className="space-y-2">
                        {result.errors.map((error, errIndex) => (
                          <div key={errIndex} className="bg-red-50 border border-red-100 p-3 rounded">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm">
                                  <span className="line-through text-red-500">{error.original}</span>
                                  {' → '}
                                  <span className="text-green-600 font-medium">{error.suggestion}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{error.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result && result.polish && (
                    <div>
                      <p className="text-sm font-medium text-indigo-600 mb-2">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        进阶表达建议
                      </p>
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded">
                        <p className="text-sm text-indigo-900">{result.polish}</p>
                      </div>
                    </div>
                  )}

                  {result && result.comment && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{result.comment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
