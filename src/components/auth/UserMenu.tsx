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
    <div className="relative" data-testid="user-menu">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
        data-testid="user-menu-button"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        <span className="text-sm text-gray-700">{user.email}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50" data-testid="user-menu-dropdown">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            {user.email}
          </div>
          <button
            onClick={() => {
              router.push(`/profile/${user.id}`)
              setShowMenu(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            data-testid="user-menu-profile"
          >
            マイプロフィール
          </button>
          <button
            onClick={() => {
              router.push('/profile/edit')
              setShowMenu(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            data-testid="user-menu-edit-profile"
          >
            プロフィール編集
          </button>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            data-testid="user-menu-logout"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  )
}