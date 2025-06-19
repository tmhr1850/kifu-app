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
  // 段と筋を日本語表記に変換
  const rowKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const colNumber = col !== undefined ? 9 - col : undefined;
  
  // ARIA label を生成
  const getAriaLabel = () => {
    if (row === undefined || col === undefined) return undefined;
    
    const position = `${colNumber}${rowKanji[row]}`;
    const pieceInfo = square.piece 
      ? `${square.piece.isGote ? '後手' : '先手'}の${square.piece.type}`
      : '空のマス';
    
    return `${position}、${pieceInfo}`;
  };
  
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
      role="gridcell"
      aria-label={getAriaLabel()}
      tabIndex={-1}
    >
      {square.piece && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Piece piece={square.piece} />
        </div>
      )}
    </div>
  );
}