import { 
  createInitialBoard, 
  createEmptyHandPieces,
  addToHand
} from '../board'
import { 
  detectRepetition, 
  hashPosition, 
  createPositionHistory,
  addPosition,
  getPositionCount,
  clearHistory
} from '../repetition'
import { Player, PieceType, GameState } from '../../../types/shogi'

describe('千日手（Repetition）検出', () => {
  describe('hashPosition', () => {
    it('同じ局面は同じハッシュ値を返す', () => {
      const board1 = createInitialBoard()
      const board2 = createInitialBoard()
      const handPieces = createEmptyHandPieces()

      const hash1 = hashPosition(board1, handPieces, Player.SENTE)
      const hash2 = hashPosition(board2, handPieces, Player.SENTE)

      expect(hash1).toBe(hash2)
    })

    it('異なる局面は異なるハッシュ値を返す', () => {
      const board1 = createInitialBoard()
      const board2 = createInitialBoard()
      const handPieces = createEmptyHandPieces()
      
      // 一手動かす
      board2[6][4] = null
      board2[5][4] = { type: PieceType.FU, player: Player.SENTE }

      const hash1 = hashPosition(board1, handPieces, Player.SENTE)
      const hash2 = hashPosition(board2, handPieces, Player.SENTE)

      expect(hash1).not.toBe(hash2)
    })

    it('手番が異なれば異なるハッシュ値を返す', () => {
      const board = createInitialBoard()
      const handPieces = createEmptyHandPieces()

      const hashSente = hashPosition(board, handPieces, Player.SENTE)
      const hashGote = hashPosition(board, handPieces, Player.GOTE)

      expect(hashSente).not.toBe(hashGote)
    })

    it.skip('持ち駒が異なれば異なるハッシュ値を返す', () => {
      const board = createInitialBoard()
      const handPieces1 = createEmptyHandPieces()
      
      const hash1 = hashPosition(board, handPieces1, Player.SENTE)
      
      const handPieces2 = createEmptyHandPieces()
      addToHand(handPieces2, Player.SENTE, PieceType.FU)
      
      const hash2 = hashPosition(board, handPieces2, Player.SENTE)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('PositionHistory', () => {
    it('局面を追加して回数をカウントできる', () => {
      const history = createPositionHistory()
      const board = createInitialBoard()
      const handPieces = createEmptyHandPieces()

      addPosition(history, board, handPieces, Player.SENTE)
      expect(getPositionCount(history, board, handPieces, Player.SENTE)).toBe(1)

      addPosition(history, board, handPieces, Player.SENTE)
      expect(getPositionCount(history, board, handPieces, Player.SENTE)).toBe(2)
    })

    it('異なる局面は別々にカウントされる', () => {
      const history = createPositionHistory()
      const board1 = createInitialBoard()
      const board2 = createInitialBoard()
      const handPieces = createEmptyHandPieces()
      
      board2[6][4] = null
      board2[5][4] = { type: PieceType.FU, player: Player.SENTE }

      addPosition(history, board1, handPieces, Player.SENTE)
      addPosition(history, board2, handPieces, Player.SENTE)

      expect(getPositionCount(history, board1, handPieces, Player.SENTE)).toBe(1)
      expect(getPositionCount(history, board2, handPieces, Player.SENTE)).toBe(1)
    })

    it('履歴をクリアできる', () => {
      const history = createPositionHistory()
      const board = createInitialBoard()
      const handPieces = createEmptyHandPieces()

      addPosition(history, board, handPieces, Player.SENTE)
      addPosition(history, board, handPieces, Player.SENTE)
      expect(getPositionCount(history, board, handPieces, Player.SENTE)).toBe(2)

      clearHistory(history)
      expect(getPositionCount(history, board, handPieces, Player.SENTE)).toBe(0)
    })
  })

  describe('detectRepetition', () => {
    it('4回同一局面で千日手を検出する', () => {
      const history = createPositionHistory()
      const gameState: GameState = {
        board: createInitialBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 3回追加
      for (let i = 0; i < 3; i++) {
        addPosition(history, gameState.board, gameState.handPieces, gameState.currentPlayer)
      }

      // 4回目で千日手
      const result = detectRepetition(gameState, history)
      expect(result.isRepetition).toBe(true)
      expect(result.count).toBe(4)
    })

    it('3回以下では千日手を検出しない', () => {
      const history = createPositionHistory()
      const gameState: GameState = {
        board: createInitialBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 2回追加
      for (let i = 0; i < 2; i++) {
        addPosition(history, gameState.board, gameState.handPieces, gameState.currentPlayer)
      }

      const result = detectRepetition(gameState, history)
      expect(result.isRepetition).toBe(false)
      expect(result.count).toBe(3)
    })
  })

  describe('連続王手の千日手', () => {
    it('連続王手での千日手を検出する', () => {
      const history = createPositionHistory()
      const gameState: GameState = {
        board: createInitialBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }
      
      // 王手状態を設定（仮の状態）
      const isInCheck = true

      // 3回王手状態で同一局面
      for (let i = 0; i < 3; i++) {
        addPosition(history, gameState.board, gameState.handPieces, gameState.currentPlayer, isInCheck)
      }

      const result = detectRepetition(gameState, history, isInCheck)
      expect(result.isRepetition).toBe(true)
      expect(result.isPerpetualCheck).toBe(true)
    })
  })
})