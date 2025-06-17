'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { Move, Player } from '@/types/shogi'
import { OnlineGameState, TimeData } from '@/types/online'
import { makeMove as makeMoveLogic, createNewGame } from '@/utils/shogi/game'

export function useOnlineGame() {
  const { socket, currentRoom, makeMove: sendMove, syncTime } = useSocket()
  const { user } = useAuth()
  const [gameState, setGameState] = useState<OnlineGameState | null>(null)
  const [timeData, setTimeData] = useState<TimeData | null>(null)
  const [myColor, setMyColor] = useState<Player | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [opponentInfo, setOpponentInfo] = useState<{ id: string; name: string } | null>(null)

  // ゲーム開始時の初期化
  useEffect(() => {
    if (!socket || !currentRoom || !user) return

    const handleGameStart = ({ room }: { room: { id: string; players: Array<{ id: string; name: string; color: string }>; timeControl?: { initial: number; periods?: number } } }) => {
      const player = room.players.find((p) => p.id === user.id)
      const opponent = room.players.find((p) => p.id !== user.id)
      
      if (player && opponent) {
        const color = player.color === Player.SENTE ? Player.SENTE : Player.GOTE
        setMyColor(color)
        setOpponentInfo({ id: opponent.id, name: opponent.name })
        
        // 新しいゲームを作成
        const newGame = createNewGame()
        const onlineGame: OnlineGameState = {
          ...newGame,
          roomId: room.id,
          onlineStatus: 'playing'
        }
        setGameState(onlineGame)
        setIsMyTurn(color === Player.SENTE)
        
        // 時間制御の初期化
        if (room.timeControl) {
          setTimeData({
            [Player.SENTE]: {
              remaining: room.timeControl.initial,
              periods: room.timeControl.periods
            },
            [Player.GOTE]: {
              remaining: room.timeControl.initial,
              periods: room.timeControl.periods
            },
            lastUpdate: Date.now()
          })
        }
      }
    }

    const handleMoveMade = ({ gameState: newState }: { move: Move; gameState: OnlineGameState }) => {
      setGameState(prev => {
        if (!prev) return null
        return {
          ...newState,
          roomId: prev.roomId,
          onlineStatus: prev.onlineStatus,
          timeData: prev.timeData
        }
      })
      setIsMyTurn(true)
    }

    const handleTimeSynced = ({ timeData }: { timeData: TimeData }) => {
      setTimeData(timeData)
    }

    const handleOpponentDisconnected = () => {
      setGameState(prev => {
        if (!prev) return null
        return {
          ...prev,
          onlineStatus: 'paused'
        }
      })
    }

    const handleOpponentReconnected = () => {
      setGameState(prev => {
        if (!prev) return null
        return {
          ...prev,
          onlineStatus: 'playing'
        }
      })
    }

    const handleGameResigned = () => {
      setGameState(prev => {
        if (!prev) return null
        return {
          ...prev,
          onlineStatus: 'finished',
          resigned: true
        }
      })
    }

    interface RoomRejoined {
      room: {
        id: string
        players: Array<{
          id: string
          name: string
          color: string
        }>
      }
      gameState?: OnlineGameState
    }
    
    const handleRoomRejoined = ({ room, gameState: rejoinedGameState }: RoomRejoined) => {
      // 再接続後のゲーム状態の復元
      if (rejoinedGameState) {
        setGameState({
          ...rejoinedGameState,
          roomId: room.id,
          onlineStatus: 'playing'
        })
        setIsMyTurn(rejoinedGameState.currentPlayer === myColor)
      }
      
      // 対戦相手の情報を復元
      const opponent = room.players.find((p) => p.id !== user.id)
      if (opponent) {
        setOpponentInfo({ id: opponent.id, name: opponent.name })
      }
    }

    socket.on('game_start', handleGameStart)
    socket.on('move_made', handleMoveMade)
    socket.on('time_synced', handleTimeSynced)
    socket.on('opponent_disconnected', handleOpponentDisconnected)
    socket.on('opponent_reconnected', handleOpponentReconnected)
    socket.on('game_resigned', handleGameResigned)
    socket.on('room_rejoined', handleRoomRejoined)

    return () => {
      socket.off('game_start', handleGameStart)
      socket.off('move_made', handleMoveMade)
      socket.off('time_synced', handleTimeSynced)
      socket.off('opponent_disconnected', handleOpponentDisconnected)
      socket.off('opponent_reconnected', handleOpponentReconnected)
      socket.off('game_resigned', handleGameResigned)
      socket.off('room_rejoined', handleRoomRejoined)
    }
  }, [socket, currentRoom, user, myColor])

  // 時間管理
  useEffect(() => {
    if (!timeData || !gameState || gameState.onlineStatus !== 'playing') return

    const interval = setInterval(() => {
      setTimeData(prev => {
        if (!prev || !myColor) return prev
        
        const currentPlayer = gameState.currentPlayer
        const newTimeData = { ...prev }
        
        if (isMyTurn && currentPlayer === myColor) {
          const elapsed = Date.now() - prev.lastUpdate
          newTimeData[currentPlayer].remaining -= elapsed / 1000
          
          if (newTimeData[currentPlayer].remaining <= 0) {
            // 時間切れ処理
            // TODO: 時間切れを通知
          }
        }
        
        newTimeData.lastUpdate = Date.now()
        return newTimeData
      })
    }, 100)

    return () => clearInterval(interval)
  }, [timeData, gameState, myColor, isMyTurn])

  // 移動を実行
  const makeMove = useCallback((move: Move) => {
    if (!gameState || !isMyTurn || !myColor) return false

    // 自分の手番かチェック
    if (gameState.currentPlayer !== myColor) return false

    // ローカルで移動を実行
    const newState = makeMoveLogic(gameState, move)
    if (!newState) return false

    // 状態を更新
    setGameState({
      ...newState,
      roomId: gameState.roomId,
      onlineStatus: gameState.onlineStatus,
      timeData: gameState.timeData
    })
    setIsMyTurn(false)

    // サーバーに送信
    sendMove(move, newState)

    // 時間を同期
    if (timeData) {
      const newTimeData = {
        ...timeData,
        lastUpdate: Date.now()
      }
      setTimeData(newTimeData)
      syncTime(newTimeData)
    }

    return true
  }, [gameState, isMyTurn, myColor, sendMove, syncTime, timeData])

  return {
    gameState,
    timeData,
    myColor,
    isMyTurn,
    opponentInfo,
    makeMove
  }
}