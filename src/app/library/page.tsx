'use client'

import { useRouter } from 'next/navigation'
import { useTransStore } from '@/store/useTransStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LibraryItem {
  id: string
  title: string
  sentences: string[]
  reference?: string
}

interface LibraryCategory {
  id: string
  name: string
  items: LibraryItem[]
}

export default function LibraryPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/library')
      .then(res => res.json())
      .then(data => {
        setCategories(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelectItem = (item: LibraryItem) => {
    const { setSentences, setReferenceTranslations, setCurrentTitle, setStatus } = useTransStore.getState()
    setCurrentTitle(item.title)
    setSentences(item.sentences)
    setReferenceTranslations(item.reference ? [item.reference] : [])
    setStatus('training')
    router.push('/practice')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-xl font-semibold text-slate-900">练习库</h1>
        </div>

        {categories.length === 0 ? (
          <p className="text-slate-500 text-center py-8">暂无可用文段</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div 
                key={cat.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
                onClick={() => router.push(`/library/${cat.id}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-slate-900">{cat.name}</span>
                </div>
                <p className="text-sm text-slate-500">{cat.items.length} 篇</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}