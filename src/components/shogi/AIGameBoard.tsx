'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { GameState, Move, Player, Position, PieceType, Piece as PieceData } from '@/types/shogi'
import { DraggableBoard } from './DraggableBoard'
import { getPieceAt } from '@/utils/shogi/board'
import { Piece } from './Piece'
import { isValidDrop } from '@/utils/shogi/validators'
import { BoardPiece, PieceType as DisplayPieceType } from '@/utils/shogi/initialSetup'

// PieceType (enum) を表示用の文字列に変換
const pieceTypeToDisplay: Record<PieceType, DisplayPieceType> = {
  [PieceType.OU]: '王',
  [PieceType.HI]: '飛',
  [PieceType.KAKU]: '角',
  [PieceType.KIN]: '金',
  [PieceType.GIN]: '銀',
  [PieceType.KEI]: '桂',
  [PieceType.KYO]: '香',
  [PieceType.FU]: '歩',
  [PieceType.RYU]: '竜',
  [PieceType.UMA]: '馬',
  [PieceType.NGIN]: '全',
  [PieceType.NKEI]: '圭',
  [PieceType.NKYO]: '杏',
  [PieceType.TO]: 'と',
}

// 駒打ちに対応した拡張ボード
interface ExtendedBoardProps {
  board: (BoardPiece | null)[][]
  onMove: (from: Position, to: Position) => void
  lastMove?: { from: Position; to: Position } | null
  validDropPositions: Position[]
  onSquareClick: (row: number, col: number) => void
  selectedHandPiece: PieceType | null
}

