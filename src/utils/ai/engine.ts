import { GameState } from '@/types/shogi';
import { AIEngine, AISettings, EvaluationResult, AIWorkerMessage } from './types';
import { minimax, cancelSearch } from './minimax';

export class ShogiAIEngine implements AIEngine {
  private worker: Worker | null = null;
  private isEvaluating = false;
  private workerResolve: ((result: EvaluationResult) => void) | null = null;
  private workerReject: ((error: Error) => void) | null = null;

  constructor() {
    // Web Worker対応チェック
    if (typeof Worker !== 'undefined') {
      this.initWorker();
    }
  }

  private initWorker(): void {
    // Next.js環境でのWeb Worker対応
    if (typeof Worker !== 'undefined' && typeof window !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./worker.ts', import.meta.url));
        this.setupWorkerHandlers();
      } catch (error) {
        console.warn('Web Worker initialization failed, falling back to main thread', error);
        this.worker = null;
      }
    }
  }

  private setupWorkerHandlers(): void {
    if (!this.worker) return;

    this.worker.addEventListener('message', (event: MessageEvent<AIWorkerMessage>) => {
      if (event.data.type === 'RESULT' && this.workerResolve) {
        this.workerResolve(event.data.result!);
        this.workerResolve = null;
        this.workerReject = null;
      }
    });

    this.worker.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      if (this.workerReject) {
        this.workerReject(new Error(error.message || 'Worker error'));
        this.workerResolve = null;
        this.workerReject = null;
      }
    });
  }

  async evaluate(gameState: GameState, settings: AISettings): Promise<EvaluationResult> {
    this.isEvaluating = true;

    try {
      if (this.worker) {
        // Web Workerで実行
        return await this.evaluateWithWorker(gameState, settings);
      } else {
        // メインスレッドで実行（フォールバック）
        return await this.evaluateOnMainThread(gameState, settings);
      }
    } finally {
      this.isEvaluating = false;
    }
  }

  private async evaluateOnMainThread(
    gameState: GameState, 
    settings: AISettings
  ): Promise<EvaluationResult> {
    // 少し遅延を入れて思考中の表示を見せる
    if (settings.timeSettings.mode !== 'instant') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return await minimax(gameState, settings);
  }

  private async evaluateWithWorker(
    gameState: GameState,
    settings: AISettings
  ): Promise<EvaluationResult> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (event: MessageEvent<AIWorkerMessage>) => {
        if (event.data.type === 'RESULT' && event.data.result) {
          this.worker!.removeEventListener('message', handleMessage);
          resolve(event.data.result);
        }
      };

      const handleError = (error: ErrorEvent) => {
        this.worker!.removeEventListener('error', handleError);
        reject(new Error(error.message || 'Worker error'));
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      // ワーカーに評価を依頼
      const message: AIWorkerMessage = {
        type: 'EVALUATE',
        gameState,
        settings
      };
      this.worker.postMessage(message);
    });
  }

  cancelEvaluation(): void {
    if (!this.isEvaluating) return;

    if (this.worker) {
      const message: AIWorkerMessage = { type: 'CANCEL' };
      this.worker.postMessage(message);
    } else {
      cancelSearch();
    }
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// シングルトンインスタンス
let engineInstance: ShogiAIEngine | null = null;

export function getAIEngine(): ShogiAIEngine {
  if (!engineInstance) {
    engineInstance = new ShogiAIEngine();
  }
  return engineInstance;
}

export function destroyAIEngine(): void {
  if (engineInstance) {
    engineInstance.destroy();
    engineInstance = null;
  }
}