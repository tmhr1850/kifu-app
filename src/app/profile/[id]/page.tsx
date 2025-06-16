import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ProfileView } from '@/components/profile/ProfileView'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { GameHistory } from '@/components/profile/GameHistory'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  
  // プロフィールを取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profile || !profile.is_public) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProfileView profile={profile} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <ProfileStats userId={id} />
          <GameHistory userId={id} />
        </div>
      </div>
    </div>
  )
}