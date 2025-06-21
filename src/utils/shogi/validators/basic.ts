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

// バリデーション結果の型定義
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// 指定した位置に駒を打てるかチェック（下位互換性のため残す）
export function canDropPieceAt(
  board: Board,
  position: Position,
  pieceType: PieceType,
  player: Player
): boolean {
  const result = canDropPieceAtWithError(board, position, pieceType, player);
  return result.valid;
}

// 指定した位置に駒を打てるかチェック（エラーメッセージ付き）
export function canDropPieceAtWithError(
  board: Board,
  position: Position,
  pieceType: PieceType,
  player: Player
): ValidationResult {
  // 盤面内かチェック
  if (!isValidPosition(position)) {
    return { valid: false, error: '盤面の外には駒を置けません' };
  }

  // すでに駒があるならNG
  if (getPieceAt(board, position) !== null) {
    return { valid: false, error: 'すでに駒がある場所には置けません' };
  }

  // 歩兵の場合の特殊ルール
  if (pieceType === PieceType.FU) {
    // 二歩チェック
    if (hasNifu(board, position.col, player)) {
      return { valid: false, error: '二歩：同じ筋に歩を2枚置くことはできません' };
    }

    // 行き場のない歩（最奥段）チェック
    if (player === Player.SENTE && position.row === 0) {
      return { valid: false, error: '歩を1段目に置くことはできません' };
    }
    if (player === Player.GOTE && position.row === 8) {
      return { valid: false, error: '歩を9段目に置くことはできません' };
    }
    
    // 打ち歩詰めチェック
    if (isUchifuzumeSync(board, position, player)) {
      return { valid: false, error: '打ち歩詰め：この歩で相手の王を詰めることはできません' };
    }
  }

  // 香車の場合の特殊ルール（最奥段に打てない）
  if (pieceType === PieceType.KYO) {
    if (player === Player.SENTE && position.row === 0) {
      return { valid: false, error: '香車を1段目に置くことはできません' };
    }
    if (player === Player.GOTE && position.row === 8) {
      return { valid: false, error: '香車を9段目に置くことはできません' };
    }
  }

  // 桂馬の場合の特殊ルール（最奥段と2段目に打てない）
  if (pieceType === PieceType.KEI) {
    if (player === Player.SENTE && position.row <= 1) {
      return { valid: false, error: '桂馬を1・2段目に置くことはできません' };
    }
    if (player === Player.GOTE && position.row >= 7) {
      return { valid: false, error: '桂馬を8・9段目に置くことはできません' };
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

// 打ち歩詰めチェック（同期版）
export function isUchifuzumeSync(
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
  
  // 相手に合法手があるかチェック（簡略版）
  // 王の周囲8マスへの移動をチェック
  const kingPos = findKing(testBoard, opponent);
  if (!kingPos) return false;
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const newRow = kingPos.row + dr;
    const newCol = kingPos.col + dc;
    const newPos = { row: newRow, col: newCol };
    
    if (isValidPosition(newPos)) {
      const targetPiece = getPieceAt(testBoard, newPos);
      if (!targetPiece || targetPiece.player !== opponent) {
        // 王がその位置に移動できるかチェック
        const testBoard2 = testBoard.map(row => [...row]);
        testBoard2[kingPos.row][kingPos.col] = null;
        testBoard2[newRow][newCol] = { type: PieceType.OU, player: opponent };
        if (!isInCheck(testBoard2, opponent)) {
          return false; // 逃げ道があるので打ち歩詰めではない
        }
      }
    }
  }
  
  // TODO: 合い駒の判定など、より複雑な詰みの判定は将来実装
  
  return true; // 逃げ道がないので打ち歩詰め
}

// 簡易版：駒打ちが合法かチェックしてエラーメッセージを表示
export function validateDropWithAlert(
  board: Board,
  position: Position,
  pieceType: PieceType,
  player: Player
): boolean {
  const result = canDropPieceAtWithError(board, position, pieceType, player);
  if (!result.valid && result.error) {
    alert(result.error);
  }
  return result.valid;
}