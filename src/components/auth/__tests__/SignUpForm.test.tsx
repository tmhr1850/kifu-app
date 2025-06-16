import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '../SignUpForm'
import { useAuth } from '@/contexts/AuthContext'

// AuthContextのモック
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

describe('SignUpForm', () => {
  const mockSignUp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp
    })
  })

  it('フォームが正しくレンダリングされること', () => {
    render(<SignUpForm />)

    expect(screen.getByText('新規登録')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登録する' })).toBeInTheDocument()
  })

  it('有効な入力で登録が成功すること', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'Password123')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'Password123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password123')
      expect(screen.getByText('登録が完了しました！確認メールをご確認ください。')).toBeInTheDocument()
    })
  })

  it('パスワードが一致しない場合エラーが表示されること', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'Password123')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'Password456')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  describe('パスワードバリデーション', () => {
    it('8文字未満の場合エラーが表示されること', async () => {
      const user = userEvent.setup()

      render(<SignUpForm />)

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByLabelText('パスワード'), 'Pass12')
      await user.type(screen.getByLabelText('パスワード（確認）'), 'Pass12')
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: '登録する' }))

      expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
    })

    it('大文字が含まれていない場合エラーが表示されること', async () => {
      const user = userEvent.setup()

      render(<SignUpForm />)

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByLabelText('パスワード'), 'password123')
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123')
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: '登録する' }))

      expect(screen.getByText('パスワードには大文字を含めてください')).toBeInTheDocument()
    })

    it('小文字が含まれていない場合エラーが表示されること', async () => {
      const user = userEvent.setup()

      render(<SignUpForm />)

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByLabelText('パスワード'), 'PASSWORD123')
      await user.type(screen.getByLabelText('パスワード（確認）'), 'PASSWORD123')
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: '登録する' }))

      expect(screen.getByText('パスワードには小文字を含めてください')).toBeInTheDocument()
    })

    it('数字が含まれていない場合エラーが表示されること', async () => {
      const user = userEvent.setup()

      render(<SignUpForm />)

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByLabelText('パスワード'), 'PasswordABC')
      await user.type(screen.getByLabelText('パスワード（確認）'), 'PasswordABC')
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: '登録する' }))

      expect(screen.getByText('パスワードには数字を含めてください')).toBeInTheDocument()
    })
  })

  it('利用規約に同意していない場合エラーが表示されること', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'Password123')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'Password123')
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.getByText('利用規約への同意が必要です')).toBeInTheDocument()
  })

  it('登録エラーが表示されること', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'ユーザーは既に存在します' } })
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'Password123')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'Password123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(screen.getByText('ユーザーは既に存在します')).toBeInTheDocument()
    })
  })

  it('登録中はボタンが無効化されること', async () => {
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'Password123')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'Password123')
    await user.click(screen.getByRole('checkbox'))
    
    const submitButton = screen.getByRole('button', { name: '登録する' })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('登録中...')
  })
})