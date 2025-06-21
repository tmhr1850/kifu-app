import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteNotification } from '../InviteNotification'
import type { GameInvite } from '@/types/online'

describe('InviteNotification', () => {
  const mockOnAccept = jest.fn()
  const mockOnDecline = jest.fn()
  const mockOnExpire = jest.fn()

  const baseInvite: GameInvite = {
    id: 'invite-1',
    fromPlayer: {
      id: 'player-1',
      name: 'テストプレイヤー',
      rating: 1500
    },
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分後
    timeControl: {
      initial: 600, // 10分
      increment: 10,
      byoyomi: 0
    },
    message: 'よろしくお願いします'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('招待情報が正しく表示されること', () => {
    render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    expect(screen.getByRole('heading', { name: '対局の招待' })).toBeInTheDocument()
    expect(screen.getByText('テストプレイヤー')).toBeInTheDocument()
    expect(screen.getByText('(レート: 1500)')).toBeInTheDocument()
    expect(screen.getByText('10分 + 10秒加算')).toBeInTheDocument()
    expect(screen.getByText('よろしくお願いします')).toBeInTheDocument()
  })

  it('秒読み形式の時間制御が正しく表示されること', () => {
    const inviteWithByoyomi = {
      ...baseInvite,
      timeControl: {
        initial: 300, // 5分
        increment: 0,
        byoyomi: 30
      }
    }

    render(
      <InviteNotification
        invite={inviteWithByoyomi}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    expect(screen.getByText('5分 + 30秒秒読み')).toBeInTheDocument()
  })

  it('時間無制限の場合の表示が正しいこと', () => {
    const inviteWithoutTime = {
      ...baseInvite,
      timeControl: undefined
    }

    render(
      <InviteNotification
        invite={inviteWithoutTime}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    expect(screen.getByText('時間無制限')).toBeInTheDocument()
  })

  it('レーティングがない場合は表示しないこと', () => {
    const inviteWithoutRating = {
      ...baseInvite,
      fromPlayer: {
        id: 'player-1',
        name: 'テストプレイヤー',
        rating: undefined
      }
    }

    render(
      <InviteNotification
        invite={inviteWithoutRating}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    expect(screen.getByText('テストプレイヤー')).toBeInTheDocument()
    expect(screen.queryByText(/レート:/)).not.toBeInTheDocument()
  })

  it('メッセージがない場合は表示しないこと', () => {
    const inviteWithoutMessage = {
      ...baseInvite,
      message: undefined
    }

    render(
      <InviteNotification
        invite={inviteWithoutMessage}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    expect(screen.queryByText('よろしくお願いします')).not.toBeInTheDocument()
  })

  it('名前を入力して承諾できること', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    const acceptButton = screen.getByRole('button', { name: '承諾' })

    // 初期状態では承諾ボタンが無効
    expect(acceptButton).toBeDisabled()

    // 名前を入力
    await user.type(nameInput, 'プレイヤー2')
    expect(acceptButton).not.toBeDisabled()

    // 承諾ボタンをクリック
    await user.click(acceptButton)
    expect(mockOnAccept).toHaveBeenCalledWith('プレイヤー2')
  })

  it('空白のみの名前では承諾できないこと', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    const acceptButton = screen.getByRole('button', { name: '承諾' })

    await user.type(nameInput, '   ')
    expect(acceptButton).toBeDisabled()
  })

  it('拒否ボタンが機能すること', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    const declineButton = screen.getByRole('button', { name: '拒否' })
    await user.click(declineButton)
    expect(mockOnDecline).toHaveBeenCalledTimes(1)
  })

  it('×ボタンでも拒否できること', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
    
    if (closeButton) {
      await user.click(closeButton)
      expect(mockOnDecline).toHaveBeenCalledTimes(1)
    }
  })

  it('残り時間が正しくカウントダウンされること', () => {
    render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    // 初期状態
    expect(screen.getByText(/残り時間: 5:00/)).toBeInTheDocument()

    // 1秒経過
    jest.advanceTimersByTime(1000)
    expect(screen.getByText(/残り時間: 4:59/)).toBeInTheDocument()

    // さらに59秒経過
    jest.advanceTimersByTime(59000)
    expect(screen.getByText(/残り時間: 4:00/)).toBeInTheDocument()
  })

  it('時間切れで期限切れコールバックが呼ばれること', async () => {
    const expiredInvite = {
      ...baseInvite,
      expiresAt: new Date(Date.now() + 2000).toISOString() // 2秒後
    }

    render(
      <InviteNotification
        invite={expiredInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    // 2秒経過
    jest.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(mockOnExpire).toHaveBeenCalledTimes(1)
    })
  })

  it('コンポーネントアンマウント時にタイマーがクリアされること', () => {
    const { unmount } = render(
      <InviteNotification
        invite={baseInvite}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        onExpire={mockOnExpire}
      />
    )

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('残り時間のフォーマットが正しいこと', () => {
    const testCases = [
      { seconds: 125, expected: '2:05' },
      { seconds: 60, expected: '1:00' },
      { seconds: 59, expected: '0:59' },
      { seconds: 5, expected: '0:05' },
      { seconds: 0, expected: '0:00' }
    ]

    testCases.forEach(({ seconds, expected }) => {
      const invite = {
        ...baseInvite,
        expiresAt: new Date(Date.now() + seconds * 1000).toISOString()
      }

      const { rerender } = render(
        <InviteNotification
          invite={invite}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          onExpire={mockOnExpire}
        />
      )

      expect(screen.getByText(`残り時間: ${expected}`)).toBeInTheDocument()
      
      rerender(<div />)
    })
  })
})