import { getValidMoves, isValidMove } from './moveRules'
import { BoardPiece } from './initialSetup'

describe('moveRules', () => {
  const createEmptyBoard = () => Array(9).fill(null).map(() => Array(9).fill(null))

  describe('getValidMoves', () => {
    it('should return valid moves for pawn (歩)', () => {
      const board = createEmptyBoard()
      const pawn: BoardPiece = { type: '歩', isGote: false }
      board[6][4] = pawn

      const moves = getValidMoves(board, { row: 6, col: 4 }, pawn)
      
      expect(moves).toHaveLength(1)
      expect(moves).toContainEqual({ row: 5, col: 4 })
    })

    it('should return valid moves for gote pawn', () => {
      const board = createEmptyBoard()
      const pawn: BoardPiece = { type: '歩', isGote: true }
      board[2][4] = pawn

      const moves = getValidMoves(board, { row: 2, col: 4 }, pawn)
      
      expect(moves).toHaveLength(1)
      expect(moves).toContainEqual({ row: 3, col: 4 })
    })

    it('should return valid moves for lance (香)', () => {
      const board = createEmptyBoard()
      const lance: BoardPiece = { type: '香', isGote: false }
      board[8][0] = lance

      const moves = getValidMoves(board, { row: 8, col: 0 }, lance)
      
      expect(moves).toHaveLength(8)
      expect(moves).toContainEqual({ row: 0, col: 0 })
      expect(moves).toContainEqual({ row: 7, col: 0 })
    })

    it('should return valid moves for knight (桂)', () => {
      const board = createEmptyBoard()
      const knight: BoardPiece = { type: '桂', isGote: false }
      board[8][1] = knight

      const moves = getValidMoves(board, { row: 8, col: 1 }, knight)
      
      expect(moves).toHaveLength(2)
      expect(moves).toContainEqual({ row: 6, col: 0 })
      expect(moves).toContainEqual({ row: 6, col: 2 })
    })

    it('should return valid moves for king (王)', () => {
      const board = createEmptyBoard()
      const king: BoardPiece = { type: '王', isGote: false }
      board[4][4] = king

      const moves = getValidMoves(board, { row: 4, col: 4 }, king)
      
      expect(moves).toHaveLength(8)
      expect(moves).toContainEqual({ row: 3, col: 3 })
      expect(moves).toContainEqual({ row: 3, col: 4 })
      expect(moves).toContainEqual({ row: 3, col: 5 })
      expect(moves).toContainEqual({ row: 4, col: 3 })
      expect(moves).toContainEqual({ row: 4, col: 5 })
      expect(moves).toContainEqual({ row: 5, col: 3 })
      expect(moves).toContainEqual({ row: 5, col: 4 })
      expect(moves).toContainEqual({ row: 5, col: 5 })
    })

    it('should block moves when friendly piece is in the way', () => {
      const board = createEmptyBoard()
      const rook: BoardPiece = { type: '飛', isGote: false }
      const pawn: BoardPiece = { type: '歩', isGote: false }
      board[7][7] = rook
      board[6][7] = pawn

      const moves = getValidMoves(board, { row: 7, col: 7 }, rook)
      
      expect(moves).not.toContainEqual({ row: 6, col: 7 })
      expect(moves).not.toContainEqual({ row: 5, col: 7 })
    })

    it('should allow capturing enemy pieces', () => {
      const board = createEmptyBoard()
      const rook: BoardPiece = { type: '飛', isGote: false }
      const enemyPawn: BoardPiece = { type: '歩', isGote: true }
      board[7][7] = rook
      board[6][7] = enemyPawn

      const moves = getValidMoves(board, { row: 7, col: 7 }, rook)
      
      expect(moves).toContainEqual({ row: 6, col: 7 })
      expect(moves).not.toContainEqual({ row: 5, col: 7 })
    })
  })

  describe('isValidMove', () => {
    it('should return true for valid moves', () => {
      const board = createEmptyBoard()
      const pawn: BoardPiece = { type: '歩', isGote: false }
      board[6][4] = pawn

      const result = isValidMove(board, { row: 6, col: 4 }, { row: 5, col: 4 })
      
      expect(result).toBe(true)
    })

    it('should return false for invalid moves', () => {
      const board = createEmptyBoard()
      const pawn: BoardPiece = { type: '歩', isGote: false }
      board[6][4] = pawn

      const result = isValidMove(board, { row: 6, col: 4 }, { row: 4, col: 4 })
      
      expect(result).toBe(false)
    })

    it('should return false when no piece at position', () => {
      const board = createEmptyBoard()

      const result = isValidMove(board, { row: 6, col: 4 }, { row: 5, col: 4 })
      
      expect(result).toBe(false)
    })
  })
})