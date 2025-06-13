'use client';

import React, { useState } from 'react';
import { Board as BoardType, INITIAL_BOARD, COLUMN_LABELS, ROW_LABELS } from '@/types/shogi';
import { Piece } from './Piece';

export const Board: React.FC = () => {
  const [board] = useState<BoardType>(INITIAL_BOARD);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative bg-amber-50 rounded-lg shadow-2xl p-2 sm:p-4">
        <div className="grid grid-cols-[auto_1fr] gap-1 sm:gap-2">
          <div className="w-6 sm:w-8"></div>
          <div className="grid grid-cols-9 gap-0">
            {COLUMN_LABELS.map((label, index) => (
              <div 
                key={`col-${index}`} 
                className="text-center text-sm sm:text-base lg:text-lg font-semibold text-amber-800"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-rows-9 gap-0">
            {ROW_LABELS.map((label, index) => (
              <div 
                key={`row-${index}`} 
                className="flex items-center justify-center text-sm sm:text-base lg:text-lg font-semibold text-amber-800 h-10 sm:h-12 lg:h-16"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-9 grid-rows-9 gap-0 border-2 border-amber-900">
            {board.flatMap((row, rowIndex) =>
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    relative border border-amber-700
                    h-10 sm:h-12 lg:h-16 w-10 sm:w-12 lg:w-16
                    bg-amber-100 hover:bg-amber-200
                    transition-colors duration-200
                    flex items-center justify-center
                  `}
                >
                  {piece && <Piece piece={piece} />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};