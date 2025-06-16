import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface MatchingDialogProps {
  isOpen: boolean
  onCancel: () => void
  queuePosition?: number | null
  estimatedWaitTime?: number
}

export function MatchingDialog({ isOpen, onCancel, queuePosition, estimatedWaitTime }: MatchingDialogProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">対戦相手を探しています</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center py-8">
          <Loader2 className="animate-spin h-12 w-12 text-amber-500 mb-4" />
          
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              経過時間: <span className="font-mono">{formatTime(elapsedTime)}</span>
            </p>
            
            {queuePosition && (
              <p className="text-sm text-gray-500">
                待機順位: {queuePosition}番目
              </p>
            )}
            
            {estimatedWaitTime && (
              <p className="text-sm text-gray-500">
                推定待ち時間: 約{Math.ceil(estimatedWaitTime / 60)}分
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            キャンセル
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          マッチングはいつでもキャンセルできます
        </div>
      </div>
    </div>
  )
}