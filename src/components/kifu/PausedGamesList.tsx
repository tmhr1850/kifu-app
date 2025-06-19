'use client';

import React, { useState, useEffect } from 'react';
import { listPausedGames, deletePausedGame, deleteExpiredPausedGames, PausedGame } from '@/utils/shogi/storageService';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ConfirmDialog';

export const PausedGamesList: React.FC = () => {
  const [pausedGames, setPausedGames] = useState<PausedGame[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 期限切れのゲームを削除
    const deletedCount = deleteExpiredPausedGames();
    if (deletedCount > 0) {
      console.log(`${deletedCount}件の期限切れゲームを削除しました`);
    }
    loadPausedGames();
  }, []);

  const loadPausedGames = () => {
    const games = listPausedGames();
    setPausedGames(games);
  };

  const handleResume = (pausedGame: PausedGame) => {
    // 中断したゲームの種類に応じて、適切なページにリダイレクト
    const gameMode = pausedGame.gameMode;
    if (gameMode === 'ai') {
      // AI対局の場合は、セッションストレージに再開情報を保存
      sessionStorage.setItem('resumePausedGame', pausedGame.id);
      router.push('/ai');
    } else if (gameMode === 'online') {
      // オンライン対局の場合は、元のルームIDを使用
      const roomId = pausedGame.metadata?.roomId;
      if (roomId) {
        sessionStorage.setItem('resumePausedGame', pausedGame.id);
        router.push(`/online/room/${roomId}`);
      }
    } else {
      // ローカル対局の場合は、resume用のパラメータ付きでホームに遷移
      sessionStorage.setItem('resumePausedGame', pausedGame.id);
      router.push('/');
    }
  };

  const handleDelete = () => {
    if (selectedGameId) {
      deletePausedGame(selectedGameId);
      loadPausedGames();
      setShowDeleteDialog(false);
      setSelectedGameId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP');
  };

  const getDaysUntilExpiration = (pausedAt: string) => {
    const pausedDate = new Date(pausedAt);
    const now = new Date();
    const expirationDate = new Date(pausedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7日後
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return daysLeft;
  };

  const getExpirationWarningClass = (daysLeft: number) => {
    if (daysLeft <= 1) return 'text-red-600 font-bold';
    if (daysLeft <= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getGameModeLabel = (gameMode: string) => {
    switch (gameMode) {
      case 'ai':
        return 'AI対局';
      case 'online':
        return 'オンライン対局';
      default:
        return 'ローカル対局';
    }
  };

  if (pausedGames.length === 0) {
    return null;
  }

  return (
    <div className="paused-games-section mb-8">
      <h2 className="text-2xl font-bold mb-4">中断した対局</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pausedGames.map((game) => (
          <div
            key={game.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{game.kifuRecord.gameInfo.title || '無題の対局'}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {getGameModeLabel(game.gameMode)}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <p>☗{game.kifuRecord.gameInfo.sente || '先手'} vs ☖{game.kifuRecord.gameInfo.gote || '後手'}</p>
              <p>手数: {game.kifuRecord.moves.length}</p>
              <p>中断日時: {formatDate(game.pausedAt)}</p>
              {(() => {
                const daysLeft = getDaysUntilExpiration(game.pausedAt);
                return (
                  <p className={getExpirationWarningClass(daysLeft)}>
                    期限: あと{daysLeft}日
                  </p>
                );
              })()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleResume(game)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                再開
              </button>
              <button
                onClick={() => {
                  setSelectedGameId(game.id);
                  setShowDeleteDialog(true);
                }}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="中断データの削除"
        message="この中断データを削除しますか？"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedGameId(null);
        }}
        confirmText="削除"
        cancelText="キャンセル"
      />
    </div>
  );
};