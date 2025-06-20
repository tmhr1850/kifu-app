'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GameStateWithKifu, pauseGame } from '@/utils/shogi/gameWithKifu';
import { endGameWithKifu, undoMoveWithKifu } from '@/utils/shogi/gameWithKifu';
import { getGameStatus } from '@/utils/shogi/game';
import { Player, TimeControlSettings } from '@/types/shogi';
import { ConfirmDialog } from '../kifu/ConfirmDialog';
import GameClock from './GameClock';
import TimeSettingsModal from './TimeSettingsModal';
import { startClock, stopClock, addTimeControlToGame } from '@/utils/shogi/timeManager';

interface GameControllerProps {
  gameState: GameStateWithKifu;
  onGameStateChange: (newState: GameStateWithKifu) => void;
  gameMode?: 'local' | 'ai' | 'online';
  showTimeControl?: boolean;
}

export const GameController: React.FC<GameControllerProps> = ({ 
  gameState, 
  onGameStateChange,
  gameMode = 'local',
  showTimeControl = false
}) => {
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  
  // 手数を計算
  const moveCount = gameState.kifu?.moves?.length || 0;
  
  // ゲームの状態を取得
  const gameStatus = useMemo(() => getGameStatus(gameState.game), [gameState.game]);
  
  // 時計の開始・停止を管理
  useEffect(() => {
    if (!gameState.game.clockState) return;

    if (gameStatus.isOver) {
      // ゲーム終了時は時計を停止
      const newClockState = stopClock(gameState.game.clockState);
      if (newClockState !== gameState.game.clockState) {
        onGameStateChange({
          ...gameState,
          game: {
            ...gameState.game,
            clockState: newClockState,
          },
        });
      }
    } else if (!gameState.game.clockState.isRunning && moveCount > 0) {
      // 最初の手が指された後、時計を開始
      const newClockState = startClock(gameState.game.clockState);
      onGameStateChange({
        ...gameState,
        game: {
          ...gameState.game,
          clockState: newClockState,
        },
      });
    }
  }, [gameStatus.isOver, moveCount, gameState, onGameStateChange]);

  // 時間切れ処理
  const handleTimeUp = useCallback((player: Player) => {
    const winner = player === Player.SENTE ? 'gote_win' : 'sente_win';
    const newState = endGameWithKifu(gameState, winner, 'timeout');
    onGameStateChange(newState);
  }, [gameState, onGameStateChange]);

  // 秒読み警告音
  const handleByoyomiWarning = useCallback((player: Player, secondsLeft: number) => {
    console.log(`${player === Player.SENTE ? '先手' : '後手'} 秒読み: ${secondsLeft}秒`);
  }, []);

  // 時間設定の適用
  const handleTimeSettingsConfirm = useCallback((settings: TimeControlSettings) => {
    const newGameState = addTimeControlToGame(gameState.game, settings);
    onGameStateChange({
      ...gameState,
      game: newGameState,
    });
  }, [gameState, onGameStateChange]);

  // 投了処理
  const handleResign = useCallback(() => {
    const winner = gameState.game.currentPlayer === Player.SENTE ? 'gote_win' : 'sente_win';
    const newState = endGameWithKifu(gameState, winner);
    onGameStateChange(newState);
    setShowResignDialog(false);
  }, [gameState, onGameStateChange]);

  // 待った（手を戻す）処理
  const handleUndo = useCallback(() => {
    if (!gameState.kifu?.moves || gameState.kifu.moves.length === 0) return;
    
    const newState = undoMoveWithKifu(gameState);
    if (newState) {
      onGameStateChange(newState);
    }
  }, [gameState, onGameStateChange]);

  // 対局を中断する処理
  const handlePause = useCallback(() => {
    pauseGame(gameState, gameMode);
    setShowPauseDialog(false);
    // 親コンポーネントに中断を通知（例: ホーム画面に戻る）
    if (window.confirm('対局を中断しました。ホーム画面に戻りますか？')) {
      window.location.href = '/';
    }
  }, [gameState, gameMode]);

  return (
    <div className="game-controller p-4 bg-gray-100 rounded-lg shadow-md">
      {/* 手数表示 */}
      <div className="move-counter mb-4 text-center">
        <span className="text-lg font-semibold">手数: </span>
        <span className="text-2xl font-bold text-blue-600">{moveCount}</span>
      </div>

      {/* 現在の手番表示 */}
      <div className="current-player mb-4 text-center">
        <span className="text-lg">手番: </span>
        <span className="text-xl font-bold">
          {gameState.game.currentPlayer === Player.SENTE ? '☗先手' : '☖後手'}
        </span>
      </div>

      {/* 対局者名表示 */}
      <div className="players-info mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">☗先手:</span>
          <span className="font-bold">{gameState.kifu.gameInfo.sente || '未設定'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">☖後手:</span>
          <span className="font-bold">{gameState.kifu.gameInfo.gote || '未設定'}</span>
        </div>
      </div>

      {/* 時間表示 */}
      {showTimeControl && gameState.game.clockState && gameState.game.timeControl && (
        <div className="time-display mb-4 flex justify-around">
          <GameClock
            player={Player.GOTE}
            clockState={gameState.game.clockState}
            timeControl={gameState.game.timeControl}
            isCurrentPlayer={gameState.game.currentPlayer === Player.GOTE}
            onTimeUp={handleTimeUp}
            onByoyomiWarning={handleByoyomiWarning}
          />
          <GameClock
            player={Player.SENTE}
            clockState={gameState.game.clockState}
            timeControl={gameState.game.timeControl}
            isCurrentPlayer={gameState.game.currentPlayer === Player.SENTE}
            onTimeUp={handleTimeUp}
            onByoyomiWarning={handleByoyomiWarning}
          />
        </div>
      )}

      {/* 時間設定ボタン */}
      {showTimeControl && !gameState.game.clockState && (
        <div className="mb-4 text-center">
          <button
            onClick={() => setShowTimeSettings(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label="対局の時間設定を行う"
          >
            時間設定
          </button>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="control-buttons flex gap-2 justify-center flex-wrap">
        {/* 待ったボタン */}
        <button
          onClick={handleUndo}
          className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            gameState.kifu.moves.length > 0 && !gameStatus.isOver
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={gameState.kifu.moves.length === 0 || gameStatus.isOver}
          aria-label="一手戻す（待った）"
        >
          待った
        </button>

        {/* 中断ボタン */}
        <button
          onClick={() => setShowPauseDialog(true)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          disabled={gameStatus.isOver}
          aria-label="対局を中断する"
        >
          中断
        </button>

        {/* 投了ボタン */}
        <button
          onClick={() => setShowResignDialog(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          disabled={gameStatus.isOver}
          aria-label="投了する"
        >
          投了
        </button>
      </div>

      {/* 投了確認ダイアログ */}
      {showResignDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">投了確認</h3>
            <p className="mb-6">本当に投了しますか？</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowResignDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleResign}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                投了する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 中断確認ダイアログ */}
      <ConfirmDialog
        isOpen={showPauseDialog}
        title="対局の中断"
        message="対局を中断しますか？"
        onConfirm={handlePause}
        onCancel={() => setShowPauseDialog(false)}
        confirmText="中断する"
        cancelText="キャンセル"
        confirmButtonClass="bg-yellow-600 text-white hover:bg-yellow-700"
      />

      {/* ゲーム終了表示 */}
      {gameStatus.isOver && (
        <div className="game-result mt-4 p-4 bg-yellow-100 rounded-md text-center">
          <p className="text-lg font-bold">
            {gameStatus.reason === 'checkmate' && '詰み'}
            {gameStatus.reason === 'resignation' && '投了'}
            {gameStatus.reason === 'stalemate' && '引き分け'}
            {gameStatus.reason === 'repetition' && '千日手'}
            {gameStatus.reason === 'perpetual_check' && '連続王手の千日手'}
            {gameStatus.reason === 'impasse' && '持将棋'}
            {gameStatus.reason === 'timeout' && '時間切れ'}
          </p>
          {gameStatus.winner && (
            <p className="mt-2">
              {gameStatus.winner === Player.SENTE ? '先手' : '後手'}の勝ち
            </p>
          )}
        </div>
      )}

      {/* 時間設定モーダル */}
      <TimeSettingsModal
        isOpen={showTimeSettings}
        onClose={() => setShowTimeSettings(false)}
        onConfirm={handleTimeSettingsConfirm}
        initialSettings={gameState.game.timeControl}
      />
    </div>
  );
};