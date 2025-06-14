'use client';

import React, { useState, useCallback } from 'react';
import { GameStateWithKifu } from '@/utils/shogi/gameWithKifu';
import { endGameWithKifu, undoMoveWithKifu } from '@/utils/shogi/gameWithKifu';

interface GameControllerProps {
  gameState: GameStateWithKifu;
  onGameStateChange: (newState: GameStateWithKifu) => void;
}

export const GameController: React.FC<GameControllerProps> = ({ 
  gameState, 
  onGameStateChange 
}) => {
  const [showResignDialog, setShowResignDialog] = useState(false);
  
  // 手数を計算
  const moveCount = gameState.kifu.moves.length;
  
  // 投了処理
  const handleResign = useCallback(() => {
    const winner = gameState.game.currentPlayer === 'sente' ? 'gote_win' : 'sente_win';
    const newState = endGameWithKifu(gameState, winner);
    onGameStateChange(newState);
    setShowResignDialog(false);
  }, [gameState, onGameStateChange]);

  // 待った（手を戻す）処理
  const handleUndo = useCallback(() => {
    if (gameState.kifu.moves.length === 0) return;
    
    const newState = undoMoveWithKifu(gameState);
    if (newState) {
      onGameStateChange(newState);
    }
  }, [gameState, onGameStateChange]);

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
          {gameState.game.currentPlayer === 'sente' ? '☗先手' : '☖後手'}
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

      {/* 操作ボタン */}
      <div className="control-buttons flex gap-2 justify-center">
        {/* 待ったボタン */}
        <button
          onClick={handleUndo}
          className={`px-4 py-2 rounded-md transition-colors ${
            gameState.kifu.moves.length > 0 && gameState.game.gameStatus === 'ongoing'
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={gameState.kifu.moves.length === 0 || gameState.game.gameStatus !== 'ongoing'}
        >
          待った
        </button>

        {/* 投了ボタン */}
        <button
          onClick={() => setShowResignDialog(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          disabled={gameState.game.gameStatus !== 'ongoing'}
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

      {/* ゲーム終了表示 */}
      {gameState.game.gameStatus !== 'ongoing' && (
        <div className="game-result mt-4 p-4 bg-yellow-100 rounded-md text-center">
          <p className="text-lg font-bold">
            {gameState.game.gameStatus === 'checkmate' && '詰み'}
            {gameState.game.gameStatus === 'resigned' && '投了'}
            {gameState.game.gameStatus === 'draw' && '引き分け'}
            {gameState.game.gameStatus === 'repetition_draw' && '千日手'}
            {gameState.game.gameStatus === 'impasse' && '持将棋'}
          </p>
          {gameState.kifu.gameInfo.result && (
            <p className="mt-2">
              {gameState.kifu.gameInfo.result.winner === 'sente' ? '先手' : '後手'}の勝ち
            </p>
          )}
        </div>
      )}
    </div>
  );
};