'use client';

import React from 'react';
import { PositionAnalysis } from '@/types/analysis';
import { formatMove } from '@/utils/shogi/moveFormatter';

interface QuickAnalysisPanelProps {
  analysis: PositionAnalysis | null;
  isAnalyzing: boolean;
  onToggleAnalysis: () => void;
  className?: string;
}

export const QuickAnalysisPanel: React.FC<QuickAnalysisPanelProps> = ({
  analysis,
  isAnalyzing,
  onToggleAnalysis,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">クイック分析</h3>
        <button
          onClick={onToggleAnalysis}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isAnalyzing
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isAnalyzing ? '停止' : '開始'}
        </button>
      </div>

      {isAnalyzing && !analysis && (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-600">分析中...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* 評価値 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">評価値</span>
            <span className={`text-xl font-bold ${
              analysis.score >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {analysis.score >= 0 ? '+' : ''}{(analysis.score / 100).toFixed(1)}
            </span>
          </div>

          {/* 評価バー */}
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ 
                width: `${Math.max(0, Math.min(100, (analysis.score / 2000 + 0.5) * 100))}%` 
              }}
            />
          </div>

          {/* 最善手 */}
          {analysis.bestMove && (
            <div>
              <p className="text-sm text-gray-600 mb-1">推奨手</p>
              <div className="bg-blue-50 px-3 py-2 rounded text-sm font-medium text-blue-800">
                {formatMove(analysis.bestMove)}
              </div>
            </div>
          )}

          {/* 探索情報 */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex justify-between">
              <span>深度</span>
              <span>{analysis.depth}手</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};