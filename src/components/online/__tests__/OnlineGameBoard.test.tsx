import React from 'react'
import { render, screen } from '@testing-library/react'
import { OnlineGameBoard } from '../OnlineGameBoard'
import { useAuth } from '@/contexts/AuthContext'

// モック
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

describe('OnlineGameBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('認証済みユーザーで正しく表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' }
    })

    render(<OnlineGameBoard roomId="room-123" />)

    expect(screen.getByRole('heading', { name: 'オンライン対局' })).toBeInTheDocument()
    expect(screen.getByText('ルームID: room-123')).toBeInTheDocument()
    expect(screen.getByText('ユーザー: test@example.com')).toBeInTheDocument()
    expect(screen.getByText('この機能は開発中です')).toBeInTheDocument()
  })

  it('未認証ユーザーではゲストと表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null
    })

    render(<OnlineGameBoard roomId="room-456" />)

    expect(screen.getByText('ユーザー: ゲスト')).toBeInTheDocument()
  })

  it('異なるルームIDが正しく表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' }
    })

    const { rerender } = render(<OnlineGameBoard roomId="room-789" />)

    expect(screen.getByText('ルームID: room-789')).toBeInTheDocument()

    // 別のルームIDで再レンダリング
    rerender(<OnlineGameBoard roomId="room-abc" />)
    expect(screen.getByText('ルームID: room-abc')).toBeInTheDocument()
  })

  it('コンテナのスタイリングが適用されていること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null
    })

    render(<OnlineGameBoard roomId="room-123" />)

    const container = screen.getByRole('heading', { name: 'オンライン対局' }).closest('div')
    expect(container).toHaveClass('bg-gray-100', 'p-4', 'rounded-lg')

    const mainContainer = container?.parentElement
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-full', 'relative')
  })

  it('ユーザー情報の各要素が正しいスタイルで表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' }
    })

    render(<OnlineGameBoard roomId="room-123" />)

    const heading = screen.getByRole('heading', { name: 'オンライン対局' })
    expect(heading).toHaveClass('text-xl', 'font-bold', 'mb-2')

    const roomIdText = screen.getByText('ルームID: room-123')
    expect(roomIdText).toHaveClass('text-gray-600', 'mb-2')

    const userText = screen.getByText('ユーザー: test@example.com')
    expect(userText).toHaveClass('text-gray-600')

    const devMessage = screen.getByText('この機能は開発中です')
    expect(devMessage).toHaveClass('text-gray-600', 'mt-4')
  })

  it('エッジケース：空のルームIDも正しく表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' }
    })

    render(<OnlineGameBoard roomId="" />)

    expect(screen.getByText('ルームID:')).toBeInTheDocument()
  })

  it('エッジケース：長いルームIDも正しく表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' }
    })

    const longRoomId = 'very-long-room-id-with-many-characters-123456789'
    render(<OnlineGameBoard roomId={longRoomId} />)

    expect(screen.getByText(`ルームID: ${longRoomId}`)).toBeInTheDocument()
  })

  it('ユーザーのメールアドレスが長い場合も正しく表示されること', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'very.long.email.address@example-company.co.jp' }
    })

    render(<OnlineGameBoard roomId="room-123" />)

    expect(screen.getByText('ユーザー: very.long.email.address@example-company.co.jp')).toBeInTheDocument()
  })

  it('ユーザーオブジェクトがあるがemailがundefinedの場合', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: undefined }
    })

    render(<OnlineGameBoard roomId="room-123" />)

    expect(screen.getByText('ユーザー: ゲスト')).toBeInTheDocument()
  })

  it('ユーザーオブジェクトがあるがemailが空文字の場合', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: '' }
    })

    render(<OnlineGameBoard roomId="room-123" />)

    expect(screen.getByText('ユーザー: ゲスト')).toBeInTheDocument()
  })
})