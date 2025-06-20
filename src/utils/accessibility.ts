import { PieceType } from '@/utils/shogi/initialSetup';

// 駒の読み方マップ
const pieceReadingMap: Record<string, string> = {
  '王': 'おう',
  '玉': 'ぎょく',
  '飛': 'ひしゃ',
  '角': 'かく',
  '金': 'きん',
  '銀': 'ぎん',
  '桂': 'けい',
  '香': 'きょう',
  '歩': 'ふ',
  '竜': 'りゅう',
  '馬': 'うま',
  '全': 'なりぎん',
  '圭': 'なりけい',
  '杏': 'なりきょう',
  'と': 'ときん'
};

// 数字の漢字読みマップ
const numberKanjiMap: Record<number, string> = {
  1: 'いち',
  2: 'に',
  3: 'さん',
  4: 'よん',
  5: 'ご',
  6: 'ろく',
  7: 'なな',
  8: 'はち',
  9: 'きゅう'
};

// 段の漢字マップ
const danKanjiMap: Record<number, string> = {
  0: '一',
  1: '二',
  2: '三',
  3: '四',
  4: '五',
  5: '六',
  6: '七',
  7: '八',
  8: '九'
};

// 駒の読み方を取得
export function getPieceReading(pieceType: PieceType): string {
  return pieceReadingMap[pieceType] || pieceType;
}

// マスの位置を読み上げ用に変換（例: "7六" -> "ななろく"）
export function getSquareReading(col: number, row: number): string {
  const colReading = numberKanjiMap[9 - col] || String(9 - col);
  const rowReading = numberKanjiMap[row + 1] || String(row + 1);
  return `${colReading}${rowReading}`;
}

// マスの表記を取得（例: col=2, row=5 -> "7六"）
export function getSquareNotation(col: number, row: number): string {
  const colNum = 9 - col;
  const rowKanji = danKanjiMap[row] || String(row + 1);
  return `${colNum}${rowKanji}`;
}

// マスのARIAラベルを生成
export function getSquareAriaLabel(
  col: number,
  row: number,
  piece?: { type: PieceType; isGote: boolean } | null
): string {
  const position = getSquareNotation(col, row);
  const positionReading = getSquareReading(col, row);
  
  if (!piece) {
    return `${position} (${positionReading})`;
  }
  
  const owner = piece.isGote ? '後手' : '先手';
  const pieceReading = getPieceReading(piece.type);
  
  return `${position} (${positionReading}) ${owner}の${piece.type} (${pieceReading})`;
}

// ボタンのARIAラベルを生成
export function getButtonAriaLabel(action: string, detail?: string): string {
  if (detail) {
    return `${action}: ${detail}`;
  }
  return action;
}

// 手番の読み方を取得
export function getTurnReading(isGote: boolean): string {
  return isGote ? 'ごての番' : 'せんての番';
}

// 移動の読み上げを生成
export function getMoveAnnouncement(
  from: { row: number; col: number } | null,
  to: { row: number; col: number },
  piece: { type: PieceType; isGote: boolean },
  captured?: PieceType,
  promoted?: boolean
): string {
  const owner = piece.isGote ? '後手' : '先手';
  const pieceReading = getPieceReading(piece.type);
  const toPosition = getSquareNotation(to.col, to.row);
  const toReading = getSquareReading(to.col, to.row);
  
  let announcement = `${owner}が`;
  
  if (from) {
    const fromPosition = getSquareNotation(from.col, from.row);
    const fromReading = getSquareReading(from.col, from.row);
    announcement += `${fromPosition} (${fromReading}) から`;
  } else {
    announcement += `${piece.type} (${pieceReading}) を`;
  }
  
  announcement += ` ${toPosition} (${toReading}) へ`;
  
  if (captured) {
    const capturedReading = getPieceReading(captured);
    announcement += ` ${captured} (${capturedReading}) を取って`;
  }
  
  announcement += `移動`;
  
  if (promoted) {
    announcement += `して成りました`;
  }
  
  return announcement;
}