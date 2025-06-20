'use client'

import React from 'react'
import { GameState, Move, Player } from '@/types/shogi'

interface AIGameBoardProps {
  gameState: GameState
  onMove: (move: Move) => boolean
  playerColor: Player
  disabled?: boolean
}

export default function AIGameBoard({ 
  gameState, 
  playerColor,
  disabled = false 
}: Omit<AIGameBoardProps, 'onMove'>) {
  return (
    <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">AI対局盤</h3>
        <div className="text-gray-600">
          <p>現在のプレイヤー: {gameState.currentPlayer === Player.SENTE ? '先手' : '後手'}</p>
          <p>あなたの色: {playerColor === Player.SENTE ? '先手' : '後手'}</p>
          <p>着手機能は開発中です</p>
        </div>
      </div>
    </div>
  )
}