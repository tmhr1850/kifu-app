import { Move } from './shogi';

// 局面分析結果
export interface PositionAnalysis {
  score: number;                    // 評価値（先手有利が正、後手有利が負）
  bestMove: Move | null;            // 最善手
  alternativeMoves: Move[];         // 次善手リスト
  depth: number;                    // 探索深度
  nodesEvaluated: number;          // 評価したノード数
  timestamp: number;                // 分析時刻
  moveNumber: number;               // 手数
}

// 分析設定
export interface AnalysisSettings {
  depth: number;                    // 探索深度 (1-10)
  multiPV: number;                  // 候補手の数 (1-5)
  timeLimit?: number;               // 時間制限（ミリ秒）
  autoAnalyze: boolean;            // 自動分析ON/OFF
}

// 評価値履歴エントリ
export interface EvaluationHistoryEntry {
  moveNumber: number;              // 手数
  score: number;                   // 評価値
  move: Move;                      // 指し手
  fen?: string;                    // 局面のFEN表記
}

// 分析モード
export type AnalysisMode = 'off' | 'analyzing' | 'complete';

// 分析結果キャッシュキー
export type AnalysisCacheKey = string; // 局面のハッシュ値

// 分析結果キャッシュ
export interface AnalysisCache {
  [key: AnalysisCacheKey]: PositionAnalysis;
}

// グラフ表示設定
export interface GraphSettings {
  showGrid: boolean;
  showLabels: boolean;
  zoomEnabled: boolean;
  panEnabled: boolean;
  height: number;
}

// 評価値表示設定
export interface EvaluationDisplaySettings {
  showNumeric: boolean;             // 数値表示
  showBar: boolean;                // バー表示
  showAdvantage: boolean;          // 有利側表示
  precision: number;               // 小数点以下の桁数
}