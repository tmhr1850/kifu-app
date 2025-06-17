import {
  Board,
  Position,
  Player,
  Move,
  GameState,
  PieceType,
  HandPieces,
} from '@/types/shogi';
import {
  getPieceAt,
  canPromote,
  mustPromote,
  canPromoteAt,
} from '../board';
import { getPieceValidMoves } from '../pieces';
import {
  canDropPieceAt,
  wouldBeInCheck,
} from './basic';

// 移動が合法かチェック
export function isValidMove(gameState: GameState, move: Move): boolean {
  const { board, handPieces, currentPlayer } = gameState;
  
  // プレイヤーチェック
  if (move.piece.player !== currentPlayer) return false;
  
  if (move.from) {
    // 通常の移動
    return isValidPieceMove(board, move.from, move.to, currentPlayer);
  } else {
    // 持ち駒を打つ
    return isValidDrop(board, handPieces, move.to, move.piece.type, currentPlayer);
  }
}

// 駒の移動が合法かチェック
export function isValidPieceMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player
): boolean {
  // 移動元の駒を取得
  const piece = getPieceAt(board, from);
  if (!piece || piece.player !== player) return false;
  
  // その駒の移動可能な位置を取得
  const validMoves = getPieceValidMoves(piece.type, board, from, player);
  
  // 移動先が移動可能な位置に含まれているかチェック
  const canMove = validMoves.some(pos => pos.row === to.row && pos.col === to.col);
  if (!canMove) return false;
  
  // 王手放置チェック
  if (wouldBeInCheck(board, from, to, player)) return false;
  
  return true;
}

// 持ち駒を打つのが合法かチェック
export function isValidDrop(
  board: Board,
  handPieces: HandPieces,
  to: Position,
  pieceType: PieceType,
  player: Player
): boolean {
  // 持ち駒にあるかチェック
  const count = handPieces[player].get(pieceType) || 0;
  if (count === 0) return false;
  
  // その位置に打てるかチェック
  if (!canDropPieceAt(board, to, pieceType, player)) return false;
  
  // 王手放置チェック
  if (wouldBeInCheck(board, null, to, player, pieceType)) return false;
  
  return true;
}

// 成りが可能かチェック
export function canPromoteMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player
): boolean {
  const piece = getPieceAt(board, from);
  if (!piece || piece.player !== player) return false;
  
  // 成れる駒かチェック
  if (!canPromote(piece)) return false;
  
  // 成れる位置かチェック
  return canPromoteAt(player, from, to);
}

// 成らなければならないかチェック
export function mustPromoteMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player
): boolean {
  const piece = getPieceAt(board, from);
  if (!piece || piece.player !== player) return false;
  
  return mustPromote(piece, to);
}

// 全ての合法手を取得（同期版）
export function getAllValidMovesSync(gameState: GameState): Move[] {
  const { board, handPieces, currentPlayer } = gameState;
  const allMoves: Move[] = [];
  
  // 盤上の駒の移動
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.player === currentPlayer) {
        const from = { row, col };
        const validMoves = getPieceValidMoves(piece.type, board, from, currentPlayer);
        
        for (const to of validMoves) {
          // 王手放置チェック
          if (!wouldBeInCheck(board, from, to, currentPlayer)) {
            const captured = getPieceAt(board, to);
            const move: Move = { from, to, piece };
            
            if (captured) {
              move.captured = captured;
            }
            
            // 成りの選択肢も追加
            if (canPromoteMove(board, from, to, currentPlayer)) {
              if (!mustPromoteMove(board, from, to, currentPlayer)) {
                // 成らない選択肢
                allMoves.push({ ...move });
              }
              // 成る選択肢
              allMoves.push({ ...move, promote: true });
            } else {
              allMoves.push(move);
            }
          }
        }
      }
    }
  }
  
  // 持ち駒を打つ
  handPieces[currentPlayer].forEach((count, pieceType) => {
    if (count > 0) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const to = { row, col };
          if (isValidDrop(board, handPieces, to, pieceType, currentPlayer)) {
            allMoves.push({
              from: null,
              to,
              piece: { type: pieceType, player: currentPlayer },
            });
          }
        }
      }
    }
  });
  
  return allMoves;
}

