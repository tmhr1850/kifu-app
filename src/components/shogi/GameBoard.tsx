'use client';

import React, { useState, useCallback } from 'react'
import { Move, Player, Position } from '@/types/shogi'
import { DraggableBoard } from './DraggableBoard'
import { GameController } from './GameController'
import { GameStateWithKifu, createNewGameWithKifu, makeMoveWithKifu } from '@/utils/shogi/gameWithKifu'
import { KifuSaveDialog } from '../kifu/KifuSaveDialog'
import { getGameStatus } from '@/utils/shogi/game'

interface GameBoardProps {
  onMove?: (move: Move) => void
  orientation?: Player
  disabled?: boolean
  className?: string
}

export default function GameBoard({ 
  onMove, 
  disabled = false,
  className = '' 
}: GameBoardProps) {
  const [gameState, setGameState] = useState<GameStateWithKifu>(() => createNewGameWithKifu())
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleMove = useCallback((from: Position, to: Position) => {
    if (disabled) return

    const newState = makeMoveWithKifu(gameState, from, to)
    if (newState) {
      setGameState(newState)
      
      // 外部のonMoveハンドラーを呼び出す
      if (onMove) {
        const move: Move = {
          from,
          to,
          piece: gameState.game.board[from.row][from.col]!,
          capturedPiece: gameState.game.board[to.row][to.col],
          isPromotion: false // TODO: プロモーション処理の追加
        }
        onMove(move)
      }
    }
  }, [gameState, onMove, disabled])

  // ゲームの状態を確認
  const gameStatus = getGameStatus(gameState.game)

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex gap-6">
        {/* 将棋盤 */}
        <div className="flex-1">
          <DraggableBoard
            board={gameState.game.board}
            onMove={handleMove}
            lastMove={gameState.kifu.moves.length > 0 ? gameState.kifu.moves[gameState.kifu.moves.length - 1] : null}
          />
        </div>
        
        {/* ゲームコントローラー */}
        <div className="w-80">
          <GameController
            gameState={gameState}
            onGameStateChange={setGameState}
            gameMode="local"
            showTimeControl={false}
          />
          
          {/* 保存ボタン */}
          {gameState.kifu.moves.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                disabled={!gameStatus.isOver}
              >
                棋譜を保存
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 棋譜保存ダイアログ */}
      <KifuSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        kifu={gameState.kifu}
      />
    </div>
  )
}