'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { KifuRecord, VariationNode } from '@/types/kifu'
import { Position } from '@/types/shogi'
import Board from '@/components/shogi/Board'
import VariationTree from './VariationTree'
import KifuReplayControls from './KifuReplayControls'
import VariationManagementDialog from './VariationManagementDialog'
import { 
  createNewGameWithKifuVariations,
  loadGameFromKifuWithVariations,
  navigateToVariation,
  deleteVariation,
  renameVariation,
  promoteVariationToMainLine,
  GameStateWithKifu
} from '@/utils/shogi/gameWithKifuVariations'
import { initializeVariations, getMovesAlongPath } from '@/utils/shogi/variations'
import { LiveRegion } from '@/components/LiveRegion'

interface KifuReplayBoardWithVariationsProps {
  kifu: KifuRecord
  className?: string
  allowEditing?: boolean
}

export default function KifuReplayBoardWithVariations({ 
  kifu, 
  className = '',
  allowEditing = true
}: KifuReplayBoardWithVariationsProps) {
  const [gameState, setGameState] = useState<GameStateWithKifu | null>(null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [highlightSquares, setHighlightSquares] = useState<Position[]>([])
  const [liveRegionContent, setLiveRegionContent] = useState('')
  const [showVariationTree, setShowVariationTree] = useState(true)
  const [managingNode, setManagingNode] = useState<VariationNode | null>(null)

  // Initialize game state with variations
  useEffect(() => {
    const enhancedKifu = initializeVariations(kifu)
    if (enhancedKifu.id) {
      const loaded = loadGameFromKifuWithVariations(enhancedKifu.id)
      if (loaded) {
        setGameState(loaded)
        // Set move index based on current path
        if (loaded.kifu.variationTree && loaded.kifu.currentPath) {
          const moves = getMovesAlongPath(loaded.kifu.variationTree, loaded.kifu.currentPath)
          setCurrentMoveIndex(moves.length - 1)
        }
      }
    } else {
      // Create new game state from kifu
      const newGameState = createNewGameWithKifuVariations(kifu.gameInfo)
      // TODO: Rebuild game state from kifu moves
      setGameState(newGameState)
    }
  }, [kifu])

  // Update highlights when move index changes
  useEffect(() => {
    if (!gameState || !gameState.kifu.variationTree || !gameState.kifu.currentPath) return
    
    const moves = getMovesAlongPath(gameState.kifu.variationTree, gameState.kifu.currentPath)
    if (currentMoveIndex >= 0 && currentMoveIndex < moves.length) {
      const move = moves[currentMoveIndex]
      const highlights: Position[] = []
      if (move.from) {
        highlights.push(move.from)
      }
      highlights.push(move.to)
      setHighlightSquares(highlights)
      
      // Announce move for screen readers
      const moveText = `${move.player === 0 ? '先手' : '後手'}が${move.piece}を${move.to.col}${move.to.row + 1}へ${move.promote ? '成る' : ''}`
      setLiveRegionContent(moveText)
    } else {
      setHighlightSquares([])
    }
  }, [currentMoveIndex, gameState])

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!gameState) return
    
    const newState = navigateToVariation(gameState, nodeId)
    if (newState) {
      setGameState(newState)
      // Update current move index
      if (newState.kifu.variationTree && newState.kifu.currentPath) {
        const moves = getMovesAlongPath(newState.kifu.variationTree, newState.kifu.currentPath)
        setCurrentMoveIndex(moves.length - 1)
      }
    }
  }, [gameState])

  const handleDeleteVariation = useCallback((nodeId: string) => {
    if (!gameState || !allowEditing) return
    
    const newState = deleteVariation(gameState, nodeId)
    if (newState) {
      setGameState(newState)
      setLiveRegionContent('変化手順を削除しました')
    }
  }, [gameState, allowEditing])

  const handleMoveIndexChange = useCallback((newIndex: number) => {
    if (!gameState || !gameState.kifu.variationTree || !gameState.kifu.currentPath) return
    
    // Navigate along current path
    const currentPath = gameState.kifu.currentPath
    if (newIndex >= -1 && newIndex < currentPath.length - 1) {
      const targetNodeId = newIndex === -1 ? currentPath[0] : currentPath[newIndex + 1]
      handleNodeClick(targetNodeId)
    }
  }, [gameState, handleNodeClick])

  const handleRenameVariation = useCallback((nodeId: string, name: string) => {
    if (!gameState) return
    
    const newState = renameVariation(gameState, nodeId, name)
    if (newState) {
      setGameState(newState)
      setLiveRegionContent('変化名を更新しました')
    }
  }, [gameState])

  const handlePromoteToMainLine = useCallback((nodeId: string) => {
    if (!gameState) return
    
    const newState = promoteVariationToMainLine(gameState, nodeId)
    if (newState) {
      setGameState(newState)
      setLiveRegionContent('変化を本譜に昇格しました')
    }
  }, [gameState])

  const getSquareHighlight = (row: number, col: number) => {
    const isHighlighted = highlightSquares.some(
      (square) => square.row === row && square.col === col
    )
    
    if (!isHighlighted) return ''
    
    if (gameState && gameState.kifu.variationTree && gameState.kifu.currentPath && currentMoveIndex >= 0) {
      const moves = getMovesAlongPath(gameState.kifu.variationTree, gameState.kifu.currentPath)
      if (currentMoveIndex < moves.length) {
        const move = moves[currentMoveIndex]
        if (move.from && move.from.row === row && move.from.col === col) {
          return 'ring-4 ring-blue-400'
        }
        if (move.to.row === row && move.to.col === col) {
          return 'ring-4 ring-red-400'
        }
      }
    }
    
    return ''
  }

  if (!gameState) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  const moves = gameState.kifu.variationTree && gameState.kifu.currentPath
    ? getMovesAlongPath(gameState.kifu.variationTree, gameState.kifu.currentPath)
    : gameState.kifu.moves

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <LiveRegion content={liveRegionContent} />
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">棋譜再生（変化対応）</h2>
          <button
            onClick={() => setShowVariationTree(!showVariationTree)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showVariationTree ? '変化ツリーを隠す' : '変化ツリーを表示'}
          </button>
        </div>
        {gameState.kifu.gameInfo && (
          <div className="text-sm text-gray-600 mb-2">
            {gameState.kifu.gameInfo.sente && <span>先手: {gameState.kifu.gameInfo.sente}</span>}
            {gameState.kifu.gameInfo.gote && <span className="ml-4">後手: {gameState.kifu.gameInfo.gote}</span>}
            {gameState.kifu.gameInfo.date && <span className="ml-4">{gameState.kifu.gameInfo.date}</span>}
          </div>
        )}
        {!allowEditing && (
          <div className="text-xs text-gray-500">
            閲覧モード - 変化の編集はできません
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Board
            pieces={gameState.game.board}
            nextPlayer={gameState.game.currentPlayer}
            capturedPieces={gameState.game.capturedPieces}
            onSquareClick={() => {}}
            highlightSquares={highlightSquares}
            getSquareHighlight={getSquareHighlight}
            lastMove={currentMoveIndex >= 0 && currentMoveIndex < moves.length ? {
              from: moves[currentMoveIndex].from || { row: -1, col: -1 },
              to: moves[currentMoveIndex].to
            } : undefined}
          />
          
          <KifuReplayControls
            moves={moves}
            currentMoveIndex={currentMoveIndex}
            onMoveIndexChange={handleMoveIndexChange}
          />
        </div>
        
        {showVariationTree && gameState.kifu.variationTree && gameState.kifu.currentPath && (
          <VariationTree
            variationTree={gameState.kifu.variationTree}
            currentPath={gameState.kifu.currentPath}
            onNodeClick={handleNodeClick}
            onDeleteVariation={allowEditing ? handleDeleteVariation : undefined}
            onManageVariation={allowEditing ? setManagingNode : undefined}
            className="h-[600px]"
          />
        )}
      </div>

      {/* Move list with current move info */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-sm mb-2">現在の手順</h3>
        <div className="text-sm text-gray-600">
          {currentMoveIndex >= 0 && currentMoveIndex < moves.length ? (
            <div>
              <span className="font-medium">{currentMoveIndex + 1}手目: </span>
              <span>
                {moves[currentMoveIndex].player === 0 ? '☗' : '☖'}
                {moves[currentMoveIndex].piece}
                {moves[currentMoveIndex].to.col}{moves[currentMoveIndex].to.row + 1}
                {moves[currentMoveIndex].promote && '成'}
              </span>
              {moves[currentMoveIndex].comment && (
                <div className="mt-1 text-gray-500">
                  コメント: {moves[currentMoveIndex].comment}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500">開始局面</span>
          )}
        </div>
      </div>

      {/* Variation Management Dialog */}
      <VariationManagementDialog
        isOpen={!!managingNode}
        onClose={() => setManagingNode(null)}
        node={managingNode}
        onRename={handleRenameVariation}
        onPromoteToMainLine={handlePromoteToMainLine}
        onDelete={(nodeId) => {
          handleDeleteVariation(nodeId)
          setManagingNode(null)
        }}
      />
    </div>
  )
}