'use client';

import React from 'react';
import { KifuMetadata } from '@/types/kifu';

interface KifuCardProps {
  kifu: KifuMetadata;
  onSelect: () => void;
  onDelete: () => void;
  isSelected?: boolean;
}

export const KifuCard: React.FC<KifuCardProps> = ({
  kifu,
  onSelect,
  onDelete,
  isSelected = false
}) => {

  const getResultText = (result: string): string => {
    const resultMap: { [key: string]: string } = {
      'sente_win': '先手勝ち',
      'gote_win': '後手勝ち',
      'draw': '引き分け',
      'sennichite': '千日手',
      'jishogi': '持将棋',
      'illegal_move': '反則負け',
      'time_up': '時間切れ',
      'resign': '投了',
      'abort': '中断'
    };
    return resultMap[result] || result;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      {/* サムネイル */}
      <div className="w-full h-40 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-800">{kifu.moveCount}</div>
          <div className="text-sm text-amber-600">手</div>
        </div>
      </div>

      {/* 情報 */}
      <div className="p-4">
        <div className="font-semibold text-gray-900 mb-1">
          {kifu.gameInfo.sente} vs {kifu.gameInfo.gote}
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          {kifu.gameInfo.date} {kifu.gameInfo.startTime}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {kifu.moveCount}手
            {kifu.gameInfo.result && (
              <span className="ml-2 inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                {getResultText(kifu.gameInfo.result)}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/kifu/${kifu.id}/replay`;
              }}
              className="text-blue-600 hover:text-blue-800 p-1"
              aria-label="再生"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/kifu/${kifu.id}/analysis`;
              }}
              className="text-green-600 hover:text-green-800 p-1"
              aria-label="分析"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-800 p-1"
              aria-label="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};