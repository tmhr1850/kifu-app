'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { KifuRecord } from '@/types/kifu';
import { GameState } from '@/types/shogi';
import { createGameFromKifu } from '@/utils/shogi/gameWithKifu';
import { AnalysisBoard } from '@/components/analysis/AnalysisBoard';
import { getStoredKifuRecords } from '@/utils/shogi/storageService';

export default function KifuAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const [kifu, setKifu] = useState<KifuRecord | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentMoveNumber, setCurrentMoveNumber] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKifu = async () => {
      try {
        const records = await getStoredKifuRecords();
        const record = records.find(r => r.id === params.id);
        
        if (record) {
          setKifu(record);
          const game = createGameFromKifu(record);
          setGameState(game.game);
        }
      } catch (error) {
        console.error('Failed to load kifu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKifu();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!kifu || !gameState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">棋譜が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">棋譜分析</h1>
              <h2 className="text-xl text-gray-600 mt-2">{kifu.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {kifu.sente} vs {kifu.gote} - {new Date(kifu.date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>

        {/* 分析ボード */}
        <AnalysisBoard
          gameState={gameState}
          currentMoveNumber={currentMoveNumber}
          onMoveNumberChange={setCurrentMoveNumber}
        />
      </div>
    </div>
  );
}