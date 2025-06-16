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

// マッチング関連の型定義
export interface MatchRequest {
  id: string
  playerId: string
  playerName: string
  rating?: number
  timeControl?: TimeControl
  createdAt: Date
  status: 'waiting' | 'matched' | 'cancelled'
}

export interface MatchingQueue {
  requests: MatchRequest[]
  averageWaitTime?: number
}

export interface MatchingOptions {
  mode: 'random' | 'rated' | 'friend'
  timeControl?: TimeControl
  ratingRange?: {
    min: number
    max: number
  }
  friendId?: string
}

export interface MatchFoundEvent {
  matchId: string
  roomId: string
  opponent: {
    id: string
    name: string
    rating?: number
    avatar?: string
  }
  timeControl?: TimeControl
  playerColor: Player
}

export interface GameInvite {
  id: string
  fromPlayer: {
    id: string
    name: string
    rating?: number
    avatar?: string
  }
  toPlayerId: string
  timeControl?: TimeControl
  message?: string
  createdAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}