'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { validateImageFile, sanitizeFilename } from '@/utils/security'
import { useProfile } from '@/hooks/useProfile'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] // Removed GIF to prevent animated image exploits

export function ProfileImageUpload() {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Enhanced validation using security utils
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.reason || '画像の検証に失敗しました')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // 古い画像を削除
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
        }
      }

      // 新しい画像をアップロード
      const fileExt = file.name.split('.').pop()
      const sanitizedFilename = sanitizeFilename(`${Date.now()}.${fileExt}`)
      const filePath = `${user.id}/${sanitizedFilename}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // プロフィールを更新
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      })

      if (updateError) throw updateError
    } catch (err) {
      console.error('Upload error:', err)
      setError('画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="プロフィール画像"
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <button
        onClick={triggerFileInput}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="w-4 h-4" />
        画像を変更
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-500 text-center">
        JPEG、PNG、WebP形式<br />
        最大2MBまで
      </p>
    </div>
  )
}