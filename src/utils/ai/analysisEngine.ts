import { GameState, Move } from '@/types/shogi';
import { PositionAnalysis, AnalysisSettings } from '@/types/analysis';
import { AIDifficulty } from './types';
import { ShogiAI } from './engine';
import { getAllValidMovesSync } from '../shogi/validators';
import { makeMove } from '../shogi/game';

export class AnalysisEngine {
  private ai: ShogiAI;
  private cache: Map<string, PositionAnalysis> = new Map();
  private isAnalyzing = false;
  private abortController: AbortController | null = null;

  constructor() {
    this.ai = new ShogiAI();
  }

  /**
   * 局面を分析
   */
  async analyzePosition(
    gameState: GameState,
    settings: AnalysisSettings
  ): Promise<PositionAnalysis> {
    // キャッシュキーを生成
    const cacheKey = this.generateCacheKey(gameState, settings);
    
    // キャッシュチェック
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 分析中フラグを立てる
    this.isAnalyzing = true;
    this.abortController = new AbortController();

    try {
      // メインラインの評価
      const mainResult = await this.ai.evaluate(gameState, {
        difficulty: AIDifficulty.ADVANCED,
        timeSettings: {
          mode: settings.timeLimit ? 'fixed' : 'instant',
          fixedTime: settings.timeLimit
        },
        randomness: 0 // 分析時はランダム性なし
      });

      // 代替手の探索
      const alternativeMoves: Move[] = [];
      if (settings.multiPV > 1 && mainResult.bestMove) {
        const candidates = await this.findAlternativeMoves(
          gameState,
          mainResult.bestMove,
          settings.multiPV - 1,
          settings.depth
        );
        alternativeMoves.push(...candidates);
      }

      const analysis: PositionAnalysis = {
        score: mainResult.score,
        bestMove: mainResult.bestMove,
        alternativeMoves,
        depth: mainResult.depth,
        nodesEvaluated: mainResult.nodesEvaluated,
        timestamp: Date.now(),
        moveNumber: gameState.moveHistory.length
      };

      // キャッシュに保存
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } finally {
      this.isAnalyzing = false;
      this.abortController = null;
    }
  }

  /**
   * 代替手を探索
   */
  private async findAlternativeMoves(
    gameState: GameState,
    excludeMove: Move,
    count: number,
    _depth: number
  ): Promise<Move[]> {
    // depth parameter reserved for future depth-specific searches
    void _depth;
    const validMoves = this.getAllValidMoves(gameState);
    
    // 除外する手以外の候補を評価
    const candidates = validMoves.filter(move => 
      !this.isSameMove(move, excludeMove)
    );

    // 各候補手を評価
    const evaluations = await Promise.all(
      candidates.slice(0, count * 2).map(async move => {
        const nextState = this.applyMove(gameState, move);
        const result = await this.ai.evaluate(nextState, {
          difficulty: AIDifficulty.ADVANCED,
          timeSettings: { mode: 'instant' },
          randomness: 0
        });
        return { move, score: -result.score }; // 相手から見た評価値なので反転
      })
    );

    // スコアでソートして上位を返す
    evaluations.sort((a, b) => b.score - a.score);
    return evaluations.slice(0, count).map(e => e.move);
  }

  /**
   * 分析を中止
   */
  cancelAnalysis(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.ai.cancelEvaluation();
    this.isAnalyzing = false;
  }

  /**
   * 分析中かどうか
   */
  isCurrentlyAnalyzing(): boolean {
    return this.isAnalyzing;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * キャッシュキーを生成
   */
  private generateCacheKey(gameState: GameState, settings: AnalysisSettings): string {
    // 盤面と持ち駒、手番、設定を含むハッシュを生成
    const boardStr = gameState.board.flat().map(p => p?.type || '-').join('');
    const capturedStr = JSON.stringify(gameState.handPieces);
    const settingsStr = `${settings.depth}-${settings.multiPV}`;
    return `${boardStr}-${capturedStr}-${gameState.currentPlayer}-${settingsStr}`;
  }

  /**
   * 指し手が同じかどうか
   */
  private isSameMove(move1: Move, move2: Move): boolean {
    // 両方の from が null（持ち駒を打つ）場合
    if (!move1.from && !move2.from) {
      return move1.to.row === move2.to.row &&
             move1.to.col === move2.to.col &&
             move1.piece.type === move2.piece.type;
    }
    
    // 片方だけ from が null の場合は異なる手
    if (!move1.from || !move2.from) {
      return false;
    }
    
    // 通常の移動の比較
    return move1.from.row === move2.from.row &&
           move1.from.col === move2.from.col &&
           move1.to.row === move2.to.row &&
           move1.to.col === move2.to.col &&
           move1.piece.type === move2.piece.type &&
           move1.promote === move2.promote;
  }

  /**
   * 全ての合法手を取得
   */
  private getAllValidMoves(gameState: GameState): Move[] {
    return getAllValidMovesSync(gameState);
  }

  /**
   * 指し手を適用
   */
  private applyMove(gameState: GameState, move: Move): GameState {
    const newState = makeMove(gameState, move);
    return newState || gameState; // makeMoveがnullを返す場合は元の状態を返す
  }
}