'use client'

import { useOnlineGame } from '@/hooks/useOnlineGame'
import { DraggableBoard } from '@/components/shogi/DraggableBoard'
import { Player } from '@/types/shogi'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { ConnectionStatus } from './ConnectionStatus'
import { useAudio, SoundType } from '@/contexts/AudioContext'
import { useEffect, useState } from 'react'
import { captureException } from '@/utils/monitoring'

interface OnlineGameBoardProps {
  roomId: string
}

export function OnlineGameBoard({ roomId }: OnlineGameBoardProps) {
  const { gameState, myColor, isMyTurn, opponentInfo, makeMove } = useOnlineGame()
  const { connected } = useSocket()
  const { user } = useAuth()
  const { playSound } = useAudio()
  const [error, setError] = useState<string | null>(null)

  // エラーハンドリング付きの着手処理
  const handleMove = async (from: string, to: string, promote?: boolean) => {
    try {
      setError(null)
      await makeMove(from, to, promote)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '着手エラーが発生しました'
      setError(errorMessage)
      captureException(new Error(errorMessage), {
        context: 'OnlineGameBoard.handleMove',
        roomId,
        from,
        to,
        promote
      })
    }
  }

  // 相手の着手時に効果音を再生
  useEffect(() => {
    try {
      if (gameState && gameState.moveHistory.length > 0 && !isMyTurn) {
        const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1]
        if (lastMove?.captured) {
          playSound(SoundType.CAPTURE)
        } else {
          playSound(SoundType.MOVE)
        }
      }
    } catch (err) {
      captureException(err as Error, {
        context: 'OnlineGameBoard.soundEffect',
        roomId
      })
    }
  }, [gameState, isMyTurn, playSound, roomId])

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">対局の準備中...</p>
          {!connected && (
            <p className="text-red-500 mt-2">サーバーに接続していません</p>
          )}
        </div>
      </div>
    )
  }

  if (!opponentInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">対戦相手を待っています...</p>
          <p className="text-sm text-gray-500 mt-2">ルームID: {roomId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      <ConnectionStatus />
      
      {/* 対戦相手情報 */}
      <div className="bg-gray-100 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{opponentInfo.name}</p>
            <p className="text-sm text-gray-600">
              {myColor === Player.SENTE ? '後手' : '先手'}
            </p>
          </div>
          {gameState.onlineStatus === 'paused' && (
            <p className="text-yellow-600 text-sm">接続が切れています</p>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mx-4 mt-2">
          <p className="text-red-800 text-sm">
            😢 エラー: {error}
          </p>
        </div>
      )}

      {/* 将棋盤 */}
      <div className="flex-1 bg-amber-100 p-4">
        <DraggableBoard
          gameState={gameState}
          onMove={handleMove}
          disabled={!isMyTurn || gameState.onlineStatus !== 'playing'}
          orientation={myColor === Player.GOTE ? Player.GOTE : Player.SENTE}
        />
      </div>

      {/* 自分の情報 */}
      <div className="bg-gray-100 p-4 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{user?.email || 'あなた'}</p>
            <p className="text-sm text-gray-600">
              {myColor === Player.SENTE ? '先手' : '後手'}
            </p>
          </div>
          {isMyTurn && gameState.onlineStatus === 'playing' && (
            <p className="text-green-600 text-sm font-semibold">あなたの手番</p>
          )}
        </div>
      </div>
    </div>
  )
}