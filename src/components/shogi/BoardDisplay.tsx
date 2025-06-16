'use client'

import React from 'react'
import { Piece } from './Piece'
import { BoardPiece } from '@/utils/shogi/initialSetup'

interface BoardDisplayProps {
  board: (BoardPiece | null)[][]
  lastMove?: { from: { row: number; col: number }; to: { row: number; col: number } } | null
  getSquareHighlight?: (row: number, col: number) => string
}

export const BoardDisplay: React.FC<BoardDisplayProps> = ({ 
  board, 
  lastMove,
  getSquareHighlight
}) => {
  const colNumbers = [9, 8, 7, 6, 5, 4, 3, 2, 1]
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

  const isHighlighted = (row: number, col: number) => {
    if (!lastMove) return false
    const isFrom = lastMove.from.row === row && lastMove.from.col === col
    const isTo = lastMove.to.row === row && lastMove.to.col === col
    return isFrom || isTo
  }

  const getHighlightClass = (row: number, col: number) => {
    if (getSquareHighlight) {
      return getSquareHighlight(row, col)
    }
    
    if (!lastMove) return ''
    
    if (lastMove.from.row === row && lastMove.from.col === col) {
      return 'ring-4 ring-blue-400'
    }
    if (lastMove.to.row === row && lastMove.to.col === col) {
      return 'ring-4 ring-red-400'
    }
    
    return ''
  }

  return (
    <div className="board-container max-w-screen-sm mx-auto p-4">
      <div className="board-wrapper aspect-square">
        <div className="flex">
          <div className="w-8" />
          <div className="flex-1 flex">
            {colNumbers.map((num) => (
              <div key={num} className="flex-1 text-center text-xs sm:text-sm font-semibold">
                {num}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex">
          <div className="w-8 flex flex-col">
            {rowKanji.map((kanji) => (
              <div key={kanji} className="flex-1 flex items-center justify-center text-xs sm:text-sm font-semibold">
                {kanji}
              </div>
            ))}
          </div>
          
          <div className="board flex-1 grid grid-cols-9 gap-0.5 bg-amber-800 p-1" role="grid">
            {board.map((row, rowIndex) => 
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`board-cell bg-amber-200 aspect-square flex items-center justify-center transition-colors ${
                    getHighlightClass(rowIndex, colIndex)
                  }`}
                >
                  {piece && (
                    <Piece
                      type={piece.type}
                      isGote={piece.isGote}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}