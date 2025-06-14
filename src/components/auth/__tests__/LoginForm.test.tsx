import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// モック
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

describe('LoginForm', () => {
  const mockSignIn = jest.fn()
  const mockSignInWithMagicLink = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signInWithMagicLink: mockSignInWithMagicLink
    })
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
  })

  it('フォームが正しくレンダリングされること', () => {
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByLabelText('ログイン状態を保持する')).toBeInTheDocument()
    expect(screen.getByText('パスワードを忘れた方')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'マジックリンクでログイン' })).toBeInTheDocument()
  })

  it('有効な認証情報でログインが成功すること', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/kifu')
    })
  })

  it('Remember Me機能が動作すること', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')

    render(<LoginForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.click(screen.getByLabelText('ログイン状態を保持する'))
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('rememberMe', 'true')
    })
  })

  it('ログインエラーが表示されること', async () => {
    mockSignIn.mockResolvedValue({ error: { message: '認証情報が無効です' } })
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => {
      expect(screen.getByText('認証情報が無効です')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('マジックリンクでログインできること', async () => {
    mockSignInWithMagicLink.mockResolvedValue({ error: null })
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()

    render(<LoginForm />)

    // useAuthのモックを更新
    ;(useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signInWithMagicLink: mockSignInWithMagicLink
    })

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'マジックリンクでログイン' }))

    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@example.com')
      expect(alertSpy).toHaveBeenCalledWith('ログインリンクをメールで送信しました。メールをご確認ください。')
    })

    alertSpy.mockRestore()
  })

  it('メールアドレスが入力されていない場合マジックリンクボタンが無効化されること', () => {
    render(<LoginForm />)

    const magicLinkButton = screen.getByRole('button', { name: 'マジックリンクでログイン' })
    expect(magicLinkButton).toBeDisabled()
  })

  it('ログイン中はボタンが無効化されること', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('ログイン中...')
  })

  it('新規登録リンクが正しく表示されること', () => {
    render(<LoginForm />)

    const signupLink = screen.getByRole('link', { name: '新規登録' })
    expect(signupLink).toHaveAttribute('href', '/auth/signup')
  })

  it('パスワードリセットリンクが正しく表示されること', () => {
    render(<LoginForm />)

    const resetLink = screen.getByRole('link', { name: 'パスワードを忘れた方' })
    expect(resetLink).toHaveAttribute('href', '/auth/reset-password')
  })
})