import { Board, Player, PieceType, HandPieces, GameState } from '../../types/shogi'

export interface RepetitionResult {
  isRepetition: boolean
  count: number
  isPerpetualCheck?: boolean
}

export interface PositionRecord {
  count: number
  checkCount: number
}

export interface PositionHistory {
  history: Map<string, PositionRecord>
}

export function createPositionHistory(): PositionHistory {
  return {
    history: new Map()
  }
}

export function addPosition(
  positionHistory: PositionHistory,
  board: Board,
  handPieces: HandPieces,
  currentPlayer: Player,
  isInCheck: boolean = false
): void {
  const hash = hashPosition(board, handPieces, currentPlayer)
  const record = positionHistory.history.get(hash) || { count: 0, checkCount: 0 }
  
  record.count++
  if (isInCheck) {
    record.checkCount++
  }
  
  positionHistory.history.set(hash, record)
}

export function getPositionCount(
  positionHistory: PositionHistory,
  board: Board,
  handPieces: HandPieces,
  currentPlayer: Player
): number {
  const hash = hashPosition(board, handPieces, currentPlayer)
  const record = positionHistory.history.get(hash)
  return record?.count || 0
}

export function getPositionRecord(
  positionHistory: PositionHistory,
  board: Board,
  handPieces: HandPieces,
  currentPlayer: Player
): PositionRecord | undefined {
  const hash = hashPosition(board, handPieces, currentPlayer)
  return positionHistory.history.get(hash)
}

export function clearHistory(positionHistory: PositionHistory): void {
  positionHistory.history.clear()
}

export function hashPosition(
  board: Board,
  handPieces: HandPieces,
  currentPlayer: Player
): string {
  const parts: string[] = []

  // 盤面の状態
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col]
      if (piece) {
        parts.push(`${row},${col},${piece.type},${piece.player}`)
      }
    }
  }

  // 手番
  parts.push(`turn:${currentPlayer}`)

  const pieceTypes: PieceType[] = [
    PieceType.FU,
    PieceType.KYO,
    PieceType.KEI,
    PieceType.GIN,
    PieceType.KIN,
    PieceType.KAKU,
    PieceType.HI
  ]
  
  // 先手の持ち駒
  parts.push('SH:')
  for (const type of pieceTypes) {
    const count = handPieces[Player.SENTE].get(type) || 0
    if (count > 0) {
      parts.push(`${type}:${count}`)
    }
  }

  // 後手の持ち駒
  parts.push('GH:')
  for (const type of pieceTypes) {
    const count = handPieces[Player.GOTE].get(type) || 0
    if (count > 0) {
      parts.push(`${type}:${count}`)
    }
  }

  return parts.join('|')
}

export function detectRepetition(
  gameState: GameState,
  positionHistory: PositionHistory,
  isInCheck: boolean = false
): RepetitionResult {
  // 現在の局面を履歴に追加
  addPosition(
    positionHistory,
    gameState.board,
    gameState.handPieces,
    gameState.currentPlayer,
    isInCheck
  )
  
  const record = getPositionRecord(
    positionHistory,
    gameState.board,
    gameState.handPieces,
    gameState.currentPlayer
  )
  
  if (!record) {
    return { isRepetition: false, count: 0 }
  }

  const count = record.count

  // 千日手の判定（同一局面が4回出現）
  if (count >= 4) {
    // 連続王手の千日手判定
    // 4回すべてが王手状態なら連続王手の千日手
    const isPerpetualCheck = record.checkCount >= 4

    return {
      isRepetition: true,
      count,
      isPerpetualCheck
    }
  }

  return { isRepetition: false, count }
}