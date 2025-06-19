'use client'

import React, { useCallback, useMemo, useEffect } from 'react'
import { DraggableBoard } from './DraggableBoard'
import { GameState, Move, Player, Position, PieceType } from '@/types/shogi'
import { getPieceAt } from '@/utils/shogi/board'
import { canPromoteMove, mustPromoteMove } from '@/utils/shogi/validators'
import { PromotionModal } from './PromotionModal'
import { useAudio, SoundType } from '@/contexts/AudioContext'
import { isInCheck, isCheckmateSync } from '@/utils/shogi/validators'

interface AIGameBoardProps {
  gameState: GameState
  onMove: (move: Move) => boolean
  playerColor: Player
  disabled?: boolean
}

export default function AIGameBoard({ 
  gameState, 
  onMove, 
  playerColor,
  disabled = false 
}: AIGameBoardProps) {
  const { playSound } = useAudio()
  const [promotionDialog, setPromotionDialog] = React.useState<{
    from: Position
    to: Position
    piece: { type: PieceType; player: Player }
  } | null>(null)

  // 最終着手を計算
  const lastMove = useMemo(() => {
    const moves = gameState.moveHistory || []
    if (moves.length === 0) return null

    const gameMove = moves[moves.length - 1]
    if (!gameMove) return null

    return {
      from: gameMove.from || { row: -1, col: -1 },
      to: gameMove.to
    }
  }, [gameState])

  // AIの着手時に効果音を再生
  useEffect(() => {
    if (gameState.moveHistory.length > 0 && gameState.currentPlayer === playerColor) {
      // 最後の手がAIの手なので効果音を再生
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1]
      if (lastMove?.captured) {
        playSound(SoundType.CAPTURE)
      } else {
        playSound(SoundType.MOVE)
      }

      // 王手・詰み判定
      if (isInCheck(gameState)) {
        if (isCheckmateSync(gameState)) {
          playSound(SoundType.CHECKMATE)
          playSound(SoundType.GAME_END)
        } else {
          playSound(SoundType.CHECK)
        }
      }
    }
  }, [gameState, playerColor, playSound])


  // 移動ハンドラー
  const handleMove = useCallback((from: Position, to: Position) => {
    if (disabled) return
    if (gameState.currentPlayer !== playerColor) return

    const piece = getPieceAt(gameState.board, from)
    if (!piece) return

    // 成り判定
    if (canPromoteMove(gameState.board, from, to, playerColor)) {
      if (mustPromoteMove(gameState.board, from, to, playerColor)) {
        // 強制的に成る
        const move: Move = {
          from,
          to,
          piece,
          promote: true
        }
        onMove(move)
      } else {
        // 成るかどうか選択
        setPromotionDialog({ from, to, piece })
      }
    } else {
      // 成れない場合は通常移動
      const move: Move = {
        from,
        to,
        piece
      }
      onMove(move)
    }
  }, [gameState, playerColor, disabled, onMove])

  // 成り選択ハンドラー
  const handlePromotionChoice = useCallback((promote: boolean) => {
    if (!promotionDialog) return

    const move: Move = {
      from: promotionDialog.from,
      to: promotionDialog.to,
      piece: promotionDialog.piece,
      promote
    }

    onMove(move)
    setPromotionDialog(null)
  }, [promotionDialog, onMove])


  return (
    <>
      <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <DraggableBoard
          board={gameState.board}
          onMove={handleMove}
          lastMove={lastMove}
        />
        {/* TODO: 持ち駒表示を追加 */}
      </div>

      {promotionDialog && (
        <PromotionModal
          piece={promotionDialog.piece}
          onChoose={handlePromotionChoice}
          onCancel={() => setPromotionDialog(null)}
        />
      )}
    </>
  )
}