import { useState, useEffect } from 'react'
import { User, Clock, X } from 'lucide-react'
import type { GameInvite } from '@/types/online'

interface InviteNotificationProps {
  invite: GameInvite
  onAccept: (playerName: string) => void
  onDecline: () => void
  onExpire: () => void
}

export function InviteNotification({ invite, onAccept, onDecline, onExpire }: InviteNotificationProps) {
  const [playerName, setPlayerName] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const updateTimeLeft = () => {
      const remaining = Math.max(0, 
        Math.floor((new Date(invite.expiresAt).getTime() - Date.now()) / 1000)
      )
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        onExpire()
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [invite.expiresAt, onExpire])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeControl = () => {
    if (!invite.timeControl) return '時間無制限'
    
    const { initial, increment, byoyomi } = invite.timeControl
    if (byoyomi) {
      return `${initial / 60}分 + ${byoyomi}秒秒読み`
    }
    return `${initial / 60}分 + ${increment}秒加算`
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm w-full animate-slide-in-bottom z-50">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg">対局の招待</h3>
        <button
          onClick={onDecline}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-600" />
          <span className="font-medium">{invite.fromPlayer.name}</span>
          {invite.fromPlayer.rating && (
            <span className="text-sm text-gray-500">
              (レート: {invite.fromPlayer.rating})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-600" />
          <span className="text-sm">{formatTimeControl()}</span>
        </div>

        {invite.message && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-sm text-gray-700">{invite.message}</p>
          </div>
        )}

        <div className="text-xs text-orange-600 text-center">
          残り時間: {formatTime(timeLeft)}
        </div>

        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="あなたの名前"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onAccept(playerName)}
            disabled={!playerName.trim()}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            承諾
          </button>
          <button
            onClick={onDecline}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            拒否
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-bottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}