'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, History, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTransStore } from '@/store/useTransStore'
import { ApiSettingsDialog } from './ApiSettingsDialog'

export function Header() {
  const pathname = usePathname()
  const { status, reset } = useTransStore()

  const handleStartNew = () => {
    reset()
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link 
          href="/" 
          className="text-xl font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
          onClick={handleStartNew}
        >
          CET-TransMaster
        </Link>
        
        <nav className="flex items-center gap-2">
          {pathname !== '/' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <BookOpen className="w-4 h-4 mr-2" />
                首页
              </Link>
            </Button>
          )}
          
          <Button variant="ghost" size="sm">
            <History className="w-4 h-4 mr-2" />
            历史记录
          </Button>
          
          <ApiSettingsDialog />
        </nav>
      </div>
    </header>
  )
}
