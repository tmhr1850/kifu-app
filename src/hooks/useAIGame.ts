'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Move, Player } from '@/types/shogi'
import { GameState } from '@/types/shogi'
import { makeMove as makeMoveLogic, createNewGame, getGameStatus } from '@/utils/shogi/game'
import { validateMoveWithAlert } from '@/utils/shogi/validators'
import { getAIEngine } from '@/utils/ai/engine'
import { AISettings, AIDifficulty, AITimeSettings } from '@/utils/ai/types'

interface UseAIGameOptions {
  playerColor: Player
  difficulty: AIDifficulty
  timeSettings: AITimeSettings
}

export function useAIGame(options: UseAIGameOptions) {
  const { playerColor, difficulty, timeSettings } = options
  const [gameState, setGameState] = useState<GameState>(createNewGame())
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [thinkingProgress, setThinkingProgress] = useState(0)
  const aiEngineRef = useRef(getAIEngine())
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // ゲームリセット
  const resetGame = useCallback(() => {
    const newGame = createNewGame()
    setGameState(newGame)
    setIsAIThinking(false)
    setThinkingProgress(0)
  }, [])

  // AI設定の作成
  const getAISettings = useCallback((): AISettings => {
    const randomnessMap = {
      [AIDifficulty.BEGINNER]: 0.3,
      [AIDifficulty.INTERMEDIATE]: 0.1,
      [AIDifficulty.ADVANCED]: 0.05
    }

    return {
      difficulty,
      timeSettings,
      randomness: randomnessMap[difficulty]
    }
  }, [difficulty, timeSettings])

  // AIの手を実行
  const makeAIMove = useCallback(async (currentState: GameState) => {
    if (currentState.currentPlayer === playerColor) return

    setIsAIThinking(true)
    setThinkingProgress(0)

    // 思考中の進捗表示（ダミー）
    const progressInterval = setInterval(() => {
      setThinkingProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    try {
      const settings = getAISettings()
      const result = await aiEngineRef.current.evaluate(currentState, settings)
      
      clearInterval(progressInterval)
      setThinkingProgress(100)

      if (result.bestMove) {
        // 少し遅延を入れて自然な感じに
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const newState = makeMoveLogic(currentState, result.bestMove)
        if (newState) {
          setGameState(newState)
        }
      }
    } catch (error) {
      console.error('AI move error:', error)
    } finally {
      clearInterval(progressInterval)
      setIsAIThinking(false)
      setThinkingProgress(0)
    }
  }, [playerColor, getAISettings])

  // プレイヤーの手を実行
  const makePlayerMove = useCallback((move: Move): boolean => {
    if (isAIThinking) return false
    if (gameState.currentPlayer !== playerColor) return false

    // エラーメッセージ付きバリデーション
    if (!validateMoveWithAlert(gameState, move)) {
      return false
    }

    const newState = makeMoveLogic(gameState, move)
    if (!newState) return false

    setGameState(newState)
    
    // ゲーム終了チェック
    const status = getGameStatus(newState)
    if (!status.isOver) {
      // AIの手番
      timeoutRef.current = setTimeout(() => makeAIMove(newState), 500)
    }

    return true
  }, [gameState, playerColor, isAIThinking, makeAIMove])

  // ゲーム開始時のAI初手とゲーム状態の変化を監視
  useEffect(() => {
    const status = getGameStatus(gameState)
    
    // ゲームが終了していない、かつAIの手番
    if (!status.isOver && gameState.currentPlayer !== playerColor && !isAIThinking) {
      timeoutRef.current = setTimeout(() => makeAIMove(gameState), 500)
    }
  }, [gameState, playerColor, isAIThinking, makeAIMove])

  // 初回のみAIが先手の場合の処理
  useEffect(() => {
    if (playerColor === Player.GOTE && gameState.moveHistory.length === 0) {
      timeoutRef.current = setTimeout(() => makeAIMove(gameState), 500)
    }
  }, [playerColor, gameState, makeAIMove])

  // クリーンアップ
  useEffect(() => {
    const aiEngine = aiEngineRef.current
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      aiEngine.cancelEvaluation()
    }
  }, [])

  // 投了
  const resign = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      resigned: true
    }))
  }, [])

  return {
    gameState,
    isAIThinking,
    thinkingProgress,
    makePlayerMove,
    resetGame,
    resign,
    playerColor,
    aiColor: playerColor === Player.SENTE ? Player.GOTE : Player.SENTE
  }
}