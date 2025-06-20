'use client';

import React from 'react';
import { Move } from '@/types/shogi';
import { PositionAnalysis } from '@/types/analysis';
import { formatMove } from '@/utils/shogi/moveFormatter';

interface RecommendedMovesProps {
  analysis: PositionAnalysis | null;
  onMoveClick?: (move: Move) => void;
  highlightedMove?: Move | null;
  className?: string;
}

export const RecommendedMoves: React.FC<RecommendedMovesProps> = ({
  analysis,
  onMoveClick,
  highlightedMove,
  className = ''
}) => {
  if (!analysis || !analysis.bestMove) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">推奨手を計算中...</div>
      </div>
    );
  }

  const allMoves = [analysis.bestMove, ...analysis.alternativeMoves];

  const isSameMove = (move1: Move, move2: Move | null | undefined): boolean => {
    if (!move2) return false;
    
    // 持ち駒を打つ手の場合（fromがnull）
    if (move1.from === null && move2.from === null) {
      return move1.to.row === move2.to.row &&
             move1.to.col === move2.to.col &&
             move1.piece.type === move2.piece.type;
    }
    
    // 駒を動かす手の場合
    if (move1.from !== null && move2.from !== null) {
      return move1.from.row === move2.from.row &&
             move1.from.col === move2.from.col &&
             move1.to.row === move2.to.row &&
             move1.to.col === move2.to.col;
    }
    
    return false;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">推奨手</h3>
      
      <div className="space-y-2">
        {allMoves.map((move, index) => (
          <button
            key={index}
            onClick={() => onMoveClick?.(move)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              isSameMove(move, highlightedMove)
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-semibold ${
                  index === 0 ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {index === 0 ? '最善手' : `候補${index}`}
                </span>
                <span className="text-lg font-medium">
                  {formatMove(move)}
                </span>
              </div>
              {index === 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  推奨
                </span>
              )}
            </div>
            
            {/* 簡単な説明（将来的に実装） */}
            {index === 0 && (
              <div className="mt-1 text-xs text-gray-500">
                この手が最も有利な展開につながります
              </div>
            )}
          </button>
        ))}
      </div>

      {allMoves.length === 1 && analysis.alternativeMoves.length === 0 && (
        <div className="mt-3 text-sm text-gray-500 text-center">
          他の候補手を探索中...
        </div>
      )}
    </div>
  );
};