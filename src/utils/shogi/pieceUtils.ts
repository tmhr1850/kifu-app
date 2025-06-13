import { PieceType } from './initialSetup';

// 成り駒への変換マップ
const promotionMap: Record<string, PieceType> = {
  '歩': 'と',
  '香': '杏',
  '桂': '圭',
  '銀': '全',
  '角': '馬',
  '飛': '竜'
};

// 成り駒から元の駒への変換マップ
const demotionMap: Record<string, PieceType> = {
  'と': '歩',
  '杏': '香',
  '圭': '桂',
  '全': '銀',
  '馬': '角',
  '竜': '飛'
};

// 成れる駒かどうか判定
export function canPromotePiece(pieceType: PieceType): boolean {
  return pieceType in promotionMap;
}

// 成り駒かどうか判定
export function isPromotedPiece(pieceType: PieceType): boolean {
  return pieceType in demotionMap;
}

// 駒を成る
export function promotePiece(pieceType: PieceType): PieceType {
  return promotionMap[pieceType] || pieceType;
}

// 成り駒を元に戻す（持ち駒にする時など）
export function demotePiece(pieceType: PieceType): PieceType {
  return demotionMap[pieceType] || pieceType;
}

// 敵陣かどうか判定（先手の場合は1-3段目、後手の場合は7-9段目）
export function isEnemyTerritory(row: number, isGote: boolean): boolean {
  if (isGote) {
    return row >= 6; // 7-9段目（0-indexed）
  } else {
    return row <= 2; // 1-3段目（0-indexed）
  }
}

// 成れる位置かどうか判定（移動元または移動先が敵陣）
export function canPromoteAt(fromRow: number, toRow: number, isGote: boolean): boolean {
  return isEnemyTerritory(fromRow, isGote) || isEnemyTerritory(toRow, isGote);
}

// 強制成りかどうか判定
export function mustPromoteAt(pieceType: PieceType, toRow: number, isGote: boolean): boolean {
  // 歩と香は最奥段で強制成り
  if (pieceType === '歩' || pieceType === '香') {
    return (isGote && toRow === 8) || (!isGote && toRow === 0);
  }
  
  // 桂は最奥段と2段目で強制成り
  if (pieceType === '桂') {
    if (isGote) {
      return toRow >= 7; // 8-9段目
    } else {
      return toRow <= 1; // 1-2段目
    }
  }
  
  return false;
}

// 駒の表示名を取得（成り駒の場合は元の駒も表示）
export function getPieceDisplayName(pieceType: PieceType): string {
  return pieceType;
}