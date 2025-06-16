'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ProfileEditPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">プロフィール編集</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>プロフィール画像</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileImageUpload />
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileEditForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}