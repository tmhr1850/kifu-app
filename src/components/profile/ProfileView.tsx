import { UserProfile } from '@/types/profile'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { User, Award, Calendar } from 'lucide-react'
import Image from 'next/image'

interface ProfileViewProps {
  profile: UserProfile
}

export function ProfileView({ profile }: ProfileViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 mb-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username || ''}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold">
          {profile.full_name || profile.username || 'ユーザー'}
        </h1>
        
        {profile.username && profile.full_name && (
          <p className="text-gray-600">@{profile.username}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {profile.rank && (
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">棋力:</span>
            <span>{profile.rank}</span>
          </div>
        )}
        
        {profile.bio && (
          <div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>登録日: {formatDate(profile.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}