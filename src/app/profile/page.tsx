'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function ProfileRedirectPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.id}`)
    }
  }, [user, router])

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 text-center">
        <p>プロフィールページへ移動中...</p>
      </div>
    </ProtectedRoute>
  )
}