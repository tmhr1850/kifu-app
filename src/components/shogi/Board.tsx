'use client'

import React from 'react'
import { Piece } from './Piece'
import { getInitialBoard, BoardPiece } from '@/utils/shogi/initialSetup'

interface BoardProps {
  onPieceClick?: (row: number, col: number, piece: BoardPiece) => void
  onCellClick?: (row: number, col: number) => void
}

export const Board: React.FC<BoardProps> = ({ onPieceClick, onCellClick }) => {
  const boardState = getInitialBoard()
  const colNumbers = [9, 8, 7, 6, 5, 4, 3, 2, 1]
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

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
          
          <div className="board flex-1 grid grid-cols-9 gap-0.5 bg-amber-800 p-1">
            {boardState.map((row, rowIndex) => 
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="board-cell bg-amber-200 aspect-square flex items-center justify-center hover:bg-amber-300 transition-colors"
                  onClick={() => {
                    if (piece && onPieceClick) {
                      onPieceClick(rowIndex, colIndex, piece)
                    } else if (!piece && onCellClick) {
                      onCellClick(rowIndex, colIndex)
                    }
                  }}
                >
                  {piece && (
                    <Piece
                      type={piece.type}
                      isGote={piece.isGote}
                      onClick={onPieceClick ? () => onPieceClick(rowIndex, colIndex, piece) : undefined}
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