'use client';

import { Square as SquareType } from './types';
import Piece from './Piece';

interface SquareProps {
  square: SquareType;
  isHighlighted?: boolean;
  row?: number;
  col?: number;
}

export default function Square({ square, isHighlighted = false, row, col }: SquareProps) {
  return (
    <div
      className={`
        aspect-square
        bg-amber-100 dark:bg-amber-950
        border border-amber-800 dark:border-amber-300
        relative
        ${isHighlighted ? 'bg-amber-300 dark:bg-amber-700' : ''}
        hover:bg-amber-200 dark:hover:bg-amber-800
        transition-colors duration-200
      `}
      data-testid={row !== undefined && col !== undefined ? `square-${row}-${col}` : undefined}
    >
      {square.piece && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Piece piece={square.piece} />
        </div>
      )}
    </div>
  );
}