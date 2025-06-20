'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { KifuMove } from '@/types/kifu'
import { Player } from '@/types/shogi'

interface KifuReplayControlsProps {
  moves: KifuMove[]
  currentMoveIndex: number
  onMoveIndexChange: (index: number) => void
  className?: string
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2, 3]

export default function KifuReplayControls({
  moves,
  currentMoveIndex,
  onMoveIndexChange,
  className = '',
}: KifuReplayControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const canGoBack = currentMoveIndex > -1
  const canGoForward = currentMoveIndex < moves.length - 1

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const handleFirst = useCallback(() => {
    stopPlayback()
    onMoveIndexChange(-1)
  }, [onMoveIndexChange, stopPlayback])

  const handlePrevious = useCallback(() => {
    stopPlayback()
    if (canGoBack) {
      onMoveIndexChange(currentMoveIndex - 1)
    }
  }, [canGoBack, currentMoveIndex, onMoveIndexChange, stopPlayback])

  const handleNext = useCallback(() => {
    stopPlayback()
    if (canGoForward) {
      onMoveIndexChange(currentMoveIndex + 1)
    }
  }, [canGoForward, currentMoveIndex, onMoveIndexChange, stopPlayback])

  const handleLast = useCallback(() => {
    stopPlayback()
    onMoveIndexChange(moves.length - 1)
  }, [moves.length, onMoveIndexChange, stopPlayback])

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback()
    } else {
      if (!canGoForward) {
        onMoveIndexChange(-1)
      }
      setIsPlaying(true)
    }
  }, [isPlaying, canGoForward, onMoveIndexChange, stopPlayback])

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  const handleJumpToMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopPlayback()
    const moveNumber = parseInt(e.target.value, 10)
    if (!isNaN(moveNumber) && moveNumber >= 0 && moveNumber <= moves.length) {
      onMoveIndexChange(moveNumber - 1)
    }
  }

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'Home':
          e.preventDefault()
          handleFirst()
          break
        case 'End':
          e.preventDefault()
          handleLast()
          break
        case ' ':
          e.preventDefault()
          togglePlayback()
          break
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [handlePrevious, handleNext, handleFirst, handleLast, togglePlayback])

  useEffect(() => {
    if (isPlaying && canGoForward) {
      intervalRef.current = setInterval(() => {
        const nextIndex = currentMoveIndex + 1
        if (nextIndex >= moves.length) {
          setIsPlaying(false)
        } else {
          onMoveIndexChange(nextIndex)
        }
      }, 1000 / playbackSpeed)
    } else {
      stopPlayback()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, canGoForward, currentMoveIndex, moves.length, onMoveIndexChange, stopPlayback])

  useEffect(() => {
    if (!canGoForward && isPlaying) {
      stopPlayback()
    }
  }, [canGoForward, isPlaying, stopPlayback])

  const currentMove = currentMoveIndex >= 0 ? moves[currentMoveIndex] : null
  const moveText = currentMove 
    ? `${currentMove.player === Player.SENTE ? '▲' : '△'}${currentMove.piece}${currentMove.to}${currentMove.promote ? '成' : ''}`
    : '開始局面'

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            手数: {currentMoveIndex + 1} / {moves.length}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {moveText}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFirst}
            disabled={!canGoBack}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="最初へ (Home)"
            aria-label="最初へ移動"
          >
            <ChevronFirst className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrevious}
            disabled={!canGoBack}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="一手戻る (←)"
            aria-label="一手戻る"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlayback}
            className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isPlaying ? '一時停止 (Space)' : '自動再生 (Space)'}
            aria-label={isPlaying ? '再生を一時停止' : '自動再生を開始'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoForward}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="一手進む (→)"
            aria-label="一手進む"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleLast}
            disabled={!canGoForward}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="最後へ (End)"
            aria-label="最後へ移動"
          >
            <ChevronLast className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="move-jump" className="text-sm text-gray-600">
              手数:
            </label>
            <input
              id="move-jump"
              type="number"
              min="0"
              max={moves.length}
              value={currentMoveIndex + 1}
              onChange={handleJumpToMove}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">速度:</label>
            <div className="flex gap-1">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-1 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    playbackSpeed === speed
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  aria-label={`再生速度 ${speed}倍`}
                  aria-pressed={playbackSpeed === speed}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {currentMove?.time && (
          <div className="text-sm text-gray-600">
            消費時間: {Math.floor(currentMove.time / 60)}分{currentMove.time % 60}秒
          </div>
        )}
      </div>
    </div>
  )
}