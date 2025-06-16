'use client'

import React from 'react'
import { PieceType } from '@/types/shogi'

interface PieceProps {
  type: PieceType | string
  isGote: boolean
  isOwn?: boolean
  isPromoted?: boolean
  onClick?: () => void
}

const pieceMap: { [key: string]: string } = {
  'FU': '歩',
  'KYO': '香',
  'KEI': '桂',
  'GIN': '銀',
  'KIN': '金',
  'KAKU': '角',
  'HI': '飛',
  'OU': '王',
  'TO': 'と',
  'NKYO': '成香',
  'NKEI': '成桂',
  'NGIN': '成銀',
  'UMA': '馬',
  'RYU': '龍'
}

export const Piece: React.FC<PieceProps> = ({ type, isGote, isOwn, onClick }) => {
  const baseClasses = 'piece text-amber-900 bg-amber-100 rounded px-1 py-0.5 text-sm sm:text-base font-bold select-none transition-all duration-200 cursor-move hover:bg-amber-200 hover:shadow-md'
  const rotationClass = (isGote !== undefined ? isGote : !isOwn) ? 'rotate-180' : ''
  
  const displayChar = typeof type === 'string' && pieceMap[type] ? pieceMap[type] : type

  return (
    <div
      className={`${baseClasses} ${rotationClass}`}
      onClick={onClick}
    >
      {displayChar}
    </div>
  )
}