const ExtendedBoard: React.FC<ExtendedBoardProps> = ({
  board,
  onMove,
  lastMove,
  validDropPositions,
  onSquareClick,
  selectedHandPiece
}) => {
  // 駒打ち可能な位置かチェック
  const isDropTarget = (row: number, col: number) => {
    return validDropPositions.some(pos => pos.row === row && pos.col === col)
  }

  // DraggableBoardをラップして、駒打ちの視覚的フィードバックを追加
  return (
    <div className="relative">
      <DraggableBoard
        board={board}
        onMove={onMove}
        lastMove={lastMove}
      />
      {selectedHandPiece && (
        <div className="absolute inset-0 grid grid-cols-9 gap-0.5 p-1 pointer-events-none"
          style={{ marginTop: '32px', marginLeft: '32px', marginRight: '0', marginBottom: '0' }}>
          {board.map((row, rowIndex) => 
            row.map((_, colIndex) => {
              const actualCol = 8 - colIndex
              const isTarget = isDropTarget(rowIndex, actualCol)
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`aspect-square ${isTarget ? 'pointer-events-auto cursor-pointer' : ''}`}
                  onClick={() => isTarget && onSquareClick(rowIndex, actualCol)}
                >
                  {isTarget && (
                    <div className="w-full h-full bg-green-300 opacity-50 hover:opacity-70 transition-opacity" />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

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
  // 盤面を反転するかどうか（後手の場合は反転）
  const isFlipped = playerColor === Player.GOTE
  const [selectedHandPiece, setSelectedHandPiece] = useState<PieceType | null>(null)
  const [validDropPositions, setValidDropPositions] = useState<Position[]>([])

  // 盤面の向きを調整 & PieceData を BoardPiece に変換
  const displayBoard = useMemo(() => {
    // PieceData を BoardPiece に変換
    const convertedBoard = gameState.board.map(row => 
      row.map(piece => {
        if (!piece) return null
        return {
          type: pieceTypeToDisplay[piece.type],
          isGote: piece.player === Player.GOTE,
          promoted: piece.promoted
        } as BoardPiece
      })
    )
    
    if (!isFlipped) return convertedBoard
    
    // 後手の場合は盤面を180度回転
    return convertedBoard.slice().reverse().map(row => 
      row.slice().reverse()
    )
  }, [gameState.board, isFlipped])

  // 座標を変換（表示用の座標から実際の座標へ）
  const convertPosition = useCallback((pos: Position): Position => {
    if (!isFlipped) return pos
    return {
      row: 8 - pos.row,
      col: 8 - pos.col
    }
  }, [isFlipped])

  // 持ち駒を選択
  const handleSelectHandPiece = useCallback((pieceType: PieceType) => {
    if (disabled || gameState.currentPlayer !== playerColor) return
    
    if (selectedHandPiece === pieceType) {
      // 同じ駒をクリックしたら選択解除
      setSelectedHandPiece(null)
      setValidDropPositions([])
    } else {
      // 新しい駒を選択
      setSelectedHandPiece(pieceType)
      // 駒を打てる位置を計算
      const dropPositions: Position[] = []
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const pos = { row, col }
          if (isValidDrop(gameState.board, gameState.handPieces, pos, pieceType, playerColor)) {
            dropPositions.push(pos)
          }
        }
      }
      // 表示用に座標を変換
      const displayPositions = dropPositions.map(pos => 
        isFlipped ? { row: 8 - pos.row, col: 8 - pos.col } : pos
      )
      setValidDropPositions(displayPositions)
    }
  }, [disabled, gameState, playerColor, selectedHandPiece, isFlipped])

  // 盤面のマスをクリック
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!selectedHandPiece) return
    
    // 表示座標から実際の座標に変換
    const actualPos = convertPosition({ row, col })
    
    // 駒打ちの Move オブジェクトを作成
    const move: Move = {
      from: null,
      to: actualPos,
      piece: {
        type: selectedHandPiece,
        player: playerColor
      }
    }
    
    // 移動を実行
    const success = onMove(move)
    if (success) {
      setSelectedHandPiece(null)
      setValidDropPositions([])
    }
  }, [selectedHandPiece, playerColor, onMove, convertPosition])

  // DraggableBoardのonMoveハンドラ
  const handleMove = useCallback((from: Position, to: Position) => {
    // 表示座標から実際の座標に変換
    const actualFrom = convertPosition(from)
    const actualTo = convertPosition(to)
    
    // 移動する駒を取得
    const piece = getPieceAt(gameState.board, actualFrom)
    if (!piece) return

    // 取られる駒を取得
    const captured = getPieceAt(gameState.board, actualTo)

    // Move オブジェクトを作成
    const move: Move = {
      from: actualFrom,
      to: actualTo,
      piece: piece,
      captured: captured || undefined
    }

    // 移動を実行
    onMove(move)
  }, [gameState.board, onMove, convertPosition])

  // 最後の手を表示用に変換
  const lastMove = useMemo(() => {
    if (!gameState.moveHistory || gameState.moveHistory.length === 0) return null
    
    const lastHistoryMove = gameState.moveHistory[gameState.moveHistory.length - 1]
    if (!lastHistoryMove.from) return null // 駒打ちの場合

    // 実際の座標から表示座標に変換
    const displayFrom = isFlipped 
      ? { row: 8 - lastHistoryMove.from.row, col: 8 - lastHistoryMove.from.col }
      : lastHistoryMove.from
    const displayTo = isFlipped
      ? { row: 8 - lastHistoryMove.to.row, col: 8 - lastHistoryMove.to.col }
      : lastHistoryMove.to

    return { from: displayFrom, to: displayTo }
  }, [gameState.moveHistory, isFlipped])

  // 持ち駒を表示
  const renderHandPieces = (player: Player) => {
    const handPieces = gameState.handPieces[player]
    const pieceOrder: PieceType[] = [
      PieceType.HI, PieceType.KAKU, PieceType.KIN, 
      PieceType.GIN, PieceType.KEI, PieceType.KYO, PieceType.FU
    ]
    const isMyHand = player === playerColor

    return (
      <div className="flex flex-wrap gap-2">
        {pieceOrder.map(pieceType => {
          const count = handPieces.get(pieceType) || 0
          if (count === 0) return null
          const isSelected = isMyHand && selectedHandPiece === pieceType

          return (
            <div 
              key={pieceType} 
              className={`relative cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-yellow-500 scale-110' : ''
              } ${
                isMyHand && !disabled && gameState.currentPlayer === playerColor ? 'hover:scale-105' : ''
              }`}
              onClick={() => isMyHand && handleSelectHandPiece(pieceType)}
            >
              <Piece
                type={pieceTypeToDisplay[pieceType]}
                isGote={player === Player.GOTE}
              />
              {count > 1 && (
                <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
    <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex flex-col gap-4">
        {/* 相手の持ち駒（上側） */}
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">
            {playerColor === Player.SENTE ? '後手' : '先手'}の持ち駒
          </div>
          {renderHandPieces(playerColor === Player.SENTE ? Player.GOTE : Player.SENTE)}
        </div>

        {/* 将棋盤 */}
        <div className={disabled ? 'pointer-events-none' : ''}>
          <ExtendedBoard
            board={displayBoard}
            onMove={handleMove}
            lastMove={lastMove}
            validDropPositions={validDropPositions}
            onSquareClick={handleSquareClick}
            selectedHandPiece={selectedHandPiece}
          />
        </div>

        {/* 自分の持ち駒（下側） */}
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">
            {playerColor === Player.SENTE ? '先手' : '後手'}の持ち駒
          </div>
          {renderHandPieces(playerColor)}
        </div>
      </div>
    </div>
  )
}