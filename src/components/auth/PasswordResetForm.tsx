'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function PasswordResetForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-center">パスワードリセット</h2>
        
        <p className="text-sm text-gray-600 text-center">
          登録されたメールアドレスにパスワードリセット用のリンクを送信します。
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            パスワードリセット用のメールを送信しました。メールをご確認ください。
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '送信中...' : 'リセットメールを送信'}
        </button>

        <p className="text-center text-sm">
          <a href="/auth/login" className="text-blue-600 hover:underline">
            ログインページに戻る
          </a>
        </p>
      </form>
    </div>
  )
}