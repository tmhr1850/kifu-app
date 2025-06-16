import { GameState, Move, Player } from '@/types/shogi';
import { getAllValidMoves } from '@/utils/shogi/validators';
import { makeMove, getGameStatus } from '@/utils/shogi/game';
import { evaluatePosition } from './evaluation';
import { EvaluationResult, AISettings, DIFFICULTY_SETTINGS } from './types';

// 探索のキャンセルフラグ
let cancelFlag = false;
let nodesEvaluated = 0;
let startTime = 0;
let timeLimit = 0;

// 探索をキャンセル
export function cancelSearch(): void {
  cancelFlag = true;
}

// ミニマックス法with アルファベータ枝刈り
export async function minimax(
  gameState: GameState,
  settings: AISettings
): Promise<EvaluationResult> {
  // 初期化
  cancelFlag = false;
  nodesEvaluated = 0;
  startTime = Date.now();
  
  // 難易度に応じた設定を取得
  const difficultySettings = DIFFICULTY_SETTINGS[settings.difficulty];
  const maxDepth = difficultySettings.searchDepth;
  timeLimit = settings.timeSettings.mode === 'instant' 
    ? 100 
    : settings.timeSettings.fixedTime || difficultySettings.timeLimit;

  // 全ての合法手を取得
  const moves = await getAllValidMoves(gameState);
  
  if (moves.length === 0) {
    return {
      score: 0,
      bestMove: null,
      depth: 0,
      nodesEvaluated: 0
    };
  }

  // ランダム性を適用（初級向け）
  if (settings.randomness > 0 && Math.random() < settings.randomness) {
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      score: 0,
      bestMove: randomMove,
      depth: 1,
      nodesEvaluated: moves.length
    };
  }

  let bestMove: Move | null = null;
  let bestScore = gameState.currentPlayer === Player.SENTE ? -Infinity : Infinity;
  const alpha = -Infinity;
  const beta = Infinity;

  // 各手を評価
  for (const move of moves) {
    if (cancelFlag || Date.now() - startTime > timeLimit) break;

    const newState = makeMove(gameState, move);
    if (!newState) continue;

    const score = await alphabeta(
      newState,
      maxDepth - 1,
      alpha,
      beta,
      gameState.currentPlayer === Player.SENTE ? false : true
    );

    if (gameState.currentPlayer === Player.SENTE) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  // ランダム性を少し加える（中級・上級向け）
  if (settings.randomness > 0 && bestMove) {
    const similarMoves = moves.filter(move => {
      const newState = makeMove(gameState, move);
      if (!newState) return false;
      
      const score = evaluatePosition(newState);
      const threshold = 50 * settings.randomness; // ランダム性に応じた閾値
      
      return Math.abs(score - bestScore) < threshold;
    });

    if (similarMoves.length > 1) {
      bestMove = similarMoves[Math.floor(Math.random() * similarMoves.length)];
    }
  }

  return {
    score: bestScore,
    bestMove,
    depth: maxDepth,
    nodesEvaluated
  };
}

// アルファベータ枝刈り
async function alphabeta(
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): Promise<number> {
  nodesEvaluated++;

  // 終了条件
  if (cancelFlag || Date.now() - startTime > timeLimit) {
    return evaluatePosition(gameState);
  }

  // ゲーム終了チェック
  const gameStatus = getGameStatus(gameState);
  if (gameStatus.isOver) {
    if (gameStatus.winner === Player.SENTE) {
      return 100000;
    } else if (gameStatus.winner === Player.GOTE) {
      return -100000;
    } else {
      return 0; // 引き分け
    }
  }

  // 深さ0に達した場合は静的評価
  if (depth === 0) {
    return evaluatePosition(gameState);
  }

  // 合法手を取得
  const moves = await getAllValidMoves(gameState);
  
  if (moves.length === 0) {
    return evaluatePosition(gameState);
  }

  if (maximizingPlayer) {
    let value = -Infinity;
    
    for (const move of moves) {
      if (cancelFlag || Date.now() - startTime > timeLimit) break;
      
      const newState = makeMove(gameState, move);
      if (!newState) continue;
      
      const score = await alphabeta(newState, depth - 1, alpha, beta, false);
      value = Math.max(value, score);
      alpha = Math.max(alpha, value);
      
      if (beta <= alpha) {
        break; // ベータカット
      }
    }
    
    return value;
  } else {
    let value = Infinity;
    
    for (const move of moves) {
      if (cancelFlag || Date.now() - startTime > timeLimit) break;
      
      const newState = makeMove(gameState, move);
      if (!newState) continue;
      
      const score = await alphabeta(newState, depth - 1, alpha, beta, true);
      value = Math.min(value, score);
      beta = Math.min(beta, value);
      
      if (beta <= alpha) {
        break; // アルファカット
      }
    }
    
    return value;
  }
}

