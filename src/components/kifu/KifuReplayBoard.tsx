'use client'

import { useState } from 'react'
import { KifuRecord } from '@/types/kifu'
import KifuReplayControls from './KifuReplayControls'

interface KifuReplayBoardProps {
  kifu: KifuRecord
  className?: string
}

export default function KifuReplayBoard({ kifu, className = '' }: KifuReplayBoardProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)

  // const getSquareHighlight = (row: number, col: number) => {
  //   const isHighlighted = highlightSquares.some(
  //     (square) => square.row === row && square.col === col
  //   )
  //   
  //   if (!isHighlighted) return ''
  //   
  //   if (currentMoveIndex >= 0 && currentMoveIndex < kifu.moves.length) {
  //     const move = kifu.moves[currentMoveIndex]
  //     if (move.from && move.from.row === row && move.from.col === col) {
  //       return 'ring-4 ring-blue-400'
  //     }
  //     if (move.to.row === row && move.to.col === col) {
  //       return 'ring-4 ring-red-400'
  //     }
  //   }
  //   
  //   return ''
  // }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-2">棋譜再生</h2>
        {kifu.gameInfo && (
          <div className="text-sm text-gray-600 mb-2">
            {kifu.gameInfo.sente && <span>先手: {kifu.gameInfo.sente}</span>}
            {kifu.gameInfo.gote && <span className="ml-4">後手: {kifu.gameInfo.gote}</span>}
            {kifu.gameInfo.date && <span className="ml-4">{kifu.gameInfo.date}</span>}
          </div>
        )}
      </div>

      {/* TODO: Fix type incompatibility between PieceType and BoardPiece */}
      <div className="bg-yellow-100 p-4 rounded">
        <p>棋譜表示コンポーネントは現在開発中です</p>
        <p>手数: {currentMoveIndex + 1} / {kifu.moves.length}</p>
      </div>

      <KifuReplayControls
        moves={kifu.moves}
        currentMoveIndex={currentMoveIndex}
        onMoveIndexChange={setCurrentMoveIndex}
      />
    </div>
  )
}