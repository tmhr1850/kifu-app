'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Piece } from './Piece'
import { getInitialBoard, BoardPiece } from '@/utils/shogi/initialSetup'
import { Position, getValidMoves, isValidMove } from '@/utils/shogi/moveRules'
import PromotionModal from './PromotionModal'
import { canPromotePiece, canPromoteAt, mustPromoteAt, promotePiece, getPieceDisplayName } from '@/utils/shogi/pieceUtils'

interface DraggableBoardProps {
  onMove?: (from: Position, to: Position) => void
  lastMove?: { from: Position; to: Position } | null
}

export const DraggableBoard: React.FC<DraggableBoardProps> = ({ onMove, lastMove }) => {
  const [boardState, setBoardState] = useState(getInitialBoard())
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [draggedPiece, setDraggedPiece] = useState<{ position: Position, piece: BoardPiece } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [promotionChoice, setPromotionChoice] = useState<{ from: Position, to: Position, piece: BoardPiece } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const colNumbers = [9, 8, 7, 6, 5, 4, 3, 2, 1]
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])


  const cancelSelection = () => {
    setSelectedPosition(null)
    setValidMoves([])
    setDraggedPiece(null)
    isDragging.current = false
  }

  const selectPiece = (row: number, col: number, piece: BoardPiece) => {
    const position = { row, col }
    setSelectedPosition(position)
    const moves = getValidMoves(boardState, position, piece)
    setValidMoves(moves)
  }

  const handlePieceClick = (row: number, col: number, piece: BoardPiece) => {
    if (selectedPosition && selectedPosition.row === row && selectedPosition.col === col) {
      cancelSelection()
    } else {
      selectPiece(row, col, piece)
    }
  }

  const handleCellClick = useCallback((row: number, col: number) => {
    if (selectedPosition && isValidMove(boardState, selectedPosition, { row, col })) {
      const piece = boardState[selectedPosition.row][selectedPosition.col]
      if (piece) {
        checkPromotion(selectedPosition, { row, col }, piece)
      }
    }
  }, [selectedPosition, boardState, checkPromotion])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, row: number, col: number, piece: BoardPiece) => {
    e.preventDefault()
    isDragging.current = true

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragOffset({
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2
    })

    setMousePosition({ x: clientX, y: clientY })
    setDraggedPiece({ position: { row, col }, piece })
    selectPiece(row, col, piece)
  }

  const handleDropAtPosition = useCallback((clientX: number, clientY: number) => {
    if (!draggedPiece || !boardRef.current) {
      setSelectedPosition(null)
      setValidMoves([])
      setDraggedPiece(null)
      isDragging.current = false
      return
    }

    const boardRect = boardRef.current.getBoundingClientRect()
    const cellWidth = boardRect.width / 9
    const cellHeight = boardRect.height / 9

    const col = Math.floor((clientX - boardRect.left) / cellWidth)
    const row = Math.floor((clientY - boardRect.top) / cellHeight)

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      const targetCol = 8 - col
      if (isValidMove(boardState, draggedPiece.position, { row, col: targetCol })) {
        const from = draggedPiece.position
        const to = { row, col: targetCol }
        const piece = boardState[from.row][from.col]
        
        if (piece) {
          checkPromotion(from, to, piece)
          return
        }
      }
    }

    setSelectedPosition(null)
    setValidMoves([])
    setDraggedPiece(null)
    isDragging.current = false
  }, [draggedPiece, boardState, checkPromotion])

  const movePiece = useCallback((from: Position, to: Position, shouldPromote: boolean = false) => {
    const newBoard = boardState.map(row => [...row])
    const piece = newBoard[from.row][from.col]
    
    if (piece) {
      // 成り処理
      if (shouldPromote && canPromotePiece(piece.type)) {
        const promotedType = promotePiece(piece.type)
        newBoard[to.row][to.col] = { ...piece, type: promotedType, promoted: true }
      } else {
        newBoard[to.row][to.col] = piece
      }
      
      newBoard[from.row][from.col] = null
      setBoardState(newBoard)
      
      if (onMove) {
        onMove(from, to)
      }
    }

    setSelectedPosition(null)
    setValidMoves([])
    setDraggedPiece(null)
    isDragging.current = false
  }, [boardState, onMove])

  const checkPromotion = useCallback((from: Position, to: Position, piece: BoardPiece) => {
    // 既に成っている駒は成れない
    if (piece.promoted) {
      movePiece(from, to, false)
      return
    }

    // 成れる駒かチェック
    if (!canPromotePiece(piece.type)) {
      movePiece(from, to, false)
      return
    }

    // 成れる位置かチェック
    if (!canPromoteAt(from.row, to.row, piece.isGote)) {
      movePiece(from, to, false)
      return
    }

    // 強制成りかチェック
    if (mustPromoteAt(piece.type, to.row, piece.isGote)) {
      movePiece(from, to, true)
      return
    }

    // 成り選択モーダルを表示
    setPromotionChoice({ from, to, piece })
  }, [movePiece])

  const isHighlighted = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col)
  }

  const isSelected = (row: number, col: number) => {
    return selectedPosition?.row === row && selectedPosition?.col === col
  }

  const isLastMoveSquare = (row: number, col: number) => {
    if (!lastMove) return false
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    )
  }

  useEffect(() => {
    if (draggedPiece) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }

      const handleMouseUp = (e: MouseEvent) => {
        handleDropAtPosition(e.clientX, e.clientY)
      }

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        setMousePosition({ x: touch.clientX, y: touch.clientY })
      }

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.changedTouches[0]
        handleDropAtPosition(touch.clientX, touch.clientY)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: false })

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [draggedPiece, handleDropAtPosition])

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
          
          <div 
            ref={boardRef}
            className="board flex-1 grid grid-cols-9 gap-0.5 bg-amber-800 p-1 relative"
          >
            {boardState.map((row, rowIndex) => 
              row.map((piece, colIndex) => {
                const actualCol = 8 - colIndex
                const isHighlight = isHighlighted(rowIndex, actualCol)
                const isSelect = isSelected(rowIndex, actualCol)
                const isLastMove = isLastMoveSquare(rowIndex, actualCol)
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      board-cell bg-amber-200 aspect-square flex items-center justify-center
                      transition-all duration-200
                      ${isHighlight ? 'bg-green-300 hover:bg-green-400' : 'hover:bg-amber-300'}
                      ${isSelect ? 'bg-amber-400' : ''}
                      ${isLastMove ? 'ring-2 ring-blue-500 ring-inset' : ''}
                      ${!piece && !isHighlight ? 'cursor-default' : 'cursor-pointer'}
                    `}
                    onClick={() => {
                      if (piece) {
                        handlePieceClick(rowIndex, actualCol, piece)
                      } else if (isHighlight) {
                        handleCellClick(rowIndex, actualCol)
                      }
                    }}
                  >
                    {piece && (
                      <div
                        className={`${draggedPiece?.position.row === rowIndex && draggedPiece?.position.col === actualCol ? 'opacity-50' : ''}`}
                        onMouseDown={(e) => handleDragStart(e, rowIndex, actualCol, piece)}
                        onTouchStart={(e) => handleDragStart(e, rowIndex, actualCol, piece)}
                      >
                        <Piece
                          type={piece.type}
                          isGote={piece.isGote}
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {draggedPiece && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePosition.x - dragOffset.x,
            top: mousePosition.y - dragOffset.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Piece
            type={draggedPiece.piece.type}
            isGote={draggedPiece.piece.isGote}
          />
        </div>
      )}

      {promotionChoice && (
        <PromotionModal
          isOpen={true}
          onPromote={() => {
            movePiece(promotionChoice.from, promotionChoice.to, true)
            setPromotionChoice(null)
          }}
          onCancel={() => {
            movePiece(promotionChoice.from, promotionChoice.to, false)
            setPromotionChoice(null)
          }}
          pieceName={getPieceDisplayName(promotionChoice.piece.type)}
          canCancel={!mustPromoteAt(promotionChoice.piece.type, promotionChoice.to.row, promotionChoice.piece.isGote)}
        />
      )}
    </div>
  )
}