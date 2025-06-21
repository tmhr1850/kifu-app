import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchingOptions } from '../MatchingOptions'
import type { MatchingOptions as MatchingOptionsType } from '@/types/online'

describe('MatchingOptions', () => {
  const mockOnStartMatching = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('初期状態で正しく表示されること', () => {
    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    expect(screen.getByLabelText('プレイヤー名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('あなたの名前')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '対戦モード' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '持ち時間' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '対戦相手を探す' })).toBeInTheDocument()
  })

  it('対戦モードのオプションが表示されること', () => {
    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    expect(screen.getByText('ランダムマッチ')).toBeInTheDocument()
    expect(screen.getByText('すぐに対戦相手を見つける')).toBeInTheDocument()
    expect(screen.getByText('レート戦（準備中）')).toBeInTheDocument()
    expect(screen.getByText('実力の近い相手と対戦')).toBeInTheDocument()
    expect(screen.getByText('フレンド対戦')).toBeInTheDocument()
    expect(screen.getByText('特定の相手を招待')).toBeInTheDocument()
  })

  it('時間設定のプリセットが表示されること', () => {
    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    expect(screen.getByRole('button', { name: '10分切れ負け' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10分 + 10秒' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '15分 + 30秒秒読み' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30分切れ負け' })).toBeInTheDocument()
  })

  it('レート戦ボタンが無効化されていること', () => {
    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const ratedButton = screen.getByText('レート戦（準備中）').closest('button')
    expect(ratedButton).toBeDisabled()
    expect(ratedButton).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('名前を入力してランダムマッチを開始できること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    await user.type(nameInput, 'テストプレイヤー')

    const startButton = screen.getByRole('button', { name: '対戦相手を探す' })
    await user.click(startButton)

    expect(mockOnStartMatching).toHaveBeenCalledWith('テストプレイヤー', {
      mode: 'random',
      timeControl: { initial: 600, increment: 0 }
    })
  })

  it('名前が空の場合はアラートが表示されること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const startButton = screen.getByRole('button', { name: '対戦相手を探す' })
    await user.click(startButton)

    expect(window.alert).toHaveBeenCalledWith('名前を入力してください')
    expect(mockOnStartMatching).not.toHaveBeenCalled()
  })

  it('空白のみの名前の場合はアラートが表示されること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    await user.type(nameInput, '   ')

    const startButton = screen.getByRole('button', { name: '対戦相手を探す' })
    await user.click(startButton)

    expect(window.alert).toHaveBeenCalledWith('名前を入力してください')
    expect(mockOnStartMatching).not.toHaveBeenCalled()
  })

  it('フレンド対戦モードを選択するとフレンドID入力欄が表示されること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    expect(screen.queryByPlaceholderText('フレンドIDを入力')).not.toBeInTheDocument()

    const friendButton = screen.getByText('フレンド対戦').closest('button')!
    await user.click(friendButton)

    expect(screen.getByPlaceholderText('フレンドIDを入力')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'フレンドを招待' })).toBeInTheDocument()
  })

  it('フレンド対戦でフレンドIDを含めて送信されること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    await user.type(nameInput, 'テストプレイヤー')

    const friendButton = screen.getByText('フレンド対戦').closest('button')!
    await user.click(friendButton)

    const friendIdInput = screen.getByPlaceholderText('フレンドIDを入力')
    await user.type(friendIdInput, 'friend123')

    const startButton = screen.getByRole('button', { name: 'フレンドを招待' })
    await user.click(startButton)

    expect(mockOnStartMatching).toHaveBeenCalledWith('テストプレイヤー', {
      mode: 'friend',
      timeControl: { initial: 600, increment: 0 },
      friendId: 'friend123'
    })
  })

  it('フレンドIDが空でも送信できること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    await user.type(nameInput, 'テストプレイヤー')

    const friendButton = screen.getByText('フレンド対戦').closest('button')!
    await user.click(friendButton)

    const startButton = screen.getByRole('button', { name: 'フレンドを招待' })
    await user.click(startButton)

    expect(mockOnStartMatching).toHaveBeenCalledWith('テストプレイヤー', {
      mode: 'friend',
      timeControl: { initial: 600, increment: 0 }
    })
  })

  it('時間設定を変更できること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    await user.type(nameInput, 'テストプレイヤー')

    // 15分 + 30秒秒読みを選択
    const timeButton = screen.getByRole('button', { name: '15分 + 30秒秒読み' })
    await user.click(timeButton)

    const startButton = screen.getByRole('button', { name: '対戦相手を探す' })
    await user.click(startButton)

    expect(mockOnStartMatching).toHaveBeenCalledWith('テストプレイヤー', {
      mode: 'random',
      timeControl: { initial: 900, increment: 0, byoyomi: 30, periods: 1 }
    })
  })

  it('選択されたモードがハイライトされること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    // 初期状態でランダムマッチが選択されている
    const randomButton = screen.getByText('ランダムマッチ').closest('button')!
    expect(randomButton).toHaveClass('border-amber-500', 'bg-amber-50')

    // フレンド対戦を選択
    const friendButton = screen.getByText('フレンド対戦').closest('button')!
    await user.click(friendButton)

    expect(friendButton).toHaveClass('border-amber-500', 'bg-amber-50')
    expect(randomButton).not.toHaveClass('border-amber-500', 'bg-amber-50')
  })

  it('選択された時間設定がハイライトされること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    // 初期状態で10分切れ負けが選択されている
    const time10Button = screen.getByRole('button', { name: '10分切れ負け' })
    expect(time10Button).toHaveClass('border-amber-500', 'bg-amber-50')

    // 30分切れ負けを選択
    const time30Button = screen.getByRole('button', { name: '30分切れ負け' })
    await user.click(time30Button)

    expect(time30Button).toHaveClass('border-amber-500', 'bg-amber-50')
    expect(time10Button).not.toHaveClass('border-amber-500', 'bg-amber-50')
  })

  it('disabledプロパティが有効な場合、開始ボタンが無効化されること', async () => {
    const user = userEvent.setup()

    render(<MatchingOptions onStartMatching={mockOnStartMatching} disabled={true} />)

    const nameInput = screen.getByPlaceholderText('あなたの名前')
    await user.type(nameInput, 'テストプレイヤー')

    const startButton = screen.getByRole('button', { name: '対戦相手を探す' })
    expect(startButton).toBeDisabled()
    expect(startButton).toHaveClass('disabled:cursor-not-allowed')
  })

  it('名前が空でボタンが無効化されること', () => {
    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    const startButton = screen.getByRole('button', { name: '対戦相手を探す' })
    expect(startButton).toBeDisabled()
  })

  it('アイコンが正しく表示されること', () => {
    render(<MatchingOptions onStartMatching={mockOnStartMatching} />)

    // 各モードのアイコンが存在することを確認
    const randomSection = screen.getByText('ランダムマッチ').closest('button')
    expect(randomSection?.querySelector('svg')).toBeInTheDocument()

    const ratedSection = screen.getByText('レート戦（準備中）').closest('button')
    expect(ratedSection?.querySelector('svg')).toBeInTheDocument()

    const friendSection = screen.getByText('フレンド対戦').closest('button')
    expect(friendSection?.querySelector('svg')).toBeInTheDocument()
  })
})