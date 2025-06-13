export type PieceType = 
  | '玉' | '飛' | '角' | '金' | '銀' | '桂' | '香' | '歩'
  | '王' | '龍' | '馬' | '全' | '成銀' | '成桂' | '成香' | 'と';

export type Player = 'sente' | 'gote';

export interface Piece {
  type: PieceType;
  owner: Player;
  promoted?: boolean;
}

export interface Position {
  row: number; // 1-9
  col: number; // 1-9
}

export interface Square {
  position: Position;
  piece?: Piece;
}

export const INITIAL_SETUP: Record<string, Piece> = {
  '1-1': { type: '香', owner: 'gote' },
  '1-2': { type: '桂', owner: 'gote' },
  '1-3': { type: '銀', owner: 'gote' },
  '1-4': { type: '金', owner: 'gote' },
  '1-5': { type: '王', owner: 'gote' },
  '1-6': { type: '金', owner: 'gote' },
  '1-7': { type: '銀', owner: 'gote' },
  '1-8': { type: '桂', owner: 'gote' },
  '1-9': { type: '香', owner: 'gote' },
  '2-2': { type: '飛', owner: 'gote' },
  '2-8': { type: '角', owner: 'gote' },
  '3-1': { type: '歩', owner: 'gote' },
  '3-2': { type: '歩', owner: 'gote' },
  '3-3': { type: '歩', owner: 'gote' },
  '3-4': { type: '歩', owner: 'gote' },
  '3-5': { type: '歩', owner: 'gote' },
  '3-6': { type: '歩', owner: 'gote' },
  '3-7': { type: '歩', owner: 'gote' },
  '3-8': { type: '歩', owner: 'gote' },
  '3-9': { type: '歩', owner: 'gote' },
  '7-1': { type: '歩', owner: 'sente' },
  '7-2': { type: '歩', owner: 'sente' },
  '7-3': { type: '歩', owner: 'sente' },
  '7-4': { type: '歩', owner: 'sente' },
  '7-5': { type: '歩', owner: 'sente' },
  '7-6': { type: '歩', owner: 'sente' },
  '7-7': { type: '歩', owner: 'sente' },
  '7-8': { type: '歩', owner: 'sente' },
  '7-9': { type: '歩', owner: 'sente' },
  '8-2': { type: '角', owner: 'sente' },
  '8-8': { type: '飛', owner: 'sente' },
  '9-1': { type: '香', owner: 'sente' },
  '9-2': { type: '桂', owner: 'sente' },
  '9-3': { type: '銀', owner: 'sente' },
  '9-4': { type: '金', owner: 'sente' },
  '9-5': { type: '玉', owner: 'sente' },
  '9-6': { type: '金', owner: 'sente' },
  '9-7': { type: '銀', owner: 'sente' },
  '9-8': { type: '桂', owner: 'sente' },
  '9-9': { type: '香', owner: 'sente' },
};

export const COL_LABELS = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];
export const ROW_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];