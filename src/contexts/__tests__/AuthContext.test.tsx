import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '@/lib/supabase'

// Supabaseのモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}))

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトのモック実装
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null }
    })
  })

  describe('AuthProvider', () => {
    it('初期状態でuserとsessionがnullであること', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.profile).toBeNull()
    })

    it('既存のセッションがある場合、userとsessionが設定されること', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token'
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockSession.user)
      expect(result.current.session).toEqual(mockSession)
    })
  })

  describe('認証メソッド', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    it('signUpが正しく動作すること', async () => {
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signUp('test@example.com', 'password123')
      
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback')
        }
      })
      expect(response.error).toBeNull()
    })

    it('signInが正しく動作すること', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signIn('test@example.com', 'password123')
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(response.error).toBeNull()
    })

    it('signOutが正しく動作すること', async () => {
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signOut()
      
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(response.error).toBeNull()
    })

    it('resetPasswordが正しく動作すること', async () => {
      ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.resetPassword('test@example.com')
      
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/auth/reset-password')
        }
      )
      expect(response.error).toBeNull()
    })

    it('updatePasswordが正しく動作すること', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.updatePassword('newPassword123')
      
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123'
      })
      expect(response.error).toBeNull()
    })

    it('getProfileが正しく動作すること', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
        })
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      })

      // ユーザーがログインしている状態をシミュレート
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // userを設定するため、セッションを設定
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token'
      }
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession }
      })

      // 再レンダリング
      const { rerender } = renderHook(() => useAuth(), { wrapper })
      rerender()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.getProfile()
      
      expect(response.data).toEqual(mockProfile)
      expect(response.error).toBeNull()
    })

    it('updateProfileが正しく動作すること', async () => {
      const updateData = {
        username: 'newusername',
        full_name: 'New Name',
        bio: 'New bio'
      }

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })

      // ユーザーがログインしている状態をシミュレート
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token'
      }
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession }
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBeTruthy()
      })

      const response = await result.current.updateProfile(updateData)
      
      expect(mockUpdate).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      })
      expect(response.error).toBeNull()
    })
  })

  describe('エラーハンドリング', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    it('signUpエラーが正しく返されること', async () => {
      const mockError = new Error('Sign up failed')
      ;(supabase.auth.signUp as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signUp('test@example.com', 'password123')
      
      expect(response.error).toEqual(mockError)
    })
  })
})