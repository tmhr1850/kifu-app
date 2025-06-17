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
  disambiguation?: string;
}

// Variation tree node structure
export interface VariationNode {
  id: string; // Unique identifier for this node
  move: KifuMove | null; // null for root node
  moveNumber: number; // Move number in the game (0 for root)
  children: VariationNode[]; // Child variations
  parentId: string | null; // Parent node ID (null for root)
  isMainLine: boolean; // Whether this is part of the main line
  comment?: string; // Additional comments for this variation
}

// Path through the variation tree
export type VariationPath = string[]; // Array of node IDs from root to current position

// Extended kifu record with variation support
export interface KifuRecordWithVariations {
  id: string;
  gameInfo: GameInfo;
  variationTree: VariationNode; // Root node of the variation tree
  currentPath: VariationPath; // Current active path through variations
  initialBoard?: BoardState;
  createdAt: string;
  updatedAt: string;
}

export interface KifuRecord {
  id: string;
  gameInfo: GameInfo;
  moves: KifuMove[];
  initialBoard?: BoardState;
  createdAt: string;
  updatedAt: string;
  // Optional variation support for backward compatibility
  variationTree?: VariationNode;
  currentPath?: VariationPath;
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