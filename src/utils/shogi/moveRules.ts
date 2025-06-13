import { PieceType, BoardPiece } from './initialSetup'

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
}

export type MoveDirection = {
  row: number
  col: number
}

const PIECE_MOVES: Record<PieceType, { moves?: MoveDirection[], range?: boolean, jumps?: MoveDirection[] }> = {
  '歩': {
    moves: [{ row: -1, col: 0 }],
  },
  '香': {
    moves: [{ row: -1, col: 0 }],
    range: true,
  },
  '桂': {
    jumps: [
      { row: -2, col: -1 },
      { row: -2, col: 1 },
    ],
  },
  '銀': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ],
  },
  '金': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
  },
  '角': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ],
    range: true,
  },
  '飛': {
    moves: [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ],
    range: true,
  },
  '王': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  '玉': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  'と': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
  },
  '杏': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
  },
  '圭': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
  },
  '全': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
  },
  '馬': {
    moves: [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ],
    range: true,
  },
  '竜': {
    moves: [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ],
    range: true,
  },
}

export function getValidMoves(
  board: (BoardPiece | null)[][],
  position: Position,
  piece: BoardPiece
): Position[] {
  const validMoves: Position[] = []
  const pieceRules = PIECE_MOVES[piece.type]
  
  if (!pieceRules) return validMoves

  const directionMultiplier = piece.isGote ? 1 : -1

  if (pieceRules.jumps) {
    for (const jump of pieceRules.jumps) {
      const newRow = position.row + (jump.row * directionMultiplier)
      const newCol = position.col + jump.col
      
      if (isValidPosition(newRow, newCol) && canMoveTo(board, piece, { row: newRow, col: newCol })) {
        validMoves.push({ row: newRow, col: newCol })
      }
    }
  }

  if (pieceRules.moves) {
    for (const move of pieceRules.moves) {
      if (pieceRules.range) {
        let newRow = position.row
        let newCol = position.col
        
        while (true) {
          newRow += move.row * (move.row !== 0 ? directionMultiplier : 1)
          newCol += move.col
          
          if (!isValidPosition(newRow, newCol)) break
          
          const targetPiece = board[newRow][newCol]
          if (targetPiece && targetPiece.isGote === piece.isGote) break
          
          validMoves.push({ row: newRow, col: newCol })
          
          if (targetPiece) break
        }
      } else {
        const newRow = position.row + (move.row * (move.row !== 0 ? directionMultiplier : 1))
        const newCol = position.col + move.col
        
        if (isValidPosition(newRow, newCol) && canMoveTo(board, piece, { row: newRow, col: newCol })) {
          validMoves.push({ row: newRow, col: newCol })
        }
      }
    }
  }

  return validMoves
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9
}

function canMoveTo(board: (BoardPiece | null)[][], piece: BoardPiece, to: Position): boolean {
  const targetPiece = board[to.row][to.col]
  return !targetPiece || targetPiece.isGote !== piece.isGote
}

export function isValidMove(
  board: (BoardPiece | null)[][],
  from: Position,
  to: Position
): boolean {
  const piece = board[from.row][from.col]
  if (!piece) return false
  
  const validMoves = getValidMoves(board, from, piece)
  return validMoves.some(move => move.row === to.row && move.col === to.col)
}