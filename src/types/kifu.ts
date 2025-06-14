import { BoardState, Player } from './shogi';

export interface GameInfo {
  date: string;
  startTime: string;
  endTime?: string;
  event?: string;
  site?: string;
  sente: string;
  gote: string;
  result?: GameResult;
  handicap?: string;
  timeLimit?: TimeLimit;
}

export interface TimeLimit {
  initial: number;
  byoyomi?: number;
  increment?: number;
}

export type GameResult = 
  | 'sente_win'
  | 'gote_win'
  | 'draw'
  | 'sennichite'
  | 'jishogi'
  | 'illegal_move'
  | 'time_up'
  | 'resign'
  | 'abort';

export interface KifuMove {
  from?: { row: number; col: number };
  to: { row: number; col: number };
  piece: string;
  promote?: boolean;
  player: Player;
  time?: number;
  comment?: string;
}

export interface KifuRecord {
  id: string;
  gameInfo: GameInfo;
  moves: KifuMove[];
  initialBoard?: BoardState;
  createdAt: string;
  updatedAt: string;
}

export interface KifuMetadata {
  id: string;
  gameInfo: GameInfo;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KifHeader {
  [key: string]: string;
}

export interface KifData {
  headers: KifHeader;
  moves: string[];
  comments: { [moveNumber: number]: string };
}