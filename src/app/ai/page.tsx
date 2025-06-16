'use client'

import { useState } from 'react'
import { ArrowLeft, Brain, Clock, Zap } from 'lucide-react'
import { Player } from '@/types/shogi'
import { AIDifficulty, AITimeSettings } from '@/utils/ai/types'
import AIGameBoard from '@/components/shogi/AIGameBoard'
import { useAIGame } from '@/hooks/useAIGame'

// AI設定画面
interface AIGameSettings {
  playerColor: Player
  difficulty: AIDifficulty
  timeSettings: AITimeSettings
}

function AISetupScreen({ onStart }: { onStart: (settings: AIGameSettings) => void }) {
  const [playerColor, setPlayerColor] = useState<Player>(Player.SENTE)
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AIDifficulty.INTERMEDIATE)
  const [timeMode, setTimeMode] = useState<'fixed' | 'instant'>('fixed')
  const [fixedTime, setFixedTime] = useState(3000)

  const handleStart = () => {
    const timeSettings: AITimeSettings = 
      timeMode === 'instant' 
        ? { mode: 'instant' }
        : { mode: 'fixed', fixedTime }

    onStart({
      playerColor,
      difficulty,
      timeSettings
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          AI対局設定
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* 先手後手選択 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">先手・後手</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPlayerColor(Player.SENTE)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  playerColor === Player.SENTE
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">先手</div>
                <div className="text-sm text-gray-600 mt-1">あなたが先に指します</div>
              </button>
              <button
                onClick={() => setPlayerColor(Player.GOTE)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  playerColor === Player.GOTE
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">後手</div>
                <div className="text-sm text-gray-600 mt-1">AIが先に指します</div>
              </button>
            </div>
          </div>

          {/* 難易度選択 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">難易度</h2>
            <div className="space-y-3">
              <button
                onClick={() => setDifficulty(AIDifficulty.BEGINNER)}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  difficulty === AIDifficulty.BEGINNER
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-700">初級</div>
                    <div className="text-sm text-gray-600">将棋を始めたばかりの方向け</div>
                  </div>
                  <span className="text-2xl">🌱</span>
                </div>
              </button>
              
              <button
                onClick={() => setDifficulty(AIDifficulty.INTERMEDIATE)}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  difficulty === AIDifficulty.INTERMEDIATE
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-700">中級</div>
                    <div className="text-sm text-gray-600">基本的な戦術を理解している方向け</div>
                  </div>
                  <span className="text-2xl">⚔️</span>
                </div>
              </button>
              
              <button
                onClick={() => setDifficulty(AIDifficulty.ADVANCED)}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  difficulty === AIDifficulty.ADVANCED
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-700">上級</div>
                    <div className="text-sm text-gray-600">本格的な対局を楽しみたい方向け</div>
                  </div>
                  <span className="text-2xl">👑</span>
                </div>
              </button>
            </div>
          </div>

          {/* 思考時間設定 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">思考時間</h2>
            <div className="space-y-3">
              <button
                onClick={() => setTimeMode('instant')}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  timeMode === 'instant'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">即指し</div>
                    <div className="text-sm text-gray-600">AIがすぐに指します</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTimeMode('fixed')}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  timeMode === 'fixed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium">固定時間</div>
                    <div className="text-sm text-gray-600">1手あたり{fixedTime / 1000}秒</div>
                  </div>
                  {timeMode === 'fixed' && (
                    <select
                      value={fixedTime}
                      onChange={(e) => setFixedTime(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value={1000}>1秒</option>
                      <option value={3000}>3秒</option>
                      <option value={5000}>5秒</option>
                      <option value={10000}>10秒</option>
                    </select>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handleStart}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            対局開始
          </button>
        </div>
      </div>
    </div>
  )
}

// AI対局画面
function AIGameScreen({ settings, onBack }: { settings: AIGameSettings; onBack: () => void }) {
  const {
    gameState,
    isAIThinking,
    thinkingProgress,
    makePlayerMove,
    resetGame,
    resign,
    playerColor,
    aiColor
  } = useAIGame(settings)

  const getDifficultyLabel = (difficulty: AIDifficulty) => {
    const labels = {
      [AIDifficulty.BEGINNER]: '初級',
      [AIDifficulty.INTERMEDIATE]: '中級',
      [AIDifficulty.ADVANCED]: '上級'
    }
    return labels[difficulty]
  }

  const getDifficultyIcon = (difficulty: AIDifficulty) => {
    const icons = {
      [AIDifficulty.BEGINNER]: '🌱',
      [AIDifficulty.INTERMEDIATE]: '⚔️',
      [AIDifficulty.ADVANCED]: '👑'
    }
    return icons[difficulty]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            設定に戻る
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getDifficultyIcon(settings.difficulty)}</span>
            <span className="font-medium">{getDifficultyLabel(settings.difficulty)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 将棋盤 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <AIGameBoard
                gameState={gameState}
                onMove={makePlayerMove}
                playerColor={playerColor}
                disabled={isAIThinking || gameState.currentPlayer !== playerColor}
              />
            </div>
          </div>

          {/* サイドパネル */}
          <div className="space-y-4">
            {/* 対局情報 */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-semibold mb-3">対局情報</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">あなた</span>
                  <span>{playerColor === Player.SENTE ? '先手' : '後手'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI</span>
                  <span>{aiColor === Player.SENTE ? '先手' : '後手'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">手番</span>
                  <span className="font-medium">
                    {gameState.currentPlayer === Player.SENTE ? '先手' : '後手'}
                  </span>
                </div>
              </div>
            </div>

            {/* AIの思考状態 */}
            {isAIThinking && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="font-medium text-blue-900">AI思考中...</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${thinkingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="space-y-2">
              <button
                onClick={resetGame}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                新しい対局
              </button>
              <button
                onClick={resign}
                disabled={gameState.resigned}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                投了
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// メインコンポーネント
export default function AIGamePage() {
  const [gameSettings, setGameSettings] = useState<AIGameSettings | null>(null)

  if (!gameSettings) {
    return <AISetupScreen onStart={setGameSettings} />
  }

  return <AIGameScreen settings={gameSettings} onBack={() => setGameSettings(null)} />
}