import { Board, Player, Position, Piece, HandPieces, PieceType } from '@/types/shogi';

// 空の盤面を作成
export function createEmptyBoard(): Board {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}

// 初期配置の盤面を作成
export function createInitialBoard(): Board {
  const board = createEmptyBoard();
  
  // 後手の駒配置
  // 1段目
  board[0][0] = { type: PieceType.KYO, player: Player.GOTE };
  board[0][1] = { type: PieceType.KEI, player: Player.GOTE };
  board[0][2] = { type: PieceType.GIN, player: Player.GOTE };
  board[0][3] = { type: PieceType.KIN, player: Player.GOTE };
  board[0][4] = { type: PieceType.OU, player: Player.GOTE };
  board[0][5] = { type: PieceType.KIN, player: Player.GOTE };
  board[0][6] = { type: PieceType.GIN, player: Player.GOTE };
  board[0][7] = { type: PieceType.KEI, player: Player.GOTE };
  board[0][8] = { type: PieceType.KYO, player: Player.GOTE };
  
  // 2段目
  board[1][1] = { type: PieceType.HI, player: Player.GOTE };
  board[1][7] = { type: PieceType.KAKU, player: Player.GOTE };
  
  // 3段目（歩兵）
  for (let i = 0; i < 9; i++) {
    board[2][i] = { type: PieceType.FU, player: Player.GOTE };
  }
  
  // 先手の駒配置
  // 7段目（歩兵）
  for (let i = 0; i < 9; i++) {
    board[6][i] = { type: PieceType.FU, player: Player.SENTE };
  }
  
  // 8段目
  board[7][1] = { type: PieceType.KAKU, player: Player.SENTE };
  board[7][7] = { type: PieceType.HI, player: Player.SENTE };
  
  // 9段目
  board[8][0] = { type: PieceType.KYO, player: Player.SENTE };
  board[8][1] = { type: PieceType.KEI, player: Player.SENTE };
  board[8][2] = { type: PieceType.GIN, player: Player.SENTE };
  board[8][3] = { type: PieceType.KIN, player: Player.SENTE };
  board[8][4] = { type: PieceType.OU, player: Player.SENTE };
  board[8][5] = { type: PieceType.KIN, player: Player.SENTE };
  board[8][6] = { type: PieceType.GIN, player: Player.SENTE };
  board[8][7] = { type: PieceType.KEI, player: Player.SENTE };
  board[8][8] = { type: PieceType.KYO, player: Player.SENTE };
  
  return board;
}

// 空の持ち駒を作成
export function createEmptyHandPieces(): HandPieces {
  return {
    [Player.SENTE]: new Map<PieceType, number>(),
    [Player.GOTE]: new Map<PieceType, number>(),
  };
}

// 位置が盤面内かチェック
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9;
}

// 位置の駒を取得
export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
}

// 位置に駒を配置
export function setPieceAt(board: Board, pos: Position, piece: Piece | null): void {
  if (isValidPosition(pos)) {
    board[pos.row][pos.col] = piece;
  }
}

// 相手プレイヤーを取得
export function getOpponentPlayer(player: Player): Player {
  return player === Player.SENTE ? Player.GOTE : Player.SENTE;
}

// 駒を成る
export function promotePiece(piece: Piece): Piece {
  const promotionMap: Partial<Record<PieceType, PieceType>> = {
    [PieceType.FU]: PieceType.TO,
    [PieceType.KYO]: PieceType.NKYO,
    [PieceType.KEI]: PieceType.NKEI,
    [PieceType.GIN]: PieceType.NGIN,
    [PieceType.KAKU]: PieceType.UMA,
    [PieceType.HI]: PieceType.RYU,
  };
  
  const promotedType = promotionMap[piece.type];
  if (!promotedType) return piece;
  
  return {
    ...piece,
    type: promotedType,
    promoted: true,
  };
}

// 成れる駒かチェック
export function canPromote(piece: Piece): boolean {
  const promotablePieces = [
    PieceType.FU,
    PieceType.KYO,
    PieceType.KEI,
    PieceType.GIN,
    PieceType.KAKU,
    PieceType.HI,
  ];
  
  return promotablePieces.includes(piece.type) && !piece.promoted;
}

// 成らなければならない位置かチェック
export function mustPromote(piece: Piece, to: Position): boolean {
  const player = piece.player;
  const row = to.row;
  
  // 先手の場合
  if (player === Player.SENTE) {
    switch (piece.type) {
      case PieceType.FU:
      case PieceType.KYO:
        return row === 0;
      case PieceType.KEI:
        return row <= 1;
      default:
        return false;
    }
  }
  
  // 後手の場合
  else {
    switch (piece.type) {
      case PieceType.FU:
      case PieceType.KYO:
        return row === 8;
      case PieceType.KEI:
        return row >= 7;
      default:
        return false;
    }
  }
}

// 成れる位置かチェック（敵陣の1-3段目）
export function canPromoteAt(player: Player, from: Position, to: Position): boolean {
  if (player === Player.SENTE) {
    return from.row <= 2 || to.row <= 2;
  } else {
    return from.row >= 6 || to.row >= 6;
  }
}

// 盤面をコピー
export function copyBoard(board: Board): Board {
  return board.map(row => [...row]);
}

// 持ち駒をコピー
export function copyHandPieces(handPieces: HandPieces): HandPieces {
  return {
    [Player.SENTE]: new Map(handPieces[Player.SENTE]),
    [Player.GOTE]: new Map(handPieces[Player.GOTE]),
  };
}

// 持ち駒を追加
export function addToHand(handPieces: HandPieces, player: Player, pieceType: PieceType): void {
  const count = handPieces[player].get(pieceType) || 0;
  handPieces[player].set(pieceType, count + 1);
}

// 持ち駒を使用
export function removeFromHand(handPieces: HandPieces, player: Player, pieceType: PieceType): boolean {
  const count = handPieces[player].get(pieceType) || 0;
  if (count === 0) return false;
  
  if (count === 1) {
    handPieces[player].delete(pieceType);
  } else {
    handPieces[player].set(pieceType, count - 1);
  }
  
  return true;
}

// 成り駒を元の駒に戻す（持ち駒になる時用）
export function unpromoteForHand(pieceType: PieceType): PieceType {
  const unpromoteMap: Partial<Record<PieceType, PieceType>> = {
    [PieceType.TO]: PieceType.FU,
    [PieceType.NKYO]: PieceType.KYO,
    [PieceType.NKEI]: PieceType.KEI,
    [PieceType.NGIN]: PieceType.GIN,
    [PieceType.UMA]: PieceType.KAKU,
    [PieceType.RYU]: PieceType.HI,
  };
  
  return unpromoteMap[pieceType] || pieceType;
}