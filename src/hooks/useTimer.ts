'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTransStore } from '@/store/useTransStore'

export function useTimer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { timer, status, incrementTimer, setTimer } = useTransStore()

  const start = useCallback(() => {
    if (intervalRef.current) return
    
    intervalRef.current = setInterval(() => {
      incrementTimer()
    }, 1000)
  }, [incrementTimer])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resume = useCallback(() => {
    start()
  }, [start])

  const reset = useCallback(() => {
    pause()
    setTimer(0)
  }, [pause, setTimer])

  // 根据状态自动管理计时器
  useEffect(() => {
    if (status === 'training') {
      start()
    } else if (status === 'paused' || status === 'completed') {
      pause()
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, start, pause])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    timer,
    formattedTime: formatTime(timer),
    start,
    pause,
    resume,
    reset,
    isRunning: status === 'training',
    isPaused: status === 'paused',
  }
}
