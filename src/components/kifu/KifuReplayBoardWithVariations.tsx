'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { KifuRecord } from '@/types/kifu'
import { Player, Move } from '@/types/shogi'
import { 
  loadGameFromKifuWithVariations,
  makeMoveWithVariations,
  navigateToVariation,
  deleteVariation,
  GameStateWithKifu
} from '@/utils/shogi/gameWithKifuVariations'
import { getMovesAlongPath } from '@/utils/shogi/variations'
import Board from '@/components/shogi/Board'
import DraggableBoard from '@/components/shogi/DraggableBoard'
import KifuReplayControls from './KifuReplayControls'
import VariationTree from './VariationTree'

interface KifuReplayBoardWithVariationsProps {
  kifu: KifuRecord
  className?: string
  allowEditing?: boolean
}

export default function KifuReplayBoardWithVariations({ 
  kifu: initialKifu, 
  className = '',
  allowEditing = true
}: KifuReplayBoardWithVariationsProps) {
  const [gameWithKifu, setGameWithKifu] = useState<GameStateWithKifu | null>(null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [highlightSquares, setHighlightSquares] = useState<{ row: number; col: number }[]>([])
  const [showVariationTree, setShowVariationTree] = useState(true)
  const [isReplaying, setIsReplaying] = useState(true)

  // Initialize game with variation support
  useEffect(() => {
    const game = loadGameFromKifuWithVariations(initialKifu.id)
    if (game) {
      setGameWithKifu(game)
    }
  }, [initialKifu.id])

  // Get current moves based on variation path
  const currentMoves = useMemo(() => {
    if (!gameWithKifu?.kifu.variationTree || !gameWithKifu?.kifu.currentPath) {
      return gameWithKifu?.kifu.moves || []
    }
    
    return getMovesAlongPath(
      gameWithKifu.kifu.variationTree,
      gameWithKifu.kifu.currentPath
    )
  }, [gameWithKifu])

  // Rebuild game state to current move index
  const gameAtMove = useMemo(() => {
    if (!gameWithKifu) return null

    // For replay, we should rebuild the game state properly
    // by replaying moves from the beginning
    if (currentMoveIndex === -1) {
      // Return initial position
      return gameWithKifu.game
    }

    // Get a fresh game state and replay moves
    // This is a simplified version - in production you'd use the actual game engine
    // const moves = currentMoves.slice(0, currentMoveIndex + 1)
    
    // For now, return the current game state
    // In a full implementation, you'd replay the moves properly
    return gameWithKifu.game
  }, [gameWithKifu, currentMoveIndex])

  // Handle move highlighting
  useEffect(() => {
    if (currentMoveIndex >= 0 && currentMoveIndex < currentMoves.length) {
      const move = currentMoves[currentMoveIndex]
      const highlights: { row: number; col: number }[] = []
      
      if (move.from) {
        highlights.push(move.from)
      }
      highlights.push(move.to)
      
      setHighlightSquares(highlights)
    } else {
      setHighlightSquares([])
    }
  }, [currentMoveIndex, currentMoves])

  const getSquareHighlight = useCallback((row: number, col: number) => {
    const isHighlighted = highlightSquares.some(
      (square) => square.row === row && square.col === col
    )
    
    if (!isHighlighted) return ''
    
    if (currentMoveIndex >= 0 && currentMoveIndex < currentMoves.length) {
      const move = currentMoves[currentMoveIndex]
      if (move.from && move.from.row === row && move.from.col === col) {
        return 'ring-4 ring-blue-400'
      }
      if (move.to.row === row && move.to.col === col) {
        return 'ring-4 ring-red-400'
      }
    }
    
    return ''
  }, [highlightSquares, currentMoveIndex, currentMoves])

  // Handle making a new move (creates variation if needed)
  const handleMove = useCallback((move: Move) => {
    if (!gameWithKifu || !allowEditing || !isReplaying) return

    // Make the move with variation support
    const newGameState = makeMoveWithVariations(gameWithKifu, move)
    if (newGameState) {
      setGameWithKifu(newGameState)
      // Move to the new position
      setCurrentMoveIndex(currentMoves.length)
      setIsReplaying(false)
    }
  }, [gameWithKifu, allowEditing, isReplaying, currentMoves.length])

  // Handle variation tree navigation
  const handleNodeClick = useCallback((nodeId: string) => {
    if (!gameWithKifu) return

    const newGameState = navigateToVariation(gameWithKifu, nodeId)
    if (newGameState) {
      setGameWithKifu(newGameState)
      
      // Find the move index for this node
      if (newGameState.kifu.variationTree && newGameState.kifu.currentPath) {
        const nodeIndex = newGameState.kifu.currentPath.indexOf(nodeId)
        if (nodeIndex > 0) {
          setCurrentMoveIndex(nodeIndex - 1) // -1 because root has no move
        } else {
          setCurrentMoveIndex(-1)
        }
      }
    }
  }, [gameWithKifu])

  // Handle variation deletion
  const handleDeleteVariation = useCallback((nodeId: string) => {
    if (!gameWithKifu) return

    const newGameState = deleteVariation(gameWithKifu, nodeId)
    if (newGameState) {
      setGameWithKifu(newGameState)
    }
  }, [gameWithKifu])

  if (!gameWithKifu || !gameAtMove) {
    return <div>Loading...</div>
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">棋譜再生</h2>
            {gameWithKifu.kifu.gameInfo && (
              <div className="text-sm text-gray-600 mb-2">
                {gameWithKifu.kifu.gameInfo.sente && <span>先手: {gameWithKifu.kifu.gameInfo.sente}</span>}
                {gameWithKifu.kifu.gameInfo.gote && <span className="ml-4">後手: {gameWithKifu.kifu.gameInfo.gote}</span>}
                {gameWithKifu.kifu.gameInfo.date && <span className="ml-4">{gameWithKifu.kifu.gameInfo.date}</span>}
              </div>
            )}
          </div>
          
          {gameWithKifu.kifu.variationTree && (
            <button
              onClick={() => setShowVariationTree(!showVariationTree)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {showVariationTree ? '変化を隠す' : '変化を表示'}
            </button>
          )}
        </div>

        {allowEditing && (
          <div className="mt-2 text-sm text-gray-500">
            {isReplaying ? '盤面をクリックして別の手を指すと変化を作成できます' : '編集モード中'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {allowEditing && !isReplaying ? (
            <DraggableBoard
              gameState={gameAtMove}
              onMove={handleMove}
              disabled={false}
              isFlipped={gameAtMove.currentPlayer === Player.GOTE}
              getSquareHighlight={getSquareHighlight}
            />
          ) : (
            <Board
              board={gameAtMove.board}
              getSquareHighlight={getSquareHighlight}
              isFlipped={gameAtMove.currentPlayer === Player.GOTE}
              senteCaptures={gameAtMove.handPieces[Player.SENTE]}
              goteCaptures={gameAtMove.handPieces[Player.GOTE]}
            />
          )}

          <KifuReplayControls
            moves={currentMoves}
            currentMoveIndex={currentMoveIndex}
            onMoveIndexChange={(index) => {
              setCurrentMoveIndex(index)
              setIsReplaying(true)
            }}
          />
        </div>

        {showVariationTree && gameWithKifu.kifu.variationTree && gameWithKifu.kifu.currentPath && (
          <div className="lg:col-span-1">
            <VariationTree
              variationTree={gameWithKifu.kifu.variationTree}
              currentPath={gameWithKifu.kifu.currentPath}
              onNodeClick={handleNodeClick}
              onDeleteVariation={allowEditing ? handleDeleteVariation : undefined}
              className="h-96"
            />
          </div>
        )}
      </div>
    </div>
  )
}