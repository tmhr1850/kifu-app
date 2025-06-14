'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const { signUp } = useAuth()

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'パスワードは8文字以上で入力してください'
    }
    if (!/[A-Z]/.test(password)) {
      return 'パスワードには大文字を含めてください'
    }
    if (!/[a-z]/.test(password)) {
      return 'パスワードには小文字を含めてください'
    }
    if (!/[0-9]/.test(password)) {
      return 'パスワードには数字を含めてください'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!agreedToTerms) {
      setError('利用規約への同意が必要です')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setAgreedToTerms(false)
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-center">新規登録</h2>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            登録が完了しました！確認メールをご確認ください。
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="8文字以上、大文字・小文字・数字を含む"
          />
          <p className="text-xs text-gray-500 mt-1">
            8文字以上、大文字・小文字・数字を含む
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="パスワードを再入力"
          />
        </div>

        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 mr-2"
          />
          <label htmlFor="terms" className="text-sm">
            <a href="/terms" className="text-blue-600 hover:underline">利用規約</a>と
            <a href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</a>
            に同意します
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>
    </div>
  )
}