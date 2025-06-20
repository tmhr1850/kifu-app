'use client';

import React from 'react'
import { Move, Player } from '@/types/shogi'

interface GameBoardProps {
  onMove?: (move: Move) => void
  orientation?: Player
  disabled?: boolean
  className?: string
}

export default function GameBoard({ 
  onMove, 
  orientation = Player.SENTE, 
  disabled = false,
  className = '' 
}: GameBoardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">対局盤</h3>
      <div className="text-gray-600">
        <p>向き: {orientation === Player.SENTE ? '先手' : '後手'}</p>
        <p>無効: {disabled ? 'はい' : 'いいえ'}</p>
        {onMove && <p>着手機能は開発中です</p>}
      </div>
    </div>
  )
}