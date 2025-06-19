'use client'

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
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
  
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLDivElement | null)[][]>(Array(9).fill(null).map(() => Array(9).fill(null)))

  // キーボードナビゲーションのハンドラー
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!focusedCell) {
      // 初めてのフォーカス時は左上のセルから開始
      setFocusedCell({ row: 0, col: 0 })
      return
    }

    const { row, col } = focusedCell
    let newRow = row
    let newCol = col

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        newRow = Math.max(0, row - 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        newRow = Math.min(8, row + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        newCol = Math.max(0, col - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        newCol = Math.min(8, col + 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        const piece = boardState[row][col]
        if (piece && onPieceClick) {
          onPieceClick(row, col, piece)
        } else if (!piece && onCellClick) {
          onCellClick(row, col)
        }
        break
      default:
        return
    }

    if (newRow !== row || newCol !== col) {
      setFocusedCell({ row: newRow, col: newCol })
    }
  }

  // フォーカスされたセルをフォーカス
  useEffect(() => {
    if (focusedCell && cellRefs.current[focusedCell.row][focusedCell.col]) {
      cellRefs.current[focusedCell.row][focusedCell.col]?.focus()
    }
  }, [focusedCell])

  // 駒名を日本語で取得
  const getPieceName = (piece: BoardPiece) => {
    const pieceNames: { [key: string]: string } = {
      '王': '王将',
      '玉': '玉将',
      '飛': '飛車',
      '龍': '龍王',
      '角': '角行',
      '馬': '龍馬',
      '金': '金将',
      '銀': '銀将',
      '全': '成銀',
      '桂': '桂馬',
      '圭': '成桂',
      '香': '香車',
      '杏': '成香',
      '歩': '歩兵',
      'と': 'と金'
    }
    return pieceNames[piece.type] || piece.type
  }

  return (
    <div className="board-container max-w-screen-sm mx-auto p-2 sm:p-4">
      <div className="board-wrapper aspect-square">
        <div className="flex">
          <div className="w-6 sm:w-8" />
          <div className="flex-1 flex">
            {colNumbers.map((num) => (
              <div key={num} className="flex-1 text-center text-xs sm:text-sm font-semibold">
                {num}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex">
          <div className="w-6 sm:w-8 flex flex-col">
            {rowKanji.map((kanji) => (
              <div key={kanji} className="flex-1 flex items-center justify-center text-xs sm:text-sm font-semibold">
                {kanji}
              </div>
            ))}
          </div>
          
          <div 
            ref={boardRef}
            className="board shogi-board flex-1 grid grid-cols-9 gap-0.5 p-1"
            style={{ backgroundColor: 'var(--board-bg)' }}
            data-testid="game-board"
            role="grid"
            aria-label="将棋盤"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {boardState.map((row, rowIndex) => 
              row.map((piece, colIndex) => {
                const isCurrentFocus = focusedCell?.row === rowIndex && focusedCell?.col === colIndex
                const colNumber = 9 - colIndex
                const position = `${colNumber}${rowKanji[rowIndex]}`
                const cellAriaLabel = piece 
                  ? `${position}、${piece.isGote ? '後手' : '先手'}の${getPieceName(piece)}`
                  : `${position}、空のマス`
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    ref={(el) => {
                      if (cellRefs.current[rowIndex]) {
                        cellRefs.current[rowIndex][colIndex] = el
                      }
                    }}
                    className={`board-cell aspect-square flex items-center justify-center transition-colors ${
                      isCurrentFocus ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                    }`}
                    style={{ 
                      backgroundColor: isCurrentFocus ? 'var(--square-hover)' : 'var(--board-bg)',
                      borderColor: 'var(--board-grid)'
                    }}
                    data-testid={`square-${rowIndex}-${colIndex}`}
                    role="gridcell"
                    aria-label={cellAriaLabel}
                    tabIndex={isCurrentFocus ? 0 : -1}
                    onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                    onMouseEnter={(e) => {
                      if (!isCurrentFocus) {
                        e.currentTarget.style.backgroundColor = 'var(--square-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentFocus) {
                        e.currentTarget.style.backgroundColor = 'var(--board-bg)'
                      }
                    }}
                    onClick={() => {
                      setFocusedCell({ row: rowIndex, col: colIndex })
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
                      row={rowIndex}
                      col={colIndex}
                    />
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      </div>
    </div>
  )
}