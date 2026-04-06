'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransStore } from '@/store/useTransStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, FileText, BarChart3, Trash2, AlertTriangle } from 'lucide-react'

export function Dashboard() {
  const router = useRouter()
  const { history, deleteHistory, apiConfig } = useTransStore()

  const hasApiKey = !!apiConfig.apiKey

  const totalPractice = history.length
  const averageTime = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + h.totalTime, 0) / history.length)
    : 0
  const averageScore = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + h.score, 0) / history.length)
    : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {!hasApiKey && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">请先配置 AI API Key</p>
            <p className="text-amber-700 text-sm mt-1">
              点击右上角「API 设置」配置 AI 服务商，否则无法使用 AI 分析功能。
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          欢迎回来，今天准备练一篇吗？
        </h2>
        <p className="text-slate-500">
          点击「开始练习」进入翻译训练
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              已练习篇数
            </CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalPractice}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              平均用时
            </CardTitle>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {averageTime > 0 ? formatTime(averageTime) : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              平均分
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {averageScore > 0 ? averageScore : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 开始练习按钮 */}
      <div className="flex justify-center mb-12">
        <Link href="/setup">
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            开始练习
          </Button>
        </Link>
      </div>

      {/* 历史记录 */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">最近记录</h3>
        
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              暂无练习记录
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <Card 
                key={item.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/history/${item.id}`)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-500">{item.date}</div>
                    <div className="font-medium text-slate-900 truncate">
                      {item.title || '无标题'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 ml-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm text-slate-500">{formatTime(item.totalTime)}</div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      item.score >= 80 ? 'text-green-600' :
                      item.score >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {item.score}分
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/history/${item.id}`)
                      }}
                      className="hidden sm:flex"
                    >
                      查看
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteHistory(item.id)
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
