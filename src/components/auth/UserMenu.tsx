'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => router.push('/auth/login')}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          ログイン
        </button>
        <button
          onClick={() => router.push('/auth/signup')}
          className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          新規登録
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
      >
        <User className="w-6 h-6 text-gray-600" />
        <span className="text-sm text-gray-700">{user.email}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            {user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  )
}