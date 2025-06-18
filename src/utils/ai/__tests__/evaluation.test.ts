import { evaluatePosition } from '../evaluation'
import { createNewGame, makeMove } from '@/utils/shogi/game'
import { Player, PieceType } from '@/types/shogi'

describe('AI Evaluation Function', () => {
  it('should evaluate initial position as roughly equal', () => {
    const gameState = createNewGame()
    const score = evaluatePosition(gameState)
    
    // 初期局面はほぼ互角（わずかに先手有利）
    expect(score).toBeGreaterThan(-100)
    expect(score).toBeLessThan(100)
  })

  it('should give positive score when Sente has material advantage', () => {
    const gameState = createNewGame()
    
    // 後手の飛車を取る（実際の合法手ではないが、評価関数のテスト用）
    gameState.board[1][1] = null // 後手の飛車を削除
    gameState.handPieces[Player.SENTE].set(PieceType.HI, 1) // 先手の持ち駒に追加
    
    const score = evaluatePosition(gameState)
    expect(score).toBeGreaterThan(500) // 飛車の価値分以上有利
  })

  it('should give negative score when Gote has material advantage', () => {
    const gameState = createNewGame()
    
    // 先手の飛車を取る
    gameState.board[7][7] = null // 先手の飛車を削除
    gameState.handPieces[Player.GOTE].set(PieceType.HI, 1) // 後手の持ち駒に追加
    
    const score = evaluatePosition(gameState)
    expect(score).toBeLessThan(-500) // 飛車の価値分以上不利
  })

  it('should value promoted pieces higher than unpromoted', () => {
    const gameState = createNewGame()
    
    // 先手の飛車を龍に成る
    const rook = gameState.board[7][7]
    if (rook) {
      gameState.board[7][7] = {
        type: PieceType.RYU,
        player: Player.SENTE
      }
    }
    
    const scoreWithRyu = evaluatePosition(gameState)
    
    // 龍を飛車に戻す
    gameState.board[7][7] = {
      type: PieceType.HI,
      player: Player.SENTE
    }
    
    const scoreWithHi = evaluatePosition(gameState)
    
    expect(scoreWithRyu).toBeGreaterThan(scoreWithHi)
  })

  it('should value piece positions appropriately', () => {
    const gameState = createNewGame()
    
    // 歩を前進させる
    const move1 = {
      from: { row: 6, col: 4 },
      to: { row: 5, col: 4 },
      piece: { type: PieceType.FU, player: Player.SENTE }
    }
    
    const newState = makeMove(gameState, move1)
    if (newState) {
      const scoreAfterMove = evaluatePosition(newState)
      const scoreBeforeMove = evaluatePosition(gameState)
      
      // 評価値が変化していることを確認（手番が変わるので符号が反転する可能性がある）
      expect(Math.abs(scoreAfterMove - scoreBeforeMove)).toBeGreaterThan(0)
    }
  })

  it('should value king safety', () => {
    const gameState = createNewGame()
    
    // 王の周りの守備駒を評価
    // 初期配置では王の周りに金銀が配置されているので、それなりの防御力がある
    const score = evaluatePosition(gameState)
    
    // 王の前の歩を除去（実際にはできないが、テスト用）
    gameState.board[6][4] = null
    
    const scoreWithWeakerDefense = evaluatePosition(gameState)
    
    // 王の防御が弱くなると評価が下がる
    expect(score).toBeGreaterThan(scoreWithWeakerDefense)
  })
})