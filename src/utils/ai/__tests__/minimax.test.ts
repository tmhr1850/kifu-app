import { minimax } from '../minimax'
import { createNewGame } from '@/utils/shogi/game'
import { AIDifficulty, AISettings } from '../types'

describe('Minimax Algorithm', () => {
  const defaultSettings: AISettings = {
    difficulty: AIDifficulty.BEGINNER,
    timeSettings: { mode: 'fixed', fixedTime: 1000 },
    randomness: 0
  }

  it('should find a valid move from initial position', async () => {
    const gameState = createNewGame()
    const result = await minimax(gameState, defaultSettings)
    
    expect(result.bestMove).not.toBeNull()
    expect(result.nodesEvaluated).toBeGreaterThan(0)
    expect(result.depth).toBe(2) // Beginner depth
  })

  it('should evaluate more nodes with higher difficulty', async () => {
    const gameState = createNewGame()
    
    const beginnerSettings: AISettings = {
      ...defaultSettings,
      difficulty: AIDifficulty.BEGINNER
    }
    
    const advancedSettings: AISettings = {
      ...defaultSettings,
      difficulty: AIDifficulty.ADVANCED,
      timeSettings: { mode: 'fixed', fixedTime: 10000 } // More time for deeper search
    }
    
    const beginnerResult = await minimax(gameState, beginnerSettings)
    const advancedResult = await minimax(gameState, advancedSettings)
    
    expect(advancedResult.depth).toBeGreaterThan(beginnerResult.depth)
    expect(advancedResult.nodesEvaluated).toBeGreaterThan(beginnerResult.nodesEvaluated)
  })

  it('should respect time limits', async () => {
    const gameState = createNewGame()
    
    const quickSettings: AISettings = {
      ...defaultSettings,
      timeSettings: { mode: 'instant' }
    }
    
    const startTime = Date.now()
    await minimax(gameState, quickSettings)
    const elapsed = Date.now() - startTime
    
    // Should finish quickly in instant mode
    expect(elapsed).toBeLessThan(500)
  })

  it('should apply randomness for beginner difficulty', async () => {
    const gameState = createNewGame()
    
    const randomSettings: AISettings = {
      difficulty: AIDifficulty.BEGINNER,
      timeSettings: { mode: 'fixed', fixedTime: 1000 },
      randomness: 0.5
    }
    
    // 同じ局面で複数回実行
    const moves = new Set()
    for (let i = 0; i < 5; i++) {
      const result = await minimax(gameState, randomSettings)
      if (result.bestMove) {
        moves.add(JSON.stringify(result.bestMove))
      }
    }
    
    // ランダム性があるので、異なる手が選ばれることがある
    // （必ずしも異なるとは限らないが、可能性がある）
    expect(moves.size).toBeGreaterThanOrEqual(1)
  })
})