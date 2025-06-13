// 将棋の駒の種類
export enum PieceType {
  // 通常の駒
  FU = 'FU',      // 歩兵
  KYO = 'KYO',    // 香車
  KEI = 'KEI',    // 桂馬
  GIN = 'GIN',    // 銀将
  KIN = 'KIN',    // 金将
  KAKU = 'KAKU',  // 角行
  HI = 'HI',      // 飛車
  OU = 'OU',      // 王将（玉将）
  
  // 成り駒
  TO = 'TO',      // と金
  NKYO = 'NKYO',  // 成香
  NKEI = 'NKEI',  // 成桂
  NGIN = 'NGIN',  // 成銀
  UMA = 'UMA',    // 龍馬（成角）
  RYU = 'RYU',    // 龍王（成飛）
}

// プレイヤー
export enum Player {
  SENTE = 'SENTE',   // 先手
  GOTE = 'GOTE',     // 後手
}

// 駒の状態
export interface Piece {
  type: PieceType;
  player: Player;
  promoted?: boolean;
}

// 盤面の座標（1-9の範囲）
export interface Position {
  row: number;  // 段（1-9）
  col: number;  // 筋（1-9）
}

// 盤面の状態（9x9）
export type Board = (Piece | null)[][];

// 持ち駒
export interface HandPieces {
  [Player.SENTE]: Map<PieceType, number>;
  [Player.GOTE]: Map<PieceType, number>;
}

// 移動
export interface Move {
  from: Position | null;  // null の場合は持ち駒を打つ
  to: Position;
  piece: Piece;
  promote?: boolean;      // 成るかどうか
  captured?: Piece;       // 取った駒
}

// 局面の状態
export interface GameState {
  board: Board;
  handPieces: HandPieces;
  currentPlayer: Player;
  moveHistory: Move[];
}

// 移動可能な位置のリスト
export type ValidMoves = Position[];

// 駒の移動パターン
export interface MovePattern {
  dx: number;  // 横方向の移動量
  dy: number;  // 縦方向の移動量
  repeat?: boolean;  // 何マスでも移動可能か（飛車・角など）
}