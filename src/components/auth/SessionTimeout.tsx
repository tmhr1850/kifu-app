'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { SessionManager } from '@/utils/security/session'

export function SessionTimeout() {
  const router = useRouter()
  const { signOut, user } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null)

  useEffect(() => {
    if (!user) return

    const manager = new SessionManager(
      // On timeout
      async () => {
        await signOut()
        router.push('/auth/login?reason=session_timeout')
      },
      // On warning
      () => {
        setShowWarning(true)
      }
    )

    setSessionManager(manager)

    return () => {
      manager.destroy()
    }
  }, [user, signOut, router])

  const handleExtendSession = () => {
    if (sessionManager) {
      sessionManager.extend()
      setShowWarning(false)
    }
  }

  const handleLogout = async () => {
    if (sessionManager) {
      sessionManager.destroy()
    }
    await signOut()
    router.push('/auth/login')
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">セッションタイムアウト警告</h2>
        <p className="mb-6">
          セキュリティのため、5分後に自動的にログアウトされます。
          <br />
          続けて利用する場合は「セッションを延長」をクリックしてください。
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExtendSession}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            セッションを延長
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}