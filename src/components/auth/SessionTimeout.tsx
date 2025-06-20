'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SessionManager } from '@/utils/sessionManager'
import { AlertCircle } from 'lucide-react'

export function SessionTimeout() {
  const { user, signOut } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null)

  const handleTimeout = useCallback(async () => {
    await signOut()
    alert('セッションがタイムアウトしました。再度ログインしてください。')
  }, [signOut])

  const handleWarning = useCallback(() => {
    setShowWarning(true)
    
    // Update time remaining every second
    const interval = setInterval(() => {
      if (sessionManager) {
        const remaining = sessionManager.getTimeUntilTimeout()
        setTimeRemaining(remaining)
        
        if (remaining <= 0) {
          clearInterval(interval)
        }
      }
    }, 1000)
  }, [sessionManager])

  const extendSession = useCallback(() => {
    if (sessionManager) {
      sessionManager.extendSession()
      setShowWarning(false)
      setTimeRemaining(null)
    }
  }, [sessionManager])

  useEffect(() => {
    if (user) {
      const manager = new SessionManager(handleTimeout, handleWarning)
      setSessionManager(manager)

      return () => {
        manager.destroy()
      }
    }
  }, [user, handleTimeout, handleWarning])

  if (!user || !showWarning) {
    return null
  }

  const minutes = timeRemaining ? Math.floor(timeRemaining / 60000) : 0
  const seconds = timeRemaining ? Math.floor((timeRemaining % 60000) / 1000) : 0

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-yellow-800">
            セッションタイムアウト警告
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            {minutes}分{seconds}秒後に自動的にログアウトされます。
          </p>
          <button
            onClick={extendSession}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
          >
            セッションを延長
          </button>
        </div>
      </div>
    </div>
  )
}