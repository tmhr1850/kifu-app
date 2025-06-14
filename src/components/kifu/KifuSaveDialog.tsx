'use client';

import React, { useState } from 'react';
import { GameInfo } from '@/types/kifu';

interface KifuSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameInfo: Partial<GameInfo>) => void;
  initialInfo?: Partial<GameInfo>;
}

export const KifuSaveDialog: React.FC<KifuSaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInfo = {}
}) => {
  const [gameInfo, setGameInfo] = useState<Partial<GameInfo>>({
    sente: initialInfo.sente || 'Player 1',
    gote: initialInfo.gote || 'Player 2',
    event: initialInfo.event || '',
    site: initialInfo.site || '',
    ...initialInfo
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(gameInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">対局情報を入力</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              先手
            </label>
            <input
              type="text"
              value={gameInfo.sente || ''}
              onChange={(e) => setGameInfo({ ...gameInfo, sente: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              後手
            </label>
            <input
              type="text"
              value={gameInfo.gote || ''}
              onChange={(e) => setGameInfo({ ...gameInfo, gote: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              大会・イベント名（任意）
            </label>
            <input
              type="text"
              value={gameInfo.event || ''}
              onChange={(e) => setGameInfo({ ...gameInfo, event: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              場所（任意）
            </label>
            <input
              type="text"
              value={gameInfo.site || ''}
              onChange={(e) => setGameInfo({ ...gameInfo, site: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};