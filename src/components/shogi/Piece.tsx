import React from 'react';
import { Piece as PieceType } from '@/types/shogi';

interface PieceProps {
  piece: PieceType;
}

export const Piece: React.FC<PieceProps> = ({ piece }) => {
  const isGote = piece.player === 'gote';
  
  return (
    <div 
      className={`
        w-full h-full flex items-center justify-center
        text-2xl sm:text-3xl lg:text-4xl font-bold
        ${isGote ? 'rotate-180' : ''}
        select-none cursor-pointer
        text-amber-900 hover:text-amber-700
        transition-colors duration-200
      `}
    >
      {piece.type}
    </div>
  );
};