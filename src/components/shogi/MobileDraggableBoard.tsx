'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Piece } from './Piece'
import { getInitialBoard, BoardPiece } from '@/utils/shogi/initialSetup'
import { Position, getValidMoves, isValidMove } from '@/utils/shogi/moveRules'
import PromotionModal from './PromotionModal'
import { canPromotePiece, canPromoteAt, mustPromoteAt, promotePiece, getPieceDisplayName } from '@/utils/shogi/pieceUtils'

interface MobileDraggableBoardProps {
  board?: (BoardPiece | null)[][]
  onMove?: (from: Position, to: Position) => void
  lastMove?: { from: Position; to: Position } | null
}

export const MobileDraggableBoard: React.FC<MobileDraggableBoardProps> = ({ board, onMove, lastMove }) => {
  const [boardState, setBoardState] = useState(board || getInitialBoard())
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [draggedPiece, setDraggedPiece] = useState<{ position: Position, piece: BoardPiece } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [promotionChoice, setPromotionChoice] = useState<{ from: Position, to: Position, piece: BoardPiece } | null>(null)
  
  // Pinch-to-zoom state
  const [scale, setScale] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const [lastPinchDistance, setLastPinchDistance] = useState(0)
  
  const boardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const touchStartTime = useRef(0)

  const colNumbers = [9, 8, 7, 6, 5, 4, 3, 2, 1]
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

  useEffect(() => {
    if (board) {
      setBoardState(board)
    }
  }, [board])

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
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPosition, boardState])

  const getPinchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number, piece: BoardPiece) => {
    touchStartTime.current = Date.now()
    
    if (e.touches.length === 2) {
      // Start pinch-to-zoom
      e.preventDefault()
      setIsPinching(true)
      setLastPinchDistance(getPinchDistance(e.touches))
      return
    }
    
    if (e.touches.length === 1 && !isPinching) {
      handleDragStart(e, row, col, piece)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && containerRef.current) {
      e.preventDefault()
      const currentDistance = getPinchDistance(e.touches)
      const delta = currentDistance - lastPinchDistance
      
      const newScale = Math.min(Math.max(scale + delta * 0.01, 0.8), 3)
      setScale(newScale)
      setLastPinchDistance(currentDistance)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.current
    
    if (e.touches.length === 0) {
      setIsPinching(false)
      
      // If it was a quick tap (not a drag), handle as click
      if (touchDuration < 200 && !isDragging.current) {
        const touch = e.changedTouches[0]
        const target = document.elementFromPoint(touch.clientX, touch.clientY)
        if (target) {
          target.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY
          }))
        }
      }
    }
  }

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

    // Account for scale when calculating drop position
    const adjustedX = (clientX - boardRect.left) / scale
    const adjustedY = (clientY - boardRect.top) / scale

    const col = Math.floor(adjustedX / (cellWidth / scale))
    const row = Math.floor(adjustedY / (cellHeight / scale))

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      const targetCol = 8 - col
      if (isValidMove(boardState, draggedPiece.position, { row, col: targetCol })) {
        const from = draggedPiece.position
        const to = { row, col: targetCol }
        const piece = boardState[from.row][from.col]
        
        if (piece) {
          checkPromotion(from, to, piece)
          // Haptic feedback on successful move
          if ('vibrate' in navigator) {
            navigator.vibrate(20)
          }
          return
        }
      }
    }

    setSelectedPosition(null)
    setValidMoves([])
    setDraggedPiece(null)
    isDragging.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggedPiece, boardState, scale])

  const movePiece = useCallback((from: Position, to: Position, shouldPromote: boolean = false) => {
    const newBoard = boardState.map(row => [...row])
    const piece = newBoard[from.row][from.col]
    
    if (piece) {
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
    if (piece.promoted) {
      movePiece(from, to, false)
      return
    }

    if (!canPromotePiece(piece.type)) {
      movePiece(from, to, false)
      return
    }

    if (!canPromoteAt(from.row, to.row, piece.isGote)) {
      movePiece(from, to, false)
      return
    }

    if (mustPromoteAt(piece.type, to.row, piece.isGote)) {
      movePiece(from, to, true)
      return
    }

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
    if (draggedPiece && !isPinching) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }

      const handleMouseUp = (e: MouseEvent) => {
        handleDropAtPosition(e.clientX, e.clientY)
      }

      const handleTouchMoveGlobal = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          e.preventDefault()
          const touch = e.touches[0]
          setMousePosition({ x: touch.clientX, y: touch.clientY })
        }
      }

      const handleTouchEndGlobal = (e: TouchEvent) => {
        if (e.changedTouches.length > 0) {
          e.preventDefault()
          const touch = e.changedTouches[0]
          handleDropAtPosition(touch.clientX, touch.clientY)
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMoveGlobal, { passive: false })
      document.addEventListener('touchend', handleTouchEndGlobal, { passive: false })

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMoveGlobal)
        document.removeEventListener('touchend', handleTouchEndGlobal)
      }
    }
  }, [draggedPiece, isPinching, handleDropAtPosition])

  return (
    <div 
      ref={containerRef}
      className="board-container pinch-zoom-container max-w-screen-sm mx-auto p-2 sm:p-4"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="board-wrapper aspect-square transition-transform"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
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
            className="board shogi-board flex-1 grid grid-cols-9 gap-0.5 p-1 relative"
            style={{ backgroundColor: 'var(--board-bg)' }}
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
                      board-cell aspect-square flex items-center justify-center
                      transition-all duration-200
                      ${isHighlight ? 'bg-green-300' : ''}
                      ${isSelect ? 'ring-2 ring-yellow-500 piece-selected' : ''}
                      ${isLastMove ? 'ring-2 ring-blue-500 ring-inset' : ''}
                      ${!piece && !isHighlight ? 'cursor-default' : 'cursor-pointer'}
                    `}
                    style={{
                      backgroundColor: isHighlight ? undefined : 'var(--board-bg)',
                      borderColor: 'var(--board-grid)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isHighlight && !isSelect) {
                        e.currentTarget.style.backgroundColor = 'var(--square-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isHighlight && !isSelect) {
                        e.currentTarget.style.backgroundColor = 'var(--board-bg)'
                      }
                    }}
                    onClick={() => {
                      if (!isPinching && !isDragging.current) {
                        if (piece) {
                          handlePieceClick(rowIndex, actualCol, piece)
                        } else if (isHighlight) {
                          handleCellClick(rowIndex, actualCol)
                        }
                      }
                    }}
                  >
                    {piece && (
                      <div
                        className={`piece-touchable w-full h-full flex items-center justify-center
                          ${draggedPiece?.position.row === rowIndex && draggedPiece?.position.col === actualCol ? 'opacity-50' : ''}`}
                        onMouseDown={(e) => !isPinching && handleDragStart(e, rowIndex, actualCol, piece)}
                        onTouchStart={(e) => handleTouchStart(e, rowIndex, actualCol, piece)}
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

      {draggedPiece && !isPinching && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePosition.x - dragOffset.x,
            top: mousePosition.y - dragOffset.y,
            transform: 'translate(-50%, -50%) scale(1.2)'
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