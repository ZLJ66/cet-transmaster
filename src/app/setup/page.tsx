'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTransStore } from '@/store/useTransStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, ArrowLeft, Plus, Minus, Edit2 } from 'lucide-react'

function splitChineseText(text: string): string[] {
  if (!text.trim()) return []
  const sentences = text.split(/([。？！\n])/)
  const result: string[] = []
  let current = ''
  
  for (const part of sentences) {
    if (part === '。' || part === '！' || part === '？' || part === '\n') {
      current += part
      if (current.trim()) result.push(current.trim())
      current = ''
    } else {
      current += part
    }
  }
  
  if (current.trim()) result.push(current.trim())
  return result.filter(s => s.trim())
}

export default function SetupPage() {
  const router = useRouter()
  const { setSentences, setReferenceTranslations, setCurrentTitle, setStatus } = useTransStore()
  
  const [sourceText, setSourceText] = useState('')
  const [referenceText, setReferenceText] = useState('')
  const [title, setTitle] = useState('')
  const [splitSentences, setSplitSentences] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const handleSplit = () => {
    const sentences = splitChineseText(sourceText)
    setSplitSentences(sentences)
  }

  const handleMerge = (index: number) => {
    if (index < splitSentences.length - 1) {
      const newSentences = [...splitSentences]
      newSentences[index] = newSentences[index] + newSentences[index + 1]
      newSentences.splice(index + 1, 1)
      setSplitSentences(newSentences)
    }
  }

  const handleResplit = (index: number) => {
    const newSentences = [...splitSentences]
    const parts = splitChineseText(newSentences[index])
    if (parts.length > 1) {
      newSentences.splice(index, 1, ...parts)
      setSplitSentences(newSentences)
    }
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditText(splitSentences[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newSentences = [...splitSentences]
      newSentences[editingIndex] = editText
      setSplitSentences(newSentences)
      setEditingIndex(null)
      setEditText('')
    }
  }

  const handleStartPractice = () => {
    setCurrentTitle(title || '未命名练习')
    setSentences(splitSentences)
    setReferenceTranslations(referenceText ? [referenceText] : [])
    setStatus('training')
    router.push('/practice')
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">返回主页</span>
          </Button>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900">步骤 1: 准备文段</h1>
        </div>
        <Button 
          variant="primary" 
          onClick={handleStartPractice}
          disabled={splitSentences.length === 0}
          className="w-full sm:w-auto"
        >
          开始翻译
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">中文原文（必填）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="输入需要翻译的中文段落..."
              className="min-h-[150px] sm:min-h-[200px]"
            />
            <Button 
              className="mt-4 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6"
              onClick={handleSplit}
              disabled={!sourceText.trim()}
            >
              智能拆分
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">参考译文（选填）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="输入参考译文（用于 AI 对比分析）..."
              className="min-h-[150px] sm:min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">练习标题（选填）</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这次练习起个名字..."
            className="max-w-full sm:max-w-md"
          />
        </CardContent>
      </Card>

      {splitSentences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>句子拆分预览（{splitSentences.length} 句）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {splitSentences.map((sentence, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-3 bg-slate-50 rounded-lg group"
                >
                  <span className="text-slate-400 font-medium w-8 flex-shrink-0">
                    {index + 1}.
                  </span>
                  
                  {editingIndex === index ? (
                    <div className="flex-1 flex gap-2 flex-wrap">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 min-w-[120px]"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        保存
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                        取消
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-slate-900 text-sm sm:text-base">{sentence}</span>
                      <div className="flex gap-1 opacity-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {index < splitSentences.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMerge(index)}
                            title="与下一句合并"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResplit(index)}
                          title="在当前位置拆分"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
