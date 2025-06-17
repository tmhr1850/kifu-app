'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Move, GameState, Player } from '@/types/shogi'
import { useAuth } from './AuthContext'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

interface Room {
  id: string
  players: Array<{
    id: string
    name: string
    socketId: string
    color: Player
    connected?: boolean
  }>
  gameState: GameState | null
  createdAt: Date
}

interface TimeData {
  [key: string]: {
    remaining: number
    periods?: number
  }
  lastUpdate: number
}

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  connectionStatus: ConnectionStatus
  reconnectAttempts: number
  lastError: string | null
  currentRoom: Room | null
  createRoom: (playerName: string) => void
  joinRoom: (roomId: string, playerName: string) => void
  makeMove: (move: Move, gameState: GameState) => void
  resign: () => void
  syncTime: (timeData: TimeData) => void
  manualReconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

const MAX_RECONNECT_ATTEMPTS = 10
const INITIAL_RECONNECT_DELAY = 1000

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const { user } = useAuth()

  const manualReconnect = useCallback(() => {
    if (socket && !connected) {
      setReconnectAttempts(0)
      setLastError(null)
      socket.connect()
    }
  }, [socket, connected])

  useEffect(() => {
    if (!user) return

    setConnectionStatus('connecting')
    
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: INITIAL_RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 20000,
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
      setConnectionStatus('connected')
      setReconnectAttempts(0)
      setLastError(null)
      
      // 部屋に再接続する必要がある場合
      if (currentRoom) {
        socketInstance.emit('rejoin_room', {
          roomId: currentRoom.id,
          userId: user.id
        })
      }
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        setConnectionStatus('disconnected')
        setLastError('サーバーから切断されました')
      } else if (reason === 'transport close' || reason === 'transport error') {
        setConnectionStatus('reconnecting')
        setLastError('接続が失われました。再接続を試みています...')
      } else {
        setConnectionStatus('disconnected')
        setLastError(`接続エラー: ${reason}`)
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error.message)
      setConnectionStatus('error')
      setLastError(`接続エラー: ${error.message}`)
    })

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`)
      setConnectionStatus('reconnecting')
      setReconnectAttempts(attemptNumber)
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`)
      setConnectionStatus('connected')
      setConnected(true)
      setReconnectAttempts(0)
      setLastError(null)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('Failed to reconnect')
      setConnectionStatus('error')
      setLastError('再接続に失敗しました。ページを更新するか、しばらくしてからお試しください。')
    })

    socketInstance.on('room_created', ({ room }) => {
      setCurrentRoom(room)
    })

    socketInstance.on('player_joined', ({ room }) => {
      setCurrentRoom(room)
    })

    socketInstance.on('reconnected', ({ room }) => {
      setCurrentRoom(room)
    })

    socketInstance.on('error', ({ message }) => {
      console.error('Socket error:', message)
      setLastError(message)
      setConnectionStatus('error')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
    }
  }, [user, currentRoom])

  const createRoom = (playerName: string) => {
    if (!socket || !user) return
    
    socket.emit('create_room', {
      userId: user.id,
      playerName
    })
  }

  const joinRoom = (roomId: string, playerName: string) => {
    if (!socket || !user) return
    
    socket.emit('join_room', {
      roomId,
      userId: user.id,
      playerName
    })
  }

  const makeMove = (move: Move, gameState: GameState) => {
    if (!socket || !currentRoom) return
    
    socket.emit('make_move', {
      roomId: currentRoom.id,
      move,
      gameState
    })
  }

  const resign = () => {
    if (!socket || !currentRoom || !user) return
    
    socket.emit('resign', {
      roomId: currentRoom.id,
      playerId: user.id
    })
  }

  const syncTime = (timeData: TimeData) => {
    if (!socket || !currentRoom) return
    
    socket.emit('sync_time', {
      roomId: currentRoom.id,
      timeData
    })
  }

  const value = {
    socket,
    connected,
    connectionStatus,
    reconnectAttempts,
    lastError,
    currentRoom,
    createRoom,
    joinRoom,
    makeMove,
    resign,
    syncTime,
    manualReconnect
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}