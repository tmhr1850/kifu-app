'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UpdateProfileData } from '@/types/profile'
import { Check, Loader2 } from 'lucide-react'
import { validateUsername, validateProfileField, INPUT_LIMITS } from '@/utils/security/validation'

const RANK_OPTIONS = [
  { value: '', label: '未設定' },
  { value: '10級', label: '10級' },
  { value: '9級', label: '9級' },
  { value: '8級', label: '8級' },
  { value: '7級', label: '7級' },
  { value: '6級', label: '6級' },
  { value: '5級', label: '5級' },
  { value: '4級', label: '4級' },
  { value: '3級', label: '3級' },
  { value: '2級', label: '2級' },
  { value: '1級', label: '1級' },
  { value: '初段', label: '初段' },
  { value: '二段', label: '二段' },
  { value: '三段', label: '三段' },
  { value: '四段', label: '四段' },
  { value: '五段', label: '五段' },
  { value: '六段', label: '六段' },
  { value: '七段', label: '七段' },
  { value: '八段', label: '八段' },
  { value: '九段', label: '九段' },
]

export function ProfileEditForm() {
  const { profile, updateProfile } = useAuth()
  const [formData, setFormData] = useState<UpdateProfileData>({
    username: '',
    full_name: '',
    bio: '',
    rank: '',
    is_public: true,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        rank: profile.rank || '',
        is_public: profile.is_public ?? true,
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validate username
    const usernameValidation = validateUsername(formData.username)
    if (!usernameValidation.isValid) {
      setError(usernameValidation.error || 'ユーザー名が無効です')
      setLoading(false)
      return
    }

    // Validate full name
    const fullNameValidation = validateProfileField(formData.full_name || '', INPUT_LIMITS.fullName.max)
    if (!fullNameValidation.isValid) {
      setError(fullNameValidation.error || '表示名が無効です')
      setLoading(false)
      return
    }

    // Validate bio
    const bioValidation = validateProfileField(formData.bio || '', INPUT_LIMITS.bio.max)
    if (!bioValidation.isValid) {
      setError(bioValidation.error || '自己紹介が無効です')
      setLoading(false)
      return
    }

    // Create sanitized data
    const sanitizedData: UpdateProfileData = {
      username: usernameValidation.sanitized,
      full_name: fullNameValidation.sanitized,
      bio: bioValidation.sanitized,
      rank: formData.rank,
      is_public: formData.is_public,
    }

    const { error } = await updateProfile(sanitizedData)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setLoading(false)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          ユーザー名
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          maxLength={INPUT_LIMITS.username.max}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: shogi_player"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.username.length}/{INPUT_LIMITS.username.max}文字
        </p>
      </div>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-2">
          表示名
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          maxLength={INPUT_LIMITS.fullName.max}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 山田太郎"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.full_name?.length || 0}/{INPUT_LIMITS.fullName.max}文字
        </p>
      </div>

      <div>
        <label htmlFor="rank" className="block text-sm font-medium mb-2">
          棋力
        </label>
        <select
          id="rank"
          name="rank"
          value={formData.rank}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {RANK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          自己紹介
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          maxLength={INPUT_LIMITS.bio.max}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="自己紹介文を入力してください..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.bio?.length || 0}/{INPUT_LIMITS.bio.max}文字
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_public"
          name="is_public"
          checked={formData.is_public}
          onChange={handleChange}
          className="mr-2"
        />
        <label htmlFor="is_public" className="text-sm">
          プロフィールを公開する
        </label>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
          <Check className="w-5 h-5 mr-2" />
          プロフィールを更新しました
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            更新中...
          </>
        ) : (
          '更新する'
        )}
      </button>
    </form>
  )
}