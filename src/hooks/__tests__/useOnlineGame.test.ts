import { renderHook, act } from '@testing-library/react'
import { useOnlineGame } from '../useOnlineGame'
import { Player } from '@/types/shogi'

// Mock dependencies
jest.mock('@/contexts/SocketContext', () => ({
  useSocket: () => ({
    socket: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    },
    currentRoom: {
      id: 'test-room',
      players: [
        { id: 'user1', name: 'Player 1', color: Player.SENTE },
        { id: 'user2', name: 'Player 2', color: Player.GOTE }
      ]
    },
    makeMove: jest.fn(),
    syncTime: jest.fn()
  })
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com' }
  })
}))

describe('useOnlineGame', () => {
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useOnlineGame())
    
    expect(result.current.gameState).toBeNull()
    expect(result.current.myColor).toBeNull()
    expect(result.current.isMyTurn).toBe(false)
    expect(result.current.opponentInfo).toBeNull()
  })

  it('移動が正しく処理される', () => {
    const { result } = renderHook(() => useOnlineGame())
    
    // ゲーム開始をシミュレート
    act(() => {
      const mockSocket = (result.current as { socket: { on: jest.Mock } }).socket
      const gameStartHandler = mockSocket.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === 'game_start'
      )?.[1] as ((data: { room: unknown }) => void) | undefined
      
      if (gameStartHandler) {
        gameStartHandler({
          room: {
            id: 'test-room',
            players: [
              { id: 'user1', name: 'Player 1', color: Player.SENTE },
              { id: 'user2', name: 'Player 2', color: Player.GOTE }
            ]
          }
        })
      }
    })
    
    expect(result.current.myColor).toBe(Player.SENTE)
    expect(result.current.isMyTurn).toBe(true)
    expect(result.current.opponentInfo).toEqual({
      id: 'user2',
      name: 'Player 2'
    })
  })
})