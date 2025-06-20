'use client'

import { useState, useCallback } from 'react'
import { Move, Player } from '@/types/shogi'

export interface OnlineGameState {
  roomId: string
  onlineStatus: 'waiting' | 'playing' | 'paused' | 'finished'
  currentPlayer: Player
  timeData?: unknown
}

export function useOnlineGame() {
  const [gameState] = useState<OnlineGameState | null>(null)
  const [timeData] = useState<unknown>(null)
  const [myColor] = useState<Player | null>(null)
  const [isMyTurn] = useState(false)
  const [opponentInfo] = useState<{ id: string; name: string } | null>(null)

  const makeMove = useCallback((move: Move) => {
    console.log('Move attempted:', move)
    // TODO: 実装中のプレースホルダー
    return true
  }, [])

  return {
    gameState,
    timeData,
    myColor,
    isMyTurn,
    opponentInfo,
    makeMove
  }
}