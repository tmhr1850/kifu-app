'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function OnlineLobbyPage() {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const { createRoom, joinRoom, currentRoom } = useSocket()
  const router = useRouter()

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('名前を入力してください')
      return
    }
    createRoom(playerName)
  }

  const handleJoinRoom = () => {
    if (!roomId.trim() || !playerName.trim()) {
      alert('ルームIDと名前を入力してください')
      return
    }
    joinRoom(roomId, playerName)
  }

  // ルームが作成/参加されたら対局画面へ
  if (currentRoom) {
    router.push(`/online/room/${currentRoom.id}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">🎮 オンライン対局</h1>

          <div className="max-w-md mx-auto space-y-6">
            {/* プレイヤー名入力 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プレイヤー名
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="あなたの名前"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 新規ルーム作成 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">新しい対局を始める</h2>
              <button
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
                className="w-full bg-amber-500 text-white py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ルームを作成
              </button>
            </div>

            {/* 既存ルームに参加 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">対局に参加する</h2>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="ルームID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim() || !playerName.trim()}
                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                参加する
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}