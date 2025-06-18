'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/types/shogi';
import {
  PositionAnalysis,
  AnalysisSettings,
  AnalysisMode,
  EvaluationHistoryEntry
} from '@/types/analysis';
import { AnalysisEngine } from '@/utils/ai/analysisEngine';

interface UseAnalysisReturn {
  currentAnalysis: PositionAnalysis | null;
  evaluationHistory: EvaluationHistoryEntry[];
  analysisCache: Map<number, PositionAnalysis>;
  mode: AnalysisMode;
  settings: AnalysisSettings;
  isAnalyzing: boolean;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  analyzePosition: (gameState: GameState) => Promise<void>;
  updateSettings: (newSettings: AnalysisSettings) => void;
  clearHistory: () => void;
}

export function useAnalysis(
  currentGameState: GameState | null,
  currentMoveNumber: number
): UseAnalysisReturn {
  const [currentAnalysis, setCurrentAnalysis] = useState<PositionAnalysis | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationHistoryEntry[]>([]);
  const [analysisCache, setAnalysisCache] = useState<Map<number, PositionAnalysis>>(new Map());
  const [mode, setMode] = useState<AnalysisMode>('off');
  const [settings, setSettings] = useState<AnalysisSettings>({
    depth: 5,
    multiPV: 3,
    timeLimit: 3000,
    autoAnalyze: false
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const engineRef = useRef<AnalysisEngine | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // エンジンの初期化
  useEffect(() => {
    engineRef.current = new AnalysisEngine();
    return () => {
      engineRef.current?.cancelAnalysis();
    };
  }, []);

  // 局面分析
  const analyzePosition = useCallback(async (gameState: GameState) => {
    if (!engineRef.current || !gameState) return;

    setIsAnalyzing(true);
    try {
      const analysis = await engineRef.current.analyzePosition(gameState, settings);
      setCurrentAnalysis(analysis);

      // キャッシュに追加
      const moveNumber = gameState.moveHistory.length;
      setAnalysisCache(prev => {
        const newCache = new Map(prev);
        newCache.set(moveNumber, analysis);
        return newCache;
      });

      // 履歴に追加
      if (analysis.bestMove) {
        const historyEntry: EvaluationHistoryEntry = {
          moveNumber: moveNumber,
          score: analysis.score,
          move: analysis.bestMove
        };

        setEvaluationHistory(prev => {
          // 同じ手数のエントリーを更新
          const existingIndex = prev.findIndex(e => e.moveNumber === historyEntry.moveNumber);
          if (existingIndex >= 0) {
            const newHistory = [...prev];
            newHistory[existingIndex] = historyEntry;
            return newHistory;
          }
          return [...prev, historyEntry].sort((a, b) => a.moveNumber - b.moveNumber);
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [settings]);

  // 分析開始
  const startAnalysis = useCallback(() => {
    setMode('analyzing');
    if (currentGameState) {
      analyzePosition(currentGameState);
    }
  }, [currentGameState, analyzePosition]);

  // 分析停止
  const stopAnalysis = useCallback(() => {
    setMode('off');
    engineRef.current?.cancelAnalysis();
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    setIsAnalyzing(false);
  }, []);

  // 設定更新
  const updateSettings = useCallback((newSettings: AnalysisSettings) => {
    setSettings(newSettings);
    // キャッシュをクリア
    engineRef.current?.clearCache();
  }, []);

  // 履歴クリア
  const clearHistory = useCallback(() => {
    setEvaluationHistory([]);
    setCurrentAnalysis(null);
    setAnalysisCache(new Map());
    engineRef.current?.clearCache();
  }, []);

  // 自動分析
  useEffect(() => {
    if (mode === 'analyzing' && settings.autoAnalyze && currentGameState && !isAnalyzing) {
      // 少し遅延を入れて連続的な分析を防ぐ
      analysisTimeoutRef.current = setTimeout(() => {
        analyzePosition(currentGameState);
      }, 500);
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [mode, settings.autoAnalyze, currentGameState, currentMoveNumber, analyzePosition, isAnalyzing]);

  return {
    currentAnalysis,
    evaluationHistory,
    analysisCache,
    mode,
    settings,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    analyzePosition,
    updateSettings: updateSettings,
    clearHistory
  };
}