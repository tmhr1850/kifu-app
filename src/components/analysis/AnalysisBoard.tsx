'use client';

import React, { useState, useCallback } from 'react';
import { GameState, Move } from '@/types/shogi';
import { SimpleBoard } from './SimpleBoard';
import { EvaluationDisplay } from './EvaluationDisplay';
import { RecommendedMoves } from './RecommendedMoves';
import { EvaluationGraph } from './EvaluationGraph';
import { AnalysisModePanel } from './AnalysisModePanel';
import { AnalysisExportDialog } from './AnalysisExportDialog';
import { useAnalysis } from '@/hooks/useAnalysis';

interface AnalysisBoardProps {
  gameState: GameState;
  currentMoveNumber: number;
  onMoveSelect?: (move: Move) => void;
  onMoveNumberChange?: (moveNumber: number) => void;
  className?: string;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  gameState,
  currentMoveNumber,
  onMoveSelect,
  onMoveNumberChange,
  className = ''
}) => {
  const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Array<{row: number; col: number}>>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const {
    currentAnalysis,
    evaluationHistory,
    analysisCache,
    mode,
    settings,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    updateSettings
  } = useAnalysis(gameState, currentMoveNumber);

  // 推奨手をクリックしたとき
  const handleMoveClick = useCallback((move: Move) => {
    setHighlightedMove(move);
    // 移動元と移動先をハイライト
    setHighlightedSquares([move.from, move.to]);
    onMoveSelect?.(move);
  }, [onMoveSelect]);

  // モード変更
  const handleModeChange = useCallback((newMode: 'off' | 'analyzing' | 'complete') => {
    if (newMode === 'analyzing') {
      startAnalysis();
    } else if (newMode === 'off') {
      stopAnalysis();
    }
  }, [startAnalysis, stopAnalysis]);

  // グラフから手数を選択
  const handleGraphMoveClick = useCallback((moveNumber: number) => {
    onMoveNumberChange?.(moveNumber);
  }, [onMoveNumberChange]);

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：盤面 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">局面分析</h2>
              <button
                onClick={() => setShowExportDialog(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                disabled={evaluationHistory.length === 0}
              >
                分析結果をエクスポート
              </button>
            </div>
            <SimpleBoard
              gameState={gameState}
              highlightedSquares={highlightedSquares}
              showCoordinates={true}
              flipped={false}
              className="mx-auto"
            />
          </div>

          {/* 形勢グラフ */}
          <div className="mt-6">
            <EvaluationGraph
              history={evaluationHistory}
              currentMove={currentMoveNumber}
              onMoveClick={handleGraphMoveClick}
              settings={{
                height: 250,
                showGrid: true,
                showLabels: true
              }}
            />
          </div>
        </div>

        {/* 右側：分析パネル */}
        <div className="space-y-6">
          {/* 分析設定 */}
          <AnalysisModePanel
            mode={mode}
            settings={settings}
            onModeChange={handleModeChange}
            onSettingsChange={updateSettings}
            isAnalyzing={isAnalyzing}
          />

          {/* 評価値表示 */}
          <EvaluationDisplay
            analysis={currentAnalysis}
            currentPlayer={gameState.currentPlayer}
            settings={{
              showNumeric: true,
              showBar: true,
              showAdvantage: true,
              precision: 1
            }}
          />

          {/* 推奨手 */}
          <RecommendedMoves
            analysis={currentAnalysis}
            onMoveClick={handleMoveClick}
            highlightedMove={highlightedMove}
          />
        </div>
      </div>

      {/* エクスポートダイアログ */}
      <AnalysisExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        evaluationHistory={evaluationHistory}
        analyses={analysisCache}
        metadata={{
          analysisSettings: settings
        }}
      />
    </div>
  );
};