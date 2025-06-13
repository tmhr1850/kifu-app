'use client'

import React from 'react'
import { PieceType } from '@/utils/shogi/initialSetup'

interface PieceProps {
  type: PieceType
  isGote: boolean
  onClick?: () => void
}

export const Piece: React.FC<PieceProps> = ({ type, isGote }) => {
  const baseClasses = 'piece text-amber-900 bg-amber-100 rounded px-1 py-0.5 text-sm sm:text-base font-bold select-none transition-all duration-200 cursor-move hover:bg-amber-200 hover:shadow-md'
  const rotationClass = isGote ? 'rotate-180' : ''

  return (
    <div
      className={`${baseClasses} ${rotationClass}`}
    >
      {type}
    </div>
  )
}