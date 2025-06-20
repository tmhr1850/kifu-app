'use client'

import { useState, useEffect, useMemo } from 'react'
import { KifuRecord } from '@/types/kifu'
import { createGameFromKifu } from '@/utils/shogi/gameWithKifu'

import { DraggableBoard } from '@/components/shogi/DraggableBoard'
import KifuReplayControls from './KifuReplayControls'

interface KifuReplayBoardProps {
  kifu: KifuRecord
  className?: string
}

export default function KifuReplayBoard({ kifu, className = '' }: KifuReplayBoardProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [highlightSquares, setHighlightSquares] = useState<{ row: number; col: number }[]>([])

  const gameAtMove = useMemo(() => {
    const game = createGameFromKifu()
    
    if (currentMoveIndex === -1) {
      return game.game
    }

    const movesToReplay = kifu.moves.slice(0, currentMoveIndex + 1)
    
    for (const move of movesToReplay) {
      const fromIndex = move.from ? move.from.row * 9 + move.from.col : -1
      const toIndex = move.to.row * 9 + move.to.col
      
      if (fromIndex >= 0) {
        game.game = game.game.makeMove(fromIndex, toIndex, move.promote || false)
      } else {
        const pieceType = game.game.getPieceTypeFromKanji(move.piece)
        if (pieceType) {
          game.game = game.game.placePiece(pieceType, toIndex)
        }
      }
    }

    return game.game
  }, [kifu, currentMoveIndex])

  useEffect(() => {
    if (currentMoveIndex >= 0 && currentMoveIndex < kifu.moves.length) {
      const move = kifu.moves[currentMoveIndex]
      const highlights: { row: number; col: number }[] = []
      
      if (move.from) {
        highlights.push(move.from)
      }
      highlights.push(move.to)
      
      setHighlightSquares(highlights)
    } else {
      setHighlightSquares([])
    }
  }, [currentMoveIndex, kifu.moves])

  const getSquareHighlight = (row: number, col: number) => {
    const isHighlighted = highlightSquares.some(
      (square) => square.row === row && square.col === col
    )
    
    if (!isHighlighted) return ''
    
    if (currentMoveIndex >= 0 && currentMoveIndex < kifu.moves.length) {
      const move = kifu.moves[currentMoveIndex]
      if (move.from && move.from.row === row && move.from.col === col) {
        return 'ring-4 ring-blue-400'
      }
      if (move.to.row === row && move.to.col === col) {
        return 'ring-4 ring-red-400'
      }
    }
    
    return ''
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-2">棋譜再生</h2>
        {kifu.gameInfo && (
          <div className="text-sm text-gray-600 mb-2">
            {kifu.gameInfo.sente && <span>先手: {kifu.gameInfo.sente}</span>}
            {kifu.gameInfo.gote && <span className="ml-4">後手: {kifu.gameInfo.gote}</span>}
            {kifu.gameInfo.date && <span className="ml-4">{kifu.gameInfo.date}</span>}
          </div>
        )}
      </div>

      <DraggableBoard
        board={gameAtMove.board}
      />

      <KifuReplayControls
        moves={kifu.moves}
        currentMoveIndex={currentMoveIndex}
        onMoveIndexChange={setCurrentMoveIndex}
      />
    </div>
  )
}