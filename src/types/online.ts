import { GameState, Player } from './shogi'

export interface OnlinePlayer {
  id: string
  name: string
  socketId: string
  color: Player
  connected: boolean
  rating?: number
  avatar?: string
}

export interface OnlineRoom {
  id: string
  players: OnlinePlayer[]
  gameState: GameState | null
  timeControl?: TimeControl
  spectators?: string[]
  createdAt: Date
  startedAt?: Date
  endedAt?: Date
}

export interface TimeControl {
  initial: number // 初期持ち時間（秒）
  increment: number // 1手ごとの加算時間（秒）
  byoyomi?: number // 秒読み時間（秒）
  periods?: number // 秒読み回数
}

export interface TimeData {
  [Player.SENTE]: {
    remaining: number
    periods?: number
  }
  [Player.GOTE]: {
    remaining: number
    periods?: number
  }
  lastUpdate: number
}

export interface OnlineGameState extends GameState {
  roomId: string
  timeData?: TimeData
  onlineStatus: 'waiting' | 'playing' | 'paused' | 'finished'
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: Date
}

export interface GameResult {
  winner: Player | null
  reason: 'checkmate' | 'resignation' | 'timeout' | 'disconnection' | 'draw'
  finalState: GameState
}