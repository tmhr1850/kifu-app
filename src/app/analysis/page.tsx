'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameState } from '@/types/shogi';
import { createNewGame } from '@/utils/shogi/game';
import { AnalysisBoard } from '@/components/analysis/AnalysisBoard';

export default function AnalysisPage() {
  const router = useRouter();
  const [gameState] = useState<GameState>(createNewGame());
  const [currentMoveNumber, setCurrentMoveNumber] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">局面分析</h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              戻る
            </button>
          </div>
          <p className="mt-2 text-gray-600">
            AIを使って現在の局面を詳しく分析します
          </p>
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