'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserProfile, UpdateProfileData } from '@/types/profile'
import { getProfile, updateProfile as updateProfileUtil } from '@/utils/profile'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setLoading(true)
      const { data, error } = await getProfile(user.id)
      
      if (!error && data) {
        setProfile(data)
      }
      
      setLoading(false)
    }

    if (user) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const updateProfile = async (updates: UpdateProfileData) => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    const { data, error } = await updateProfileUtil(user.id, updates)
    
    if (!error && data) {
      setProfile(data)
    }
    
    return { error }
  }

  return { profile, loading, updateProfile }
}