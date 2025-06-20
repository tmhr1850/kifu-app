'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Piece } from './Piece'
import { getInitialBoard, BoardPiece } from '@/utils/shogi/initialSetup'
import { getSquareAriaLabel } from '@/utils/accessibility'

interface BoardProps {
  onPieceClick?: (row: number, col: number, piece: BoardPiece) => void
  onCellClick?: (row: number, col: number) => void
}

export const Board: React.FC<BoardProps> = ({ onPieceClick, onCellClick }) => {
  const boardState = getInitialBoard()
  const colNumbers = [9, 8, 7, 6, 5, 4, 3, 2, 1]
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
  const [focusedSquare, setFocusedSquare] = useState<{ row: number; col: number }>({ row: 0, col: 0 })

  // キーボードナビゲーションのハンドラー
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { row, col } = focusedSquare;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(8, col + 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const piece = boardState[row][col];
        if (piece && onPieceClick) {
          onPieceClick(row, col, piece);
        } else if (!piece && onCellClick) {
          onCellClick(row, col);
        }
        return;
      default:
        return;
    }

    setFocusedSquare({ row: newRow, col: newCol });
    // フォーカスを新しいマスに移動
    const newSquare = document.querySelector(`[data-testid="square-${newRow}-${newCol}"]`) as HTMLElement;
    newSquare?.focus();
  }, [focusedSquare, boardState, onPieceClick, onCellClick]);

  useEffect(() => {
    const boardElement = document.querySelector('[role="grid"]');
    if (boardElement) {
      const eventHandler = (e: Event) => {
        if (e instanceof KeyboardEvent) {
          handleKeyDown(e);
        }
      };
      boardElement.addEventListener('keydown', eventHandler);
      return () => {
        boardElement.removeEventListener('keydown', eventHandler);
      };
    }
  }, [handleKeyDown])

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
            className="board shogi-board flex-1 grid grid-cols-9 gap-0.5 p-1"
            style={{ backgroundColor: 'var(--board-bg)' }}
            data-testid="game-board"
            role="grid"
            aria-label="将棋盤"
            tabIndex={0}
          >
            {boardState.map((row, rowIndex) => 
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`board-cell aspect-square flex items-center justify-center transition-colors ${
                    focusedSquare.row === rowIndex && focusedSquare.col === colIndex
                      ? 'ring-2 ring-blue-500 ring-inset'
                      : ''
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
                  style={{ 
                    backgroundColor: 'var(--board-bg)',
                    borderColor: 'var(--board-grid)'
                  }}
                  data-testid={`square-${rowIndex}-${colIndex}`}
                  role="gridcell"
                  aria-label={getSquareAriaLabel(colIndex, rowIndex, piece)}
                  tabIndex={focusedSquare.row === rowIndex && focusedSquare.col === colIndex ? 0 : -1}
                  onFocus={() => setFocusedSquare({ row: rowIndex, col: colIndex })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--square-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--board-bg)'
                  }}
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
                      row={rowIndex}
                      col={colIndex}
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

export default Board;