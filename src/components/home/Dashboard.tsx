'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransStore } from '@/store/useTransStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, FileText, BarChart3, Trash2, FolderOpen, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function Dashboard() {
  const router = useRouter()
  const { history, deleteHistory, draft, loadDraftToState, clearDraft } = useTransStore()
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  useEffect(() => {
    if (draft && draft.sentences.length > 0) {
      setShowResumeDialog(true)
    }
  }, [draft])

  const handleResume = () => {
    loadDraftToState()
    setShowResumeDialog(false)
    router.push('/practice')
  }

  const handleDiscard = () => {
    clearDraft()
    setShowResumeDialog(false)
  }

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
      <div className="flex justify-center mb-8">
        <Link href="/setup">
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            开始练习
          </Button>
        </Link>
      </div>

      {/* 练习库 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">练习库</h3>
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/library')}
        >
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-medium text-slate-900">从练习库选择文段</p>
                <p className="text-sm text-slate-500">包含四级真题、六级真题等</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发现未完成的练习</DialogTitle>
            <DialogDescription>
              您有一次未完成的翻译练习，是否继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscard}>
              放弃
            </Button>
            <Button variant="primary" onClick={handleResume}>
              继续练习
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}