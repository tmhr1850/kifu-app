'use client'

import React from 'react'
import { KifuRecord } from '@/types/kifu'

interface KifuReplayBoardWithVariationsProps {
  kifu: KifuRecord
  className?: string
  allowEditing?: boolean
}

export default function KifuReplayBoardWithVariations({ 
  kifu, 
  className = '',
  allowEditing = true
}: KifuReplayBoardWithVariationsProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-2">棋譜再生（変化対応）</h2>
        {kifu.gameInfo && (
          <div className="text-sm text-gray-600 mb-2">
            {kifu.gameInfo.sente && <span>先手: {kifu.gameInfo.sente}</span>}
            {kifu.gameInfo.gote && <span className="ml-4">後手: {kifu.gameInfo.gote}</span>}
            {kifu.gameInfo.date && <span className="ml-4">{kifu.gameInfo.date}</span>}
          </div>
        )}
        <p className="text-gray-600">
          この機能は開発中です。{allowEditing ? '編集モード' : '閲覧モード'}で表示します。
        </p>
      </div>
    </div>
  )
}