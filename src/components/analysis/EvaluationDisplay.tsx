'use client';

import React from 'react';
import { PositionAnalysis, EvaluationDisplaySettings } from '@/types/analysis';
import { Player } from '@/types/shogi';

interface EvaluationDisplayProps {
  analysis: PositionAnalysis | null;
  currentPlayer: Player;
  settings?: EvaluationDisplaySettings;
  className?: string;
}

export const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({
  analysis,
  currentPlayer: _currentPlayer,
  settings = {
    showNumeric: true,
    showBar: true,
    showAdvantage: true,
    precision: 1
  },
  className = ''
}) => {
  // currentPlayer may be used in future for player-specific display
  void _currentPlayer;
  if (!analysis) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">分析待機中...</div>
      </div>
    );
  }

  // 評価値を表示用に変換
  const displayScore = analysis.score / 100; // センチポーンから変換
  const isAdvantage = analysis.score > 0;
  const advantagePlayer = isAdvantage ? Player.FIRST : Player.SECOND;
  const absoluteScore = Math.abs(displayScore);

  // バーの位置を計算（-100から+100の範囲で正規化）
  const barPosition = Math.max(-100, Math.min(100, analysis.score / 10));
  const barPercentage = (barPosition + 100) / 2;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">局面評価</h3>
      
      {/* 数値表示 */}
      {settings.showNumeric && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">評価値</span>
            <span className={`text-2xl font-bold ${
              isAdvantage ? 'text-blue-600' : 'text-red-600'
            }`}>
              {isAdvantage ? '+' : '-'}{absoluteScore.toFixed(settings.precision)}
            </span>
          </div>
          {settings.showAdvantage && (
            <div className="text-sm text-gray-500 mt-1">
              {advantagePlayer === Player.FIRST ? '先手' : '後手'}優勢
            </div>
          )}
        </div>
      )}

      {/* 評価バー */}
      {settings.showBar && (
        <div className="mb-3">
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-red-100" />
            <div 
              className="absolute inset-y-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${barPercentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-gray-400" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>先手</span>
            <span>互角</span>
            <span>後手</span>
          </div>
        </div>
      )}

      {/* 探索情報 */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>探索深度</span>
          <span>{analysis.depth}手</span>
        </div>
        <div className="flex justify-between">
          <span>評価局面数</span>
          <span>{analysis.nodesEvaluated.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};