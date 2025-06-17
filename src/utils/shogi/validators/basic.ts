import {
  Board,
  Position,
  Player,
  PieceType,
} from '@/types/shogi';
import {
  getPieceAt,
  isValidPosition,
  getOpponentPlayer,
} from '../board';

// バリデーション結果を表す型
export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
}

// 指定した位置に駒を打てるかチェック
export function canDropPieceAt(
  board: Board,
  position: Position,
  pieceType: PieceType,
  player: Player
): ValidationResult {
  // 盤面内かチェック
  if (!isValidPosition(position)) {
    return { valid: false, errorMessage: '盤面外には駒を置けません' };
  }

  // すでに駒があるならNG
  if (getPieceAt(board, position) !== null) {
    return { valid: false, errorMessage: 'すでに駒がある場所には置けません' };
  }

  // 歩兵の場合の特殊ルール
  if (pieceType === PieceType.FU) {
    // 二歩チェック
    if (hasNifu(board, position.col, player)) {
      return { valid: false, errorMessage: '二歩：同じ筋に歩を２つ置くことはできません' };
    }

    // 行き場のない歩（最奥段）チェック
    if (player === Player.SENTE && position.row === 0) {
      return { valid: false, errorMessage: '歩を１段目に打つことはできません' };
    }
    if (player === Player.GOTE && position.row === 8) {
      return { valid: false, errorMessage: '歩を９段目に打つことはできません' };
    }
    
    // 打ち歩詰めチェック
    if (isUchifuzumeCheck(board, position, player)) {
      return { valid: false, errorMessage: '打ち歩詰め：相手玉を詰ませる歩は打てません' };
    }
  }

  // 香車の場合の特殊ルール（最奥段に打てない）
  if (pieceType === PieceType.KYO) {
    if (player === Player.SENTE && position.row === 0) {
      return { valid: false, errorMessage: '香車を１段目に打つことはできません' };
    }
    if (player === Player.GOTE && position.row === 8) {
      return { valid: false, errorMessage: '香車を９段目に打つことはできません' };
    }
  }

  // 桂馬の場合の特殊ルール（最奥段と2段目に打てない）
  if (pieceType === PieceType.KEI) {
    if (player === Player.SENTE && position.row <= 1) {
      return { valid: false, errorMessage: '桂馬を１段目・２段目に打つことはできません' };
    }
    if (player === Player.GOTE && position.row >= 7) {
      return { valid: false, errorMessage: '桂馬を８段目・９段目に打つことはできません' };
    }
  }

  return { valid: true };
}

// 二歩チェック（同じ筋に歩があるか）
export function hasNifu(board: Board, col: number, player: Player): boolean {
  for (let row = 0; row < 9; row++) {
    const piece = board[row][col];
    if (piece && piece.type === PieceType.FU && piece.player === player) {
      return true;
    }
  }
  return false;
}

// 王手判定
export function isInCheck(board: Board, player: Player): boolean {
  // 王の位置を探す
  const kingPosition = findKing(board, player);
  if (!kingPosition) return false;

  // 相手の全ての駒から王に到達可能かチェック
  const opponent = getOpponentPlayer(player);
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.player === opponent) {
        const validMoves = getPieceValidMovesImport(
          piece.type,
          board,
          { row, col },
          opponent
        );
        
        // 王の位置が移動可能な位置に含まれていれば王手
        if (validMoves.some(pos => 
          pos.row === kingPosition.row && pos.col === kingPosition.col
        )) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 王の位置を探す
export function findKing(board: Board, player: Player): Position | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PieceType.OU && piece.player === player) {
        return { row, col };
      }
    }
  }
  return null;
}

