import { useState } from 'react'
import { Zap, Users, UserPlus } from 'lucide-react'
import type { MatchingOptions as MatchingOptionsType, TimeControl } from '@/types/online'

interface MatchingOptionsProps {
  onStartMatching: (playerName: string, options: MatchingOptionsType) => void
  disabled?: boolean
}

const TIME_PRESETS: Array<{
  label: string
  timeControl: TimeControl
}> = [
  {
    label: '10分切れ負け',
    timeControl: { initial: 600, increment: 0 }
  },
  {
    label: '10分 + 10秒',
    timeControl: { initial: 600, increment: 10 }
  },
  {
    label: '15分 + 30秒秒読み',
    timeControl: { initial: 900, increment: 0, byoyomi: 30, periods: 1 }
  },
  {
    label: '30分切れ負け',
    timeControl: { initial: 1800, increment: 0 }
  },
]

export function MatchingOptions({ onStartMatching, disabled }: MatchingOptionsProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedMode, setSelectedMode] = useState<'random' | 'rated' | 'friend'>('random')
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0)
  const [friendId, setFriendId] = useState('')

  const handleStartMatching = () => {
    if (!playerName.trim()) {
      alert('名前を入力してください')
      return
    }

    const options: MatchingOptionsType = {
      mode: selectedMode,
      timeControl: TIME_PRESETS[selectedTimeIndex].timeControl,
    }

    if (selectedMode === 'friend' && friendId) {
      options.friendId = friendId
    }

    onStartMatching(playerName, options)
  }

  return (
    <div className="space-y-6">
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

      {/* マッチングモード選択 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">対戦モード</h3>
        <div className="space-y-3">
          <button
            onClick={() => setSelectedMode('random')}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
              selectedMode === 'random'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Zap className={selectedMode === 'random' ? 'text-amber-600' : 'text-gray-600'} />
            <div className="text-left">
              <p className="font-medium">ランダムマッチ</p>
              <p className="text-sm text-gray-600">すぐに対戦相手を見つける</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedMode('rated')}
            disabled
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
              selectedMode === 'rated'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            } opacity-50 cursor-not-allowed`}
          >
            <Users className={selectedMode === 'rated' ? 'text-amber-600' : 'text-gray-600'} />
            <div className="text-left">
              <p className="font-medium">レート戦（準備中）</p>
              <p className="text-sm text-gray-600">実力の近い相手と対戦</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedMode('friend')}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
              selectedMode === 'friend'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <UserPlus className={selectedMode === 'friend' ? 'text-amber-600' : 'text-gray-600'} />
            <div className="text-left">
              <p className="font-medium">フレンド対戦</p>
              <p className="text-sm text-gray-600">特定の相手を招待</p>
            </div>
          </button>
        </div>

        {selectedMode === 'friend' && (
          <div className="mt-4">
            <input
              type="text"
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              placeholder="フレンドIDを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* 時間設定 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">持ち時間</h3>
        <div className="grid grid-cols-2 gap-2">
          {TIME_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => setSelectedTimeIndex(index)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedTimeIndex === index
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* マッチング開始ボタン */}
      <button
        onClick={handleStartMatching}
        disabled={!playerName.trim() || disabled}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-lg"
      >
        {selectedMode === 'random' && '対戦相手を探す'}
        {selectedMode === 'rated' && 'レート戦を開始'}
        {selectedMode === 'friend' && 'フレンドを招待'}
      </button>
    </div>
  )
}