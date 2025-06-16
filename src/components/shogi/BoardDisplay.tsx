'use client'

import React from 'react'
import { Piece } from './Piece'
import { Piece as PieceInterface, PieceType, Player } from '@/types/shogi'

interface BoardDisplayProps {
  board: (PieceInterface | null)[][]
  getSquareHighlight?: (row: number, col: number) => string
  isFlipped?: boolean
  senteCaptures?: Map<PieceType, number>
  goteCaptures?: Map<PieceType, number>
}

export default function BoardDisplay({ 
  board, 
  getSquareHighlight,
  isFlipped = false,
  senteCaptures,
  goteCaptures 
}: BoardDisplayProps) {
  const colNumbers = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1]
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

  const renderCaptures = (captures: Map<PieceType, number> | undefined, isGote: boolean) => {
    if (!captures || captures.size === 0) return null

    const pieceOrder = [
      PieceType.FU, PieceType.KYO, PieceType.KEI, 
      PieceType.GIN, PieceType.KIN, PieceType.KAKU, PieceType.HI
    ]

    return (
      <div className={`flex flex-wrap gap-1 p-2 bg-gray-100 rounded ${isGote ? 'flex-row-reverse' : ''}`}>
        {pieceOrder.map(pieceType => {
          const count = captures.get(pieceType) || 0
          if (count === 0) return null
          
          return (
            <div key={pieceType} className="relative">
              <Piece type={pieceType} isGote={isGote} />
              {count > 1 && (
                <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-white rounded-full px-1">
                  {count}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="board-container max-w-screen-sm mx-auto p-4">
      {/* 後手の持ち駒 */}
      {goteCaptures && (
        <div className="mb-2">
          <div className="text-sm font-semibold mb-1">後手持駒</div>
          {renderCaptures(goteCaptures, true)}
        </div>
      )}

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
            {rowKanji.map((kanji, index) => (
              <div key={kanji} className="flex-1 flex items-center justify-center text-xs sm:text-sm font-semibold">
                {isFlipped ? rowKanji[8 - index] : kanji}
              </div>
            ))}
          </div>
          
          <div className="board flex-1 grid grid-cols-9 gap-0.5 bg-amber-800 p-1" role="grid">
            {board.map((row, rowIndex) => 
              row.map((piece, colIndex) => {
                const displayRow = isFlipped ? 8 - rowIndex : rowIndex
                const displayCol = isFlipped ? 8 - colIndex : colIndex
                const displayPiece = board[displayRow][displayCol]
                const highlight = getSquareHighlight ? getSquareHighlight(displayRow, displayCol) : ''
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`board-cell bg-amber-200 aspect-square flex items-center justify-center ${highlight}`}
                  >
                    {displayPiece && (
                      <Piece
                        type={displayPiece.type}
                        isGote={displayPiece.player === Player.GOTE}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 先手の持ち駒 */}
      {senteCaptures && (
        <div className="mt-2">
          <div className="text-sm font-semibold mb-1">先手持駒</div>
          {renderCaptures(senteCaptures, false)}
        </div>
      )}
    </div>
  )
}