// 王手放置チェック（仮実装）
export function wouldBeInCheck(
  board: Board,
  from: Position | null,
  to: Position,
  player: Player,
  pieceType?: PieceType
): boolean {
  // 王がいなければチェックしない
  if (!findKing(board, player)) return false;
  
  // 盤面をコピー
  const testBoard = board.map(row => [...row]);
  
  if (from) {
    // 通常の移動
    const piece = getPieceAt(testBoard, from);
    if (!piece) return false;
    
    testBoard[from.row][from.col] = null;
    testBoard[to.row][to.col] = piece;
  } else if (pieceType) {
    // 持ち駒を打つ
    testBoard[to.row][to.col] = { type: pieceType, player };
  }
  
  // 移動後に王手になっているかチェック
  return isInCheck(testBoard, player);
}

// getPieceValidMovesをインポート（循環参照を避けるため）
import { getPieceValidMoves as getPieceValidMovesImport } from '../pieces';

// 行き所のない駒のチェック（移動時）
export function checkImmovablePiece(
  pieceType: PieceType,
  to: Position,
  player: Player
): ValidationResult {
  // 歩・香車・桂馬の場合のみチェック
  switch (pieceType) {
    case PieceType.FU:
    case PieceType.KYO:
      if (player === Player.SENTE && to.row === 0) {
        return { valid: false, errorMessage: `${pieceType === PieceType.FU ? '歩' : '香車'}を１段目に進めることはできません` };
      }
      if (player === Player.GOTE && to.row === 8) {
        return { valid: false, errorMessage: `${pieceType === PieceType.FU ? '歩' : '香車'}を９段目に進めることはできません` };
      }
      break;
    case PieceType.KEI:
      if (player === Player.SENTE && to.row <= 1) {
        return { valid: false, errorMessage: '桂馬を１段目・２段目に進めることはできません' };
      }
      if (player === Player.GOTE && to.row >= 7) {
        return { valid: false, errorMessage: '桂馬を８段目・９段目に進めることはできません' };
      }
      break;
  }
  
  return { valid: true };
}

// 打ち歩詰めチェック（同期版）
export function isUchifuzumeCheck(
  board: Board,
  dropPosition: Position,
  player: Player
): boolean {
  // 仮の盤面を作成
  const testBoard = board.map(row => [...row]);
  testBoard[dropPosition.row][dropPosition.col] = { type: PieceType.FU, player };
  
  // 相手プレイヤーを取得
  const opponent = getOpponentPlayer(player);
  
  // 相手が王手になっているかチェック
  if (!isInCheck(testBoard, opponent)) return false;
  
  // 相手玉の位置を探す
  const kingPosition = findKing(testBoard, opponent);
  if (!kingPosition) return false;
  
  // 王が逃げられるかチェック
  const kingMoves = getPieceValidMovesImport(
    PieceType.OU,
    testBoard,
    kingPosition,
    opponent
  );
  
  // 各移動先で王手が回避できるかチェック
  for (const move of kingMoves) {
    const testBoard2 = testBoard.map(row => [...row]);
    testBoard2[kingPosition.row][kingPosition.col] = null;
    testBoard2[move.row][move.col] = { type: PieceType.OU, player: opponent };
    
    if (!isInCheck(testBoard2, opponent)) {
      return false; // 逃げ場所がある
    }
  }
  
  // 歩を取れるかチェック
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = testBoard[row][col];
      if (piece && piece.player === opponent && piece.type !== PieceType.OU) {
        const moves = getPieceValidMovesImport(piece.type, testBoard, { row, col }, opponent);
        // 打った歩の位置が移動可能な場所にあり、王手が回避できるか確認
        for (const move of moves) {
          if (move.row === dropPosition.row && move.col === dropPosition.col) {
            // その駒で歩を取った後の盤面を作成
            const testBoard3 = testBoard.map(row => [...row]);
            testBoard3[row][col] = null;
            testBoard3[dropPosition.row][dropPosition.col] = piece;
            
            if (!isInCheck(testBoard3, opponent)) {
              return false; // 歩を取って王手を回避できる
            }
          }
        }
      }
    }
  }
  
  // TODO: 合い駒ができるかのチェックも本来は必要
  
  return true; // 打ち歩詰め
}