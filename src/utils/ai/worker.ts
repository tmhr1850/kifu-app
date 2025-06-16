import { AIWorkerMessage } from './types';
import { minimax, cancelSearch } from './minimax';

// Web Worker context
declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<AIWorkerMessage>) => {
  const { type, gameState, settings } = event.data;

  switch (type) {
    case 'EVALUATE':
      if (!gameState || !settings) {
        self.postMessage({
          type: 'RESULT',
          result: {
            score: 0,
            bestMove: null,
            depth: 0,
            nodesEvaluated: 0
          }
        } as AIWorkerMessage);
        return;
      }

      try {
        const result = await minimax(gameState, settings);
        
        self.postMessage({
          type: 'RESULT',
          result
        } as AIWorkerMessage);
      } catch (error) {
        console.error('Worker evaluation error:', error);
        self.postMessage({
          type: 'RESULT',
          result: {
            score: 0,
            bestMove: null,
            depth: 0,
            nodesEvaluated: 0
          }
        } as AIWorkerMessage);
      }
      break;

    case 'CANCEL':
      cancelSearch();
      break;

    default:
      console.warn('Unknown message type:', type);
  }
});

// エラーハンドリング
self.addEventListener('error', (error) => {
  console.error('Worker error:', error);
});

export {};