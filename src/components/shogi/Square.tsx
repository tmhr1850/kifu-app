'use client';

import { Square as SquareType } from './types';
import Piece from './Piece';
import { getSquareAriaLabel } from '@/utils/accessibility';

interface SquareProps {
  square: SquareType;
  isHighlighted?: boolean;
  row?: number;
  col?: number;
  onFocus?: () => void;
  isFocused?: boolean;
}

export default function Square({ square, isHighlighted = false, row, col, onFocus, isFocused = false }: SquareProps) {
  const ariaLabel = row !== undefined && col !== undefined 
    ? getSquareAriaLabel(col, row, square.piece)
    : undefined;

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
        ${isFocused ? 'ring-2 ring-blue-500 ring-inset' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
      `}
      data-testid={row !== undefined && col !== undefined ? `square-${row}-${col}` : undefined}
      role="gridcell"
      aria-label={ariaLabel}
      tabIndex={isFocused ? 0 : -1}
      onFocus={onFocus}
    >
      {square.piece && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Piece piece={square.piece} />
        </div>
      )}
    </div>
  );
}