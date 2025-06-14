'use client';

import React, { useState, useEffect } from 'react';
import { KifuMetadata } from '@/types/kifu';
import { listKifuRecords, deleteKifuRecord } from '@/utils/shogi/storageService';

interface KifuListProps {
  onSelect: (kifuId: string) => void;
  onDelete?: (kifuId: string) => void;
  selectedId?: string;
}

export const KifuList: React.FC<KifuListProps> = ({ 
  onSelect, 
  onDelete,
  selectedId 
}) => {
  const [kifuList, setKifuList] = useState<KifuMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKifuList();
  }, []);

  const loadKifuList = () => {
    setLoading(true);
    try {
      const records = listKifuRecords();
      setKifuList(records);
    } catch (error) {
      console.error('Failed to load kifu list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, kifuId: string) => {
    e.stopPropagation();
    if (window.confirm('この棋譜を削除しますか？')) {
      if (deleteKifuRecord(kifuId)) {
        loadKifuList();
        onDelete?.(kifuId);
      }
    }
  };


  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  if (kifuList.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        保存された棋譜がありません
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {kifuList.map((kifu) => (
        <div
          key={kifu.id}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            selectedId === kifu.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onSelect(kifu.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {kifu.gameInfo.sente} vs {kifu.gameInfo.gote}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {kifu.gameInfo.date} {kifu.gameInfo.startTime}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {kifu.moveCount}手 
                {kifu.gameInfo.result && (
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded">
                    {getResultText(kifu.gameInfo.result)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, kifu.id)}
              className="ml-2 text-red-600 hover:text-red-800 text-sm"
              aria-label="削除"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

function getResultText(result: string): string {
  const resultMap: { [key: string]: string } = {
    'sente_win': '先手勝ち',
    'gote_win': '後手勝ち',
    'draw': '引き分け',
    'resign': '投了',
    'time_up': '時間切れ',
    'sennichite': '千日手',
    'jishogi': '持将棋'
  };
  
  return resultMap[result] || result;
}