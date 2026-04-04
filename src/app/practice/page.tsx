'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTransStore } from '@/store/useTransStore'
import { useTimer } from '@/hooks/useTimer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import TextareaAutosize from 'react-textarea-autosize'
import { ArrowLeft, Pause, Play, Square, Clock, AlertCircle, Layout } from 'lucide-react'

export default function PracticePage() {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const {
    sentences,
    userTranslations,
    currentIndex,
    referenceTranslations,
    status,
    timer,
    currentTitle,
    layout,
    updateUserTranslation,
    nextSentence,
    prevSentence,
    goToSentence,
    setStatus,
    pausePractice,
    resumePractice,
    endPractice,
    saveDraft,
    clearDraft,
    setLayout,
  } = useTransStore()

  const { formattedTime, isRunning } = useTimer()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'idle' || sentences.length === 0) {
        router.push('/setup')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [status, sentences.length, router])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [currentIndex])

  // 自动保存草稿
  useEffect(() => {
    if (status === 'training' || status === 'paused') {
      const interval = setInterval(() => {
        saveDraft()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [status, saveDraft])

  // 页面卸载时保存草稿
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveDraft()
    }
  }, [saveDraft])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (currentIndex < sentences.length - 1) {
        nextSentence()
      } else {
        handleSubmit()
      }
    }
  }, [currentIndex, sentences.length, nextSentence])

  const handleSubmit = () => {
    clearDraft()
    endPractice()
    router.push('/analysis')
  }

  const handleUpdateTranslation = (index: number, translation: string) => {
    updateUserTranslation(index, translation)
    saveDraft()
  }

  const handlePause = () => {
    if (status === 'training') {
      pausePractice()
    } else if (status === 'paused') {
      resumePractice()
    }
  }

  const progress = ((currentIndex + 1) / sentences.length) * 100

  if (sentences.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push('/setup')}>
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">重新设置</span>
            </Button>
            <span className="text-slate-500 text-sm sm:hidden">
              {currentIndex + 1}/{sentences.length}
            </span>
            <span className="text-slate-500 hidden sm:inline">
              {currentTitle || '翻译练习'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:gap-6">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-20 sm:w-32" />
              <span className="text-sm text-slate-500 hidden sm:inline">
                {currentIndex + 1}/{sentences.length} 句
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formattedTime}</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant={status === 'paused' ? 'primary' : 'outline'}
                size="sm"
                onClick={handlePause}
                className="px-2 sm:px-4"
              >
                {status === 'paused' ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                <span className="hidden sm:inline ml-1">{status === 'paused' ? '继续' : '暂停'}</span>
              </Button>

              <Button variant="destructive" size="sm" onClick={handleSubmit} className="px-2 sm:px-4">
                <Square className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">提交</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className={`max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-8 ${status === 'paused' ? 'blur-sm' : ''}`}>
        {/* 布局切换按钮 */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')}
          >
            <Layout className="w-4 h-4 mr-2" />
            {layout === 'horizontal' ? '上下排列' : '左右排列'}
          </Button>
        </div>

        {/* 左右布局 */}
        <div className={layout === 'horizontal' ? 'grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6' : 'hidden'}>
          {/* 原文预览区 - PC端 */}
          <div className="hidden lg:block lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-slate-500 mb-3">原文预览</h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {sentences.map((sentence, index) => (
                    <div
                      key={index}
                      onClick={() => goToSentence(index)}
                      className={`
                        p-2 rounded cursor-pointer transition-all text-xs
                        ${index === currentIndex 
                          ? 'bg-indigo-100 border-l-4 border-indigo-600 shadow-sm scale-[1.02]' 
                          : index < currentIndex
                            ? 'bg-green-50 opacity-60'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }
                      `}
                    >
                      <span className="text-slate-500 mr-1">{index + 1}.</span>
                      <span className={index === currentIndex ? 'font-semibold text-indigo-900' : ''}>{sentence}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 翻译输入区 */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4">
                  <span className="text-sm text-slate-500">当前句子</span>
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 mt-1">
                    {sentences[currentIndex]}
                  </h3>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    请输入翻译
                  </label>
                  <TextareaAutosize
                    ref={textareaRef}
                    value={userTranslations[currentIndex]}
                    onChange={(e) => handleUpdateTranslation(currentIndex, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="在此输入英文翻译..."
                    className="w-full min-h-[150px] sm:min-h-[200px] p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-base"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevSentence}
                    disabled={currentIndex === 0}
                  >
                    上一句
                  </Button>
                  
                  <span className="text-xs sm:text-sm text-slate-500">
                    Enter 下一句
                  </span>
                  
                  {currentIndex < sentences.length - 1 ? (
                    <Button size="sm" onClick={nextSentence}>
                      下一句
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={handleSubmit}>
                      提交分析
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 上下布局 */}
        <div className={layout === 'vertical' ? 'space-y-4' : 'hidden'}>
          {/* 原文预览 */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-slate-500 mb-3">原文预览</h3>
              <div className="max-h-[30vh] overflow-y-auto space-y-2">
                {sentences.map((sentence, index) => (
                  <div
                    key={index}
                    onClick={() => goToSentence(index)}
                    className={`
                      p-2 rounded cursor-pointer transition-all text-sm
                      ${index === currentIndex 
                        ? 'bg-indigo-100 border-l-4 border-indigo-600 shadow-sm scale-[1.02]' 
                        : index < currentIndex
                          ? 'bg-green-50 opacity-60'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }
                    `}
                  >
                    <span className="text-slate-500 mr-1">{index + 1}.</span>
                    <span className={index === currentIndex ? 'font-semibold text-indigo-900' : ''}>{sentence}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 当前句子 */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4">
                <span className="text-sm text-slate-500">当前句子</span>
                <h3 className="text-lg sm:text-xl font-medium text-slate-900 mt-1">
                  {sentences[currentIndex]}
                </h3>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  请输入翻译
                </label>
                <TextareaAutosize
                  ref={textareaRef}
                  value={userTranslations[currentIndex]}
                  onChange={(e) => handleUpdateTranslation(currentIndex, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="在此输入英文翻译..."
                  className="w-full min-h-[180px] sm:min-h-[200px] p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-base"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSentence}
                  disabled={currentIndex === 0}
                >
                  上一句
                </Button>
                
                <span className="text-xs sm:text-sm text-slate-500">
                  Enter 下一句
                </span>
                
                {currentIndex < sentences.length - 1 ? (
                  <Button size="sm" onClick={nextSentence}>
                    下一句
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit}>
                    提交分析
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 暂停遮罩层 */}
      {status === 'paused' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                计时已暂停
              </h2>
              <p className="text-slate-500 mb-6">
                当前用时: {formattedTime}
              </p>
              <Button variant="primary" size="lg" onClick={resumePractice}>
                <Play className="w-5 h-5 mr-2" />
                继续练习
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
