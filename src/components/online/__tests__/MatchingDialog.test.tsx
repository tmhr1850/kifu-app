import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchingDialog } from '../MatchingDialog'

describe('MatchingDialog', () => {
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('isOpenがfalseの場合は何も表示しないこと', () => {
    const { container } = render(
      <MatchingDialog
        isOpen={false}
        onCancel={mockOnCancel}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('ダイアログが正しく表示されること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByRole('heading', { name: '対戦相手を探しています' })).toBeInTheDocument()
    expect(screen.getByText('経過時間:')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
    expect(screen.getByText('マッチングはいつでもキャンセルできます')).toBeInTheDocument()
  })

  it('経過時間が正しくカウントされること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('0:00')).toBeInTheDocument()

    // 1秒経過
    jest.advanceTimersByTime(1000)
    expect(screen.getByText('0:01')).toBeInTheDocument()

    // さらに59秒経過（合計60秒）
    jest.advanceTimersByTime(59000)
    expect(screen.getByText('1:00')).toBeInTheDocument()

    // さらに65秒経過（合計125秒）
    jest.advanceTimersByTime(65000)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('待機順位が表示されること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
        queuePosition={3}
      />
    )

    expect(screen.getByText('待機順位: 3番目')).toBeInTheDocument()
  })

  it('待機順位がnullの場合は表示しないこと', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
        queuePosition={null}
      />
    )

    expect(screen.queryByText(/待機順位:/)).not.toBeInTheDocument()
  })

  it('推定待ち時間が表示されること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
        estimatedWaitTime={180} // 3分
      />
    )

    expect(screen.getByText('推定待ち時間: 約3分')).toBeInTheDocument()
  })

  it('推定待ち時間が1分未満でも1分と表示されること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
        estimatedWaitTime={30} // 30秒
      />
    )

    expect(screen.getByText('推定待ち時間: 約1分')).toBeInTheDocument()
  })

  it('推定待ち時間がない場合は表示しないこと', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
        estimatedWaitTime={undefined}
      />
    )

    expect(screen.queryByText(/推定待ち時間:/)).not.toBeInTheDocument()
  })

  it('キャンセルボタンが機能すること', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('×ボタンでもキャンセルできること', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
    
    if (closeButton) {
      await user.click(closeButton)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    }
  })

  it('ローディングアニメーションが表示されること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    const loader = screen.getByRole('heading', { name: '対戦相手を探しています' })
      .parentElement?.parentElement?.querySelector('.animate-spin')
    
    expect(loader).toBeInTheDocument()
    expect(loader).toHaveClass('animate-spin')
  })

  it('ダイアログを閉じて再度開いた時に経過時間がリセットされること', () => {
    const { rerender } = render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    // 5秒経過
    jest.advanceTimersByTime(5000)
    expect(screen.getByText('0:05')).toBeInTheDocument()

    // ダイアログを閉じる
    rerender(
      <MatchingDialog
        isOpen={false}
        onCancel={mockOnCancel}
      />
    )

    // ダイアログを再度開く
    rerender(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    // 経過時間がリセットされている
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('コンポーネントアンマウント時にタイマーがクリアされること', () => {
    const { unmount } = render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('背景のオーバーレイが表示されること', () => {
    render(
      <MatchingDialog
        isOpen={true}
        onCancel={mockOnCancel}
      />
    )

    const overlay = screen.getByRole('heading', { name: '対戦相手を探しています' })
      .closest('.fixed.inset-0')
    
    expect(overlay).toHaveClass('bg-black', 'bg-opacity-50')
  })
})