// 全ての合法手を取得（非同期版 - AI用）
export async function getAllValidMoves(gameState: GameState): Promise<Move[]> {
  const { board, handPieces, currentPlayer } = gameState;
  const allMoves: Move[] = [];
  
  // 盤上の駒の移動
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.player === currentPlayer) {
        const from = { row, col };
        const validMoves = getPieceValidMoves(piece.type, board, from, currentPlayer);
        
        for (const to of validMoves) {
          // 王手放置チェック
          if (!wouldBeInCheck(board, from, to, currentPlayer)) {
            const captured = getPieceAt(board, to);
            const move: Move = { from, to, piece };
            
            if (captured) {
              move.captured = captured;
            }
            
            // 成りの選択肢も追加
            if (canPromoteMove(board, from, to, currentPlayer)) {
              if (!mustPromoteMove(board, from, to, currentPlayer)) {
                // 成らない選択肢
                allMoves.push({ ...move });
              }
              // 成る選択肢
              allMoves.push({ ...move, promote: true });
            } else {
              allMoves.push(move);
            }
          }
        }
      }
    }
  }
  
  // 持ち駒を打つ
  handPieces[currentPlayer].forEach((count, pieceType) => {
    if (count > 0) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const to = { row, col };
          if (isValidDrop(board, handPieces, to, pieceType, currentPlayer)) {
            allMoves.push({
              from: null,
              to,
              piece: { type: pieceType, player: currentPlayer },
            });
          }
        }
      }
    }
  });
  
  return allMoves;
}

// 詰みチェック（同期版）
export function isCheckmateSync(gameState: GameState): boolean {
  // 王手されていない場合は詰みではない
  if (!isInCheck(gameState.board, gameState.currentPlayer)) return false;
  
  // 合法手が一つでもあれば詰みではない
  const validMoves = getAllValidMovesSync(gameState);
  return validMoves.length === 0;
}

// ステイルメイト（手詰まり）チェック（同期版）
export function isStalemateSync(gameState: GameState): boolean {
  // 王手されている場合はステイルメイトではない
  if (isInCheck(gameState.board, gameState.currentPlayer)) return false;
  
  // 合法手がない場合はステイルメイト
  const validMoves = getAllValidMovesSync(gameState);
  return validMoves.length === 0;
}

// 詰みチェック（非同期版 - AI用）
export async function isCheckmate(gameState: GameState): Promise<boolean> {
  // 王手されていない場合は詰みではない
  if (!isInCheck(gameState.board, gameState.currentPlayer)) return false;
  
  // 合法手が一つでもあれば詰みではない
  const validMoves = await getAllValidMoves(gameState);
  return validMoves.length === 0;
}

// ステイルメイト（手詰まり）チェック
export async function isStalemate(gameState: GameState): Promise<boolean> {
  // 王手されている場合はステイルメイトではない
  if (isInCheck(gameState.board, gameState.currentPlayer)) return false;
  
  // 合法手がない場合はステイルメイト
  const validMoves = await getAllValidMoves(gameState);
  return validMoves.length === 0;
}

// 打ち歩詰めチェック
export async function isUchifuzume(
  board: Board,
  dropPosition: Position,
  player: Player
): Promise<boolean> {
  // 仮の盤面を作成
  const testBoard = board.map(row => [...row]);
  testBoard[dropPosition.row][dropPosition.col] = { type: PieceType.FU, player };
  
  // 相手プレイヤーを取得
  const opponent = player === Player.SENTE ? Player.GOTE : Player.SENTE;
  
  // 相手が王手になっているかチェック
  if (!isInCheck(testBoard, opponent)) return false;
  
  // 相手に合法手があるかチェック
  const testGameState: GameState = {
    board: testBoard,
    handPieces: createEmptyHandPiecesImport(),
    currentPlayer: opponent,
    moveHistory: [],
  };
  
  const validMoves = await getAllValidMoves(testGameState);
  
  // 合法手がなければ打ち歩詰め
  return validMoves.length === 0;
}

// createEmptyHandPiecesをインポート（循環参照を避けるため）
import { createEmptyHandPieces as createEmptyHandPiecesImport } from '../board';
import { isInCheck } from './basic';

// Re-export for external use
export { isInCheck, ValidationResult, canDropPieceAtWithError } from './basic';