'use client';

import React from 'react';
import { GameState } from '@/types/shogi';
import { Piece } from '../shogi/Piece';
import { PieceType as InitialSetupPieceType } from '@/utils/shogi/initialSetup';

interface SimpleBoardProps {
  gameState: GameState;
  highlightedSquares?: Array<{row: number; col: number}>;
  showCoordinates?: boolean;
  flipped?: boolean;
  className?: string;
}

export const SimpleBoard: React.FC<SimpleBoardProps> = ({
  gameState,
  highlightedSquares = [],
  showCoordinates = true,
  flipped = false,
  className = ''
}) => {
  const colNumbers = flipped ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];
  const rowLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  const isHighlighted = (row: number, col: number) => {
    return highlightedSquares.some(sq => sq.row === row && sq.col === col);
  };

  return (
    <div className={`inline-block ${className}`}>
      {showCoordinates && (
        <div className="flex mb-1">
          <div className="w-8" />
          {colNumbers.map(num => (
            <div key={num} className="w-12 h-12 text-center text-sm font-medium">
              {num}
            </div>
          ))}
        </div>
      )}

      <div className="flex">
        {showCoordinates && (
          <div className="flex flex-col mr-1">
            {rowLabels.map((label, index) => (
              <div key={label} className="w-8 h-12 flex items-center justify-center text-sm font-medium">
                {flipped ? rowLabels[8 - index] : label}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-9 gap-0.5 bg-amber-900 p-1">
          {gameState.board.map((row, rowIndex) => 
            row.map((piece, colIndex) => {
              const displayRow = flipped ? 8 - rowIndex : rowIndex;
              const displayCol = flipped ? 8 - colIndex : colIndex;
              const displayPiece = gameState.board[displayRow][displayCol];
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-12 h-12 bg-amber-100 flex items-center justify-center
                    ${isHighlighted(displayRow, displayCol) ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                    transition-all duration-200
                  `}
                >
                  {displayPiece && (
                    <Piece
                      type={displayPiece.type as unknown as InitialSetupPieceType}
                      isGote={displayPiece.player !== 'SENTE'}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};