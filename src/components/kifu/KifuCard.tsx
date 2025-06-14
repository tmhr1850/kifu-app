'use client';

import React, { useEffect, useState } from 'react';
import { KifuMetadata } from '@/types/kifu';
import { loadKifuRecord } from '@/utils/shogi/storageService';
import { Board } from '@/utils/shogi/board';
import { executeMove } from '@/utils/shogi/game';

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
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    generateThumbnail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kifu.id]);

  const generateThumbnail = async () => {
    try {
      const fullKifu = loadKifuRecord(kifu.id);
      if (!fullKifu || !fullKifu.moves || fullKifu.moves.length === 0) {
        return;
      }

      // 最終局面を生成
      let board = new Board();
      board.reset();
      
      for (const move of fullKifu.moves) {
        const result = executeMove(board, move);
        if (!result.success) {
          break;
        }
        board = result.board;
      }

      // SVGでサムネイルを生成
      const svg = generateBoardSVG(board);
      setThumbnail(svg);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
    }
  };

  const generateBoardSVG = (board: Board): string => {
    const cellSize = 20;
    const boardSize = 9 * cellSize;
    const pieces = board.getPieces();
    
    let svg = `<svg viewBox="0 0 ${boardSize} ${boardSize}" xmlns="http://www.w3.org/2000/svg">`;
    
    // 背景
    svg += `<rect width="${boardSize}" height="${boardSize}" fill="#f5deb3"/>`;
    
    // グリッド
    for (let i = 0; i <= 9; i++) {
      svg += `<line x1="${i * cellSize}" y1="0" x2="${i * cellSize}" y2="${boardSize}" stroke="#8b4513" stroke-width="0.5"/>`;
      svg += `<line x1="0" y1="${i * cellSize}" x2="${boardSize}" y2="${i * cellSize}" stroke="#8b4513" stroke-width="0.5"/>`;
    }
    
    // 駒
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = pieces[row][col];
        if (piece) {
          const x = (8 - col) * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;
          const color = piece.owner === 'sente' ? '#000' : '#800';
          
          svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" 
                   font-size="14" fill="${color}" font-weight="bold">
                   ${getPieceSymbol(piece.type)}
                 </text>`;
        }
      }
    }
    
    svg += '</svg>';
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const getPieceSymbol = (type: string): string => {
    const symbols: { [key: string]: string } = {
      'ou': '王',
      'gyoku': '玉',
      'hi': '飛',
      'ryu': '龍',
      'kaku': '角',
      'uma': '馬',
      'kin': '金',
      'gin': '銀',
      'narigin': '全',
      'kei': '桂',
      'narikei': '圭',
      'kyo': '香',
      'narikyo': '杏',
      'fu': '歩',
      'to': 'と'
    };
    return symbols[type] || type;
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
        {thumbnail ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt="局面" className="w-full h-full object-contain p-2" />
          </>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-800">{kifu.moveCount}</div>
            <div className="text-sm text-amber-600">手</div>
          </div>
        )}
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