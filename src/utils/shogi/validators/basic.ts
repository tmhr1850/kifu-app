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

// 指定した位置に駒を打てるかチェック
export function canDropPieceAt(
  board: Board,
  position: Position,
  pieceType: PieceType,
  player: Player
): boolean {
  // 盤面内かチェック
  if (!isValidPosition(position)) return false;

  // すでに駒があるならNG
  if (getPieceAt(board, position) !== null) return false;

  // 歩兵の場合の特殊ルール
  if (pieceType === PieceType.FU) {
    // 二歩チェック
    if (hasNifu(board, position.col, player)) return false;

    // 行き場のない歩（最奥段）チェック
    if (player === Player.SENTE && position.row === 0) return false;
    if (player === Player.GOTE && position.row === 8) return false;
    
    // 打ち歩詰めチェック（後で実装）
    // TODO: 打ち歩詰めチェック
  }

  // 香車の場合の特殊ルール（最奥段に打てない）
  if (pieceType === PieceType.KYO) {
    if (player === Player.SENTE && position.row === 0) return false;
    if (player === Player.GOTE && position.row === 8) return false;
  }

  // 桂馬の場合の特殊ルール（最奥段と2段目に打てない）
  if (pieceType === PieceType.KEI) {
    if (player === Player.SENTE && position.row <= 1) return false;
    if (player === Player.GOTE && position.row >= 7) return false;
  }

  return true;
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