'use client';

import { Piece as PieceType } from './types';

interface PieceProps {
  piece: PieceType;
}

export default function Piece({ piece }: PieceProps) {
  const isGote = piece.owner === 'gote';
  
  return (
    <div
      className={`
        flex items-center justify-center
        text-lg sm:text-xl md:text-2xl font-bold
        ${isGote ? 'rotate-180' : ''}
        select-none cursor-pointer
        hover:scale-110 transition-transform duration-200
      `}
    >
      <span className="text-amber-900 dark:text-amber-100">
        {piece.type}
      </span>
    </div>
  );
}