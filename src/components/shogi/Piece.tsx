'use client'

import React from 'react'
import { PieceType } from '@/utils/shogi/initialSetup'

interface PieceProps {
  type: PieceType
  isGote: boolean
  onClick?: () => void
}

export const Piece: React.FC<PieceProps> = ({ type, isGote }) => {
  const baseClasses = 'piece rounded px-1 py-0.5 text-sm sm:text-base font-bold select-none transition-all duration-200 cursor-move hover:shadow-md'
  const rotationClass = isGote ? 'rotate-180' : ''
  
  // 成駒かどうかをチェック
  const isPromoted = type.length === 2 && type.startsWith('成')

  return (
    <div
      className={`${baseClasses} ${rotationClass}`}
      style={{
        backgroundColor: isPromoted ? 'var(--piece-promoted-bg)' : 'var(--piece-bg)',
        color: 'var(--piece-text)',
      }}
    >
      {type}
    </div>
  )
}