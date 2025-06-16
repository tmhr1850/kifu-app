import { Move, PieceType } from '@/types/shogi';

// 駒の日本語名
const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.OU]: '王',
  [PieceType.HI]: '飛',
  [PieceType.KAKU]: '角',
  [PieceType.KIN]: '金',
  [PieceType.GIN]: '銀',
  [PieceType.KEI]: '桂',
  [PieceType.KYO]: '香',
  [PieceType.FU]: '歩',
  [PieceType.RYU]: '龍',
  [PieceType.UMA]: '馬',
  [PieceType.NGIN]: '成銀',
  [PieceType.NKEI]: '成桂',
  [PieceType.NKYO]: '成香',
  [PieceType.TO]: 'と',
};

/**
 * 指し手を日本語表記に変換
 */
export function formatMove(move: Move): string {
  const pieceName = PIECE_NAMES[move.piece.type];
  const toCol = 9 - move.to.col;
  const toRow = move.to.row + 1;
  
  let notation = `${toCol}${toRow}${pieceName}`;
  
  if (move.promote) {
    notation += '成';
  }
  
  if (move.captured) {
    notation = '×' + notation;
  }
  
  // 元の位置も表示（例：７六歩(７七)）
  if (move.from) {
    const fromCol = 9 - move.from.col;
    const fromRow = move.from.row + 1;
    notation += `(${fromCol}${fromRow})`;
  } else {
    notation += '打';
  }
  
  return notation;
}

/**
 * 短縮形式で指し手を表示
 */
export function formatMoveShort(move: Move): string {
  const toCol = 9 - move.to.col;
  const toRow = move.to.row + 1;
  const pieceName = PIECE_NAMES[move.piece.type];
  
  let notation = `${toCol}${toRow}${pieceName}`;
  
  if (move.promote) {
    notation += '成';
  }
  
  return notation;
}