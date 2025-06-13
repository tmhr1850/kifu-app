'use client'

import React from 'react'
import { PieceType } from '@/utils/shogi/initialSetup'

interface PieceProps {
  type: PieceType
  isGote: boolean
  onClick?: () => void
}

export const Piece: React.FC<PieceProps> = ({ type, isGote, onClick }) => {
  const baseClasses = 'piece text-amber-900 bg-amber-100 rounded px-1 py-0.5 text-sm sm:text-base font-bold select-none transition-all duration-200'
  const rotationClass = isGote ? 'rotate-180' : ''
  const interactionClasses = onClick 
    ? 'cursor-pointer hover:bg-amber-200 hover:shadow-md' 
    : ''

  return (
    <div
      className={`${baseClasses} ${rotationClass} ${interactionClasses}`}
      onClick={onClick}
    >
      {type}
    </div>
  )
}