export type PieceType = '王' | '玉' | '飛' | '角' | '金' | '銀' | '桂' | '香' | '歩'

export interface BoardPiece {
  type: PieceType
  isGote: boolean
}

export function getInitialBoard(): (BoardPiece | null)[][] {
  const board: (BoardPiece | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null))

  // 後手の配置（一段目）
  board[0][0] = { type: '香', isGote: true }
  board[0][1] = { type: '桂', isGote: true }
  board[0][2] = { type: '銀', isGote: true }
  board[0][3] = { type: '金', isGote: true }
  board[0][4] = { type: '玉', isGote: true }
  board[0][5] = { type: '金', isGote: true }
  board[0][6] = { type: '銀', isGote: true }
  board[0][7] = { type: '桂', isGote: true }
  board[0][8] = { type: '香', isGote: true }

  // 後手の配置（二段目）
  board[1][1] = { type: '角', isGote: true }
  board[1][7] = { type: '飛', isGote: true }

  // 後手の歩兵（三段目）
  for (let col = 0; col < 9; col++) {
    board[2][col] = { type: '歩', isGote: true }
  }

  // 先手の歩兵（七段目）
  for (let col = 0; col < 9; col++) {
    board[6][col] = { type: '歩', isGote: false }
  }

  // 先手の配置（八段目）
  board[7][1] = { type: '飛', isGote: false }
  board[7][7] = { type: '角', isGote: false }

  // 先手の配置（九段目）
  board[8][0] = { type: '香', isGote: false }
  board[8][1] = { type: '桂', isGote: false }
  board[8][2] = { type: '銀', isGote: false }
  board[8][3] = { type: '金', isGote: false }
  board[8][4] = { type: '王', isGote: false }
  board[8][5] = { type: '金', isGote: false }
  board[8][6] = { type: '銀', isGote: false }
  board[8][7] = { type: '桂', isGote: false }
  board[8][8] = { type: '香', isGote: false }

  return board
}