'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DraggableBoard } from './DraggableBoard';
import { GameController } from './GameController';
import { Position } from '@/utils/shogi/moveRules';
import { 
  GameStateWithKifu, 
  createNewGameWithKifu, 
  makeMoveWithKifu,
  saveCurrentGame,
  resumeGame
} from '@/utils/shogi/gameWithKifu';
import { makeMoveWithValidation } from '@/utils/shogi/game';

export const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameStateWithKifu>(() => {
    // セッションストレージから再開するゲームIDを取得
    if (typeof window !== 'undefined') {
      const resumeGameId = sessionStorage.getItem('resumePausedGame');
      if (resumeGameId) {
        sessionStorage.removeItem('resumePausedGame');
        const resumedGame = resumeGame(resumeGameId);
        if (resumedGame) {
          return resumedGame;
        }
      }
    }
    
    return createNewGameWithKifu({
      title: '新規対局',
      sente: 'プレイヤー1',
      gote: 'プレイヤー2',
      handicap: 'none'
    });
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 最終着手を計算
  const lastMove = useMemo(() => {
    const moves = gameState.kifu?.moves || [];
    if (moves.length === 0) return null;

    const gameMove = gameState.game.moveHistory[gameState.game.moveHistory.length - 1];
    
    if (!gameMove) return null;

    return {
      from: gameMove.from || { row: -1, col: -1 }, // 持ち駒の場合
      to: gameMove.to
    };
  }, [gameState]);

  // 移動ハンドラー
  const handleMove = useCallback((from: Position, to: Position) => {
    // 現在の盤面から駒を取得
    const piece = gameState.game.board[from.row][from.col];
    if (!piece) return;

    const move = {
      from,
      to,
      piece,
      promote: false // TODO: 成り判定を実装
    };

    // まずバリデーションチェック
    const validationResult = makeMoveWithValidation(gameState.game, move);
    if (!validationResult.valid) {
      setErrorMessage(validationResult.errorMessage || '無効な手です');
      return;
    }

    const newState = makeMoveWithKifu(gameState, move);
    if (newState) {
      setGameState(newState);
      setErrorMessage(null); // エラーメッセージをクリア
      // 自動保存
      saveCurrentGame(newState);
    }
  }, [gameState]);

  // ゲーム状態の変更ハンドラー
  const handleGameStateChange = useCallback((newState: GameStateWithKifu) => {
    setGameState(newState);
    saveCurrentGame(newState);
  }, []);

  // エラーメッセージの自動非表示
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 3000); // 3秒後に自動的に消える
      
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <div className="game-board-container flex flex-col lg:flex-row gap-4 p-4">
      <div className="board-section flex-1 relative">
        <DraggableBoard 
          board={gameState.game.board}
          onMove={handleMove}
          lastMove={lastMove}
        />
        
        {/* エラーメッセージの表示 */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="controls-section lg:w-80">
        <GameController
          gameState={gameState}
          onGameStateChange={handleGameStateChange}
          gameMode="local"
        />
      </div>
    </div>
  );
};