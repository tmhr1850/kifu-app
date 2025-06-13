'use client';

import { useState, useEffect } from 'react';
import Square from './Square';
import { Square as SquareType, INITIAL_SETUP, COL_LABELS, ROW_LABELS } from './types';

export default function ShogiBoard() {
  const [squares, setSquares] = useState<SquareType[]>([]);

  useEffect(() => {
    const boardSquares: SquareType[] = [];
    for (let row = 1; row <= 9; row++) {
      for (let col = 1; col <= 9; col++) {
        const key = `${row}-${col}`;
        boardSquares.push({
          position: { row, col },
          piece: INITIAL_SETUP[key]
        });
      }
    }
    setSquares(boardSquares);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 dark:text-amber-100">
        将棋盤
      </h1>
      
      <div className="relative">
        {/* Column labels (top) */}
        <div className="absolute -top-8 left-0 right-0 flex">
          <div className="w-8 sm:w-10 md:w-12" /> {/* Spacer for row labels */}
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className="flex-1 text-center text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-100"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row labels (left) */}
          <div className="flex flex-col pr-2">
            {ROW_LABELS.map((label) => (
              <div
                key={label}
                className="flex-1 flex items-center justify-center text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-100"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Board grid */}
          <div className="grid grid-cols-9 gap-0 border-2 border-amber-900 dark:border-amber-300">
            {squares.map((square) => (
              <div
                key={`${square.position.row}-${square.position.col}`}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
              >
                <Square square={square} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board info */}
      <div className="mt-4 text-center text-sm sm:text-base text-amber-700 dark:text-amber-300">
        <p>☗ 先手（下）・ ☖ 後手（上）</p>
      </div>
    </div>
  );
}