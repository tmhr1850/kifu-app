'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DraggableBoard } from './DraggableBoard';
import { GameController } from './GameController';
import { LiveRegion } from './LiveRegion';
import { Position } from '@/utils/shogi/moveRules';
import { 
  GameStateWithKifu, 
  createNewGameWithKifu, 
  makeMoveWithKifu,
  saveCurrentGame,
  resumeGame
} from '@/utils/shogi/gameWithKifu';
import { useAudio, SoundType } from '@/contexts/AudioContext';
import { isInCheck, isCheckmateSync } from '@/utils/shogi/validators';

interface GameBoardProps {
  showTimeControl?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ showTimeControl = false }) => {
  const { playSound, startBgm } = useAudio();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');
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

  // ゲーム開始時にBGMを再生
  useEffect(() => {
    playSound(SoundType.GAME_START);
    startBgm();
  }, [playSound, startBgm]);

  // 移動ハンドラー
  const handleMove = useCallback((from: Position, to: Position) => {
    // エラーメッセージをクリア
    setErrorMessage(null);
    
    // 現在の盤面から駒を取得
    const piece = gameState.game.board[from.row][from.col];
    if (!piece) return;

    const move = {
      from,
      to,
      piece,
      promote: false // TODO: 成り判定を実装
    };

    const newState = makeMoveWithKifu(gameState, move);
    if (newState) {
      // 移動音を再生
      const lastMove = newState.game.moveHistory[newState.game.moveHistory.length - 1];
      if (lastMove?.captured) {
        playSound(SoundType.CAPTURE);
      } else {
        playSound(SoundType.MOVE);
      }

      // 王手判定
      if (isInCheck(newState.game)) {
        if (isCheckmateSync(newState.game)) {
          playSound(SoundType.CHECKMATE);
          setLiveMessage('詰みです！');
        } else {
          playSound(SoundType.CHECK);
          setLiveMessage('王手！');
        }
      } else {
        // 通常の移動を通知
        const moveText = newState.kifu.moves[newState.kifu.moves.length - 1]?.moveText || '移動しました';
        setLiveMessage(moveText);
      }

      setGameState(newState);
      // 自動保存
      saveCurrentGame(newState);
    } else {
      // エラー音を再生
      playSound(SoundType.ERROR);
      setErrorMessage('その手は指せません');
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [gameState, playSound]);

  // ゲーム状態の変更ハンドラー
  const handleGameStateChange = useCallback((newState: GameStateWithKifu) => {
    setGameState(newState);
    saveCurrentGame(newState);
  }, []);


  return (
    <div className="game-board-container flex flex-col lg:flex-row gap-4 p-4">
      {/* アクセシビリティ用のライブリージョン */}
      <LiveRegion message={liveMessage} politeness="assertive" />
      
      {/* エラーメッセージ表示 */}
      {errorMessage && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
      
      <div className="board-section flex-1">
        <DraggableBoard 
          board={gameState.game.board}
          onMove={handleMove}
          lastMove={lastMove}
        />
      </div>
      
      <div className="controls-section lg:w-80">
        <GameController
          gameState={gameState}
          onGameStateChange={handleGameStateChange}
          gameMode="local"
          showTimeControl={showTimeControl}
        />
      </div>
    </div>
  );
};