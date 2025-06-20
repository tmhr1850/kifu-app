'use client';

import React from 'react';

interface BoardImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardState?: unknown;
  title?: string;
}

export default function BoardImageDialog({ isOpen, onClose }: BoardImageDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">画像生成機能</h2>
        <p className="text-gray-600 mb-4">この機能は開発中です</p>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}