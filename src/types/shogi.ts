export type PieceType = 
  | '王' | '玉' | '飛' | '竜' | '角' | '馬' 
  | '金' | '銀' | '成銀' | '桂' | '成桂' 
  | '香' | '成香' | '歩' | 'と';

export type Player = 'sente' | 'gote';

export interface Piece {
  type: PieceType;
  player: Player;
  promoted?: boolean;
}

export interface Square {
  piece?: Piece;
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

export const INITIAL_BOARD: Board = [
  [
    { type: '香', player: 'gote' }, 
    { type: '桂', player: 'gote' }, 
    { type: '銀', player: 'gote' }, 
    { type: '金', player: 'gote' }, 
    { type: '玉', player: 'gote' }, 
    { type: '金', player: 'gote' }, 
    { type: '銀', player: 'gote' }, 
    { type: '桂', player: 'gote' }, 
    { type: '香', player: 'gote' }
  ],
  [
    null, 
    { type: '飛', player: 'gote' }, 
    null, 
    null, 
    null, 
    null, 
    null, 
    { type: '角', player: 'gote' }, 
    null
  ],
  [
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }, 
    { type: '歩', player: 'gote' }
  ],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }, 
    { type: '歩', player: 'sente' }
  ],
  [
    null, 
    { type: '角', player: 'sente' }, 
    null, 
    null, 
    null, 
    null, 
    null, 
    { type: '飛', player: 'sente' }, 
    null
  ],
  [
    { type: '香', player: 'sente' }, 
    { type: '桂', player: 'sente' }, 
    { type: '銀', player: 'sente' }, 
    { type: '金', player: 'sente' }, 
    { type: '王', player: 'sente' }, 
    { type: '金', player: 'sente' }, 
    { type: '銀', player: 'sente' }, 
    { type: '桂', player: 'sente' }, 
    { type: '香', player: 'sente' }
  ]
];

export const COLUMN_LABELS = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];
export const ROW_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];