import { GameState, Move } from '@/types/shogi';

// AI難易度設定
export enum AIDifficulty {
  BEGINNER = 'BEGINNER',     // 初級: 浅い探索、ランダム性あり
  INTERMEDIATE = 'INTERMEDIATE', // 中級: 中程度の探索
  ADVANCED = 'ADVANCED'      // 上級: 深い探索
}

// AI思考時間設定
export interface AITimeSettings {
  mode: 'fixed' | 'variable' | 'instant';
  fixedTime?: number;        // 固定時間（ミリ秒）
  minTime?: number;          // 最小思考時間
  maxTime?: number;          // 最大思考時間
}

// AI設定
export interface AISettings {
  difficulty: AIDifficulty;
  timeSettings: AITimeSettings;
  randomness: number;        // 0-1の範囲でランダム性の強さ
}

// 評価値
export interface EvaluationResult {
  score: number;            // 評価値（先手有利が正、後手有利が負）
  bestMove: Move | null;    // 最善手
  depth: number;            // 探索深度
  nodesEvaluated: number;   // 評価したノード数
}

// AIエンジンインターフェース
export interface AIEngine {
  evaluate(gameState: GameState, settings: AISettings): Promise<EvaluationResult>;
  cancelEvaluation(): void;
}

// Web Workerメッセージ
export interface AIWorkerMessage {
  type: 'EVALUATE' | 'CANCEL' | 'RESULT' | 'PROGRESS';
  gameState?: GameState;
  settings?: AISettings;
  result?: EvaluationResult;
  progress?: number;
}

// 難易度ごとの設定
export const DIFFICULTY_SETTINGS = {
  [AIDifficulty.BEGINNER]: {
    searchDepth: 2,
    randomness: 0.3,
    timeLimit: 1000
  },
  [AIDifficulty.INTERMEDIATE]: {
    searchDepth: 4,
    randomness: 0.1,
    timeLimit: 3000
  },
  [AIDifficulty.ADVANCED]: {
    searchDepth: 6,
    randomness: 0.05,
    timeLimit: 5000
  }
};