import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionStatus } from '../ConnectionStatus'
import { useSocket } from '@/contexts/SocketContext'

// モック
jest.mock('@/contexts/SocketContext', () => ({
  useSocket: jest.fn()
}))

describe('ConnectionStatus', () => {
  const mockManualReconnect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('接続済みの場合は何も表示しないこと', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'connected',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    const { container } = render(<ConnectionStatus />)
    expect(container.firstChild).toBeNull()
  })

  it('接続中の場合は正しいメッセージを表示すること', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'connecting',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    expect(screen.getByText('接続中...')).toBeInTheDocument()
    
    // 黄色のインジケーターが表示されること
    const indicator = screen.getByText('接続中...').parentElement?.parentElement?.querySelector('div')
    expect(indicator).toHaveClass('bg-yellow-500')
  })

  it('切断済みの場合は正しいメッセージを表示すること', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    expect(screen.getByText('切断済み')).toBeInTheDocument()
    
    // 赤色のインジケーターが表示されること
    const indicator = screen.getByText('切断済み').parentElement?.parentElement?.querySelector('div')
    expect(indicator).toHaveClass('bg-red-500')
  })

  it('再接続中の場合は試行回数を含むメッセージを表示すること', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'reconnecting',
      reconnectAttempts: 3,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    expect(screen.getByText('再接続中... (試行回数: 3)')).toBeInTheDocument()
    
    // 黄色のインジケーターが表示されること
    const indicator = screen.getByText('再接続中... (試行回数: 3)').parentElement?.parentElement?.querySelector('div')
    expect(indicator).toHaveClass('bg-yellow-500')
  })

  it('エラーの場合はエラーメッセージと再接続ボタンを表示すること', async () => {
    const user = userEvent.setup()
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'error',
      reconnectAttempts: 0,
      lastError: 'ネットワークエラーが発生しました',
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByText('エラー')).toBeInTheDocument()
    expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
    
    // 赤色のインジケーターが表示されること
    const indicator = screen.getByText('エラー').parentElement?.parentElement?.querySelector('div')
    expect(indicator).toHaveClass('bg-red-500')
    
    // 再接続ボタンが表示されること
    const reconnectButton = screen.getByRole('button', { name: '再接続を試す' })
    expect(reconnectButton).toBeInTheDocument()
    
    // ボタンクリックで再接続が呼ばれること
    await user.click(reconnectButton)
    expect(mockManualReconnect).toHaveBeenCalledTimes(1)
  })

  it('エラー以外の状態では再接続ボタンを表示しないこと', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    expect(screen.queryByRole('button', { name: '再接続を試す' })).not.toBeInTheDocument()
  })

  it('lastErrorがない場合はエラーメッセージを表示しないこと', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'error',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByText('エラー')).toBeInTheDocument()
    // エラーメッセージは表示されない
    expect(screen.queryByText(/ネットワークエラー/)).not.toBeInTheDocument()
  })

  it('アニメーションクラスが適用されていること', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'connecting',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    
    const indicator = screen.getByText('接続中...').parentElement?.parentElement?.querySelector('div')
    expect(indicator).toHaveClass('animate-pulse')
  })

  it('固定位置のスタイリングが適用されていること', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'connecting',
      reconnectAttempts: 0,
      lastError: null,
      manualReconnect: mockManualReconnect
    })

    render(<ConnectionStatus />)
    
    const container = screen.getByText('接続中...').closest('div.fixed')
    expect(container).toHaveClass('fixed', 'top-20', 'right-4', 'z-50')
  })
})