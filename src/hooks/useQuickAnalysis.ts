'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/types/shogi';
import { PositionAnalysis, AnalysisSettings } from '@/types/analysis';
import { AnalysisEngine } from '@/utils/ai/analysisEngine';

interface UseQuickAnalysisReturn {
  analysis: PositionAnalysis | null;
  isAnalyzing: boolean;
  toggleAnalysis: () => void;
}

export function useQuickAnalysis(gameState: GameState | null): UseQuickAnalysisReturn {
  const [analysis, setAnalysis] = useState<PositionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const engineRef = useRef<AnalysisEngine | null>(null);

  // エンジンの初期化
  useEffect(() => {
    engineRef.current = new AnalysisEngine();
    return () => {
      engineRef.current?.cancelAnalysis();
    };
  }, []);

  // 分析実行
  const runAnalysis = useCallback(async () => {
    if (!engineRef.current || !gameState || !enabled) return;

    setIsAnalyzing(true);
    try {
      const settings: AnalysisSettings = {
        depth: 3, // クイック分析は浅め
        multiPV: 1,
        timeLimit: 1000,
        autoAnalyze: false
      };

      const result = await engineRef.current.analyzePosition(gameState, settings);
      setAnalysis(result);
    } catch (error) {
      console.error('Quick analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState, enabled]);

  // 局面が変わったら自動分析
  useEffect(() => {
    if (enabled && gameState) {
      // 少し遅延を入れて連続的な分析を防ぐ
      const timeout = setTimeout(() => {
        runAnalysis();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [gameState, enabled, runAnalysis]);

  // 分析の切り替え
  const toggleAnalysis = useCallback(() => {
    setEnabled(prev => !prev);
    if (!enabled) {
      runAnalysis();
    } else {
      engineRef.current?.cancelAnalysis();
      setAnalysis(null);
    }
  }, [enabled, runAnalysis]);

  return {
    analysis,
    isAnalyzing,
    toggleAnalysis
  };
}