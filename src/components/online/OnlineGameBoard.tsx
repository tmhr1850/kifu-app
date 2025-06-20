'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface OnlineGameBoardProps {
  roomId: string
}

export function OnlineGameBoard({ roomId }: OnlineGameBoardProps) {
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full relative">
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">オンライン対局</h2>
        <p className="text-gray-600 mb-2">ルームID: {roomId}</p>
        <p className="text-gray-600">ユーザー: {user?.email || 'ゲスト'}</p>
        <p className="text-gray-600 mt-4">この機能は開発中です</p>
      </div>
    </div>
  )
}