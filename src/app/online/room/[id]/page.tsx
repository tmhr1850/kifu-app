'use client'

import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { OnlineGameBoard } from '@/components/online/OnlineGameBoard'
import { useSocket } from '@/contexts/SocketContext'

export default function OnlineRoomPage() {
  const params = useParams()
  const roomId = params.id as string
  const { connected } = useSocket()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6">オンライン対局</h1>
            
            {/* 接続状態 */}
            {!connected && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                サーバーに接続していません。接続を確認してください。
              </div>
            )}

            {/* ゲームボード */}
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ height: '600px' }}>
              <OnlineGameBoard roomId={roomId} />
            </div>

            {/* ルーム情報 */}
            <div className="mt-4 text-center text-sm text-gray-600">
              ルームID: {roomId}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}