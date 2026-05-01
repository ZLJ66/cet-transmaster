'use client'

import { useRouter, useParams } from 'next/navigation'
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

interface ItemCardProps {
  item: LibraryItem
  onClick: () => void
}

function ItemCard({ item, onClick }: ItemCardProps) {
  const preview = item.sentences.slice(0, 2).join(' ')

  return (
    <div 
      className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-slate-900">{item.title}</h3>
      </div>
      <p className="text-sm text-slate-500 line-clamp-2">{preview}</p>
    </div>
  )
}

export default function LibraryPage() {
  const router = useRouter()
  const params = useParams()
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const categoryId = params.category as string | undefined
  const { setSentences, setReferenceTranslations, setCurrentTitle, setStatus } = useTransStore()

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
    setCurrentTitle(item.title)
    setSentences(item.sentences)
    setReferenceTranslations(item.reference ? [item.reference] : [])
    setStatus('training')
    router.push('/practice')
  }

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  // 有分类ID，显示该分类下的文段列表
  if (categoryId) {
    const category = categories.find(c => c.id === categoryId)
    
    if (!category) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">分类不存在</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/library')}>
                返回练习库
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/library')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <h1 className="text-xl font-semibold text-slate-900">{category.name}</h1>
          </div>

          <div className="space-y-3">
            {category.items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onClick={() => handleSelectItem(item)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 没有分类ID，显��分类列表
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