'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { Move, GameState } from '@/types/shogi'
import { useAuth } from './AuthContext'

interface Room {
  id: string
  players: Array<{
    id: string
    name: string
    socketId: string
    color: 'sente' | 'gote'
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
  currentRoom: Room | null
  createRoom: (playerName: string) => void
  joinRoom: (roomId: string, playerName: string) => void
  makeMove: (move: Move, gameState: GameState) => void
  resign: () => void
  syncTime: (timeData: TimeData) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnected(false)
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
      // TODO: エラー通知を表示
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user])

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
    currentRoom,
    createRoom,
    joinRoom,
    makeMove,
    resign,
    syncTime
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