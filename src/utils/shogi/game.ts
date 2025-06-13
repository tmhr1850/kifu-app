import {
  GameState,
  Move,
  Player,
  PieceType,
} from '@/types/shogi';
import {
  createInitialBoard,
  createEmptyHandPieces,
  getPieceAt,
  setPieceAt,
  getOpponentPlayer,
  promotePiece,
  copyBoard,
  copyHandPieces,
  addToHand,
  removeFromHand,
  unpromoteForHand,
} from './board';
import {
  isValidMove,
  isCheckmate,
  isStalemate,
} from './validators';

// 新しいゲームを開始
export function createNewGame(): GameState {
  return {
    board: createInitialBoard(),
    handPieces: createEmptyHandPieces(),
    currentPlayer: Player.SENTE,
    moveHistory: [],
  };
}

// 移動を実行
export function makeMove(gameState: GameState, move: Move): GameState | null {
  // 移動が合法かチェック
  if (!isValidMove(gameState, move)) {
    return null;
  }

  // 新しい状態を作成
  const newBoard = copyBoard(gameState.board);
  const newHandPieces = copyHandPieces(gameState.handPieces);
  const newMoveHistory = [...gameState.moveHistory, move];

  if (move.from) {
    // 通常の移動
    const piece = getPieceAt(newBoard, move.from);
    if (!piece) return null;

    // 移動元を空にする
    setPieceAt(newBoard, move.from, null);

    // 相手の駒を取る場合
    const capturedPiece = getPieceAt(newBoard, move.to);
    if (capturedPiece) {
      // 成り駒は元に戻して持ち駒に
      const handPieceType = unpromoteForHand(capturedPiece.type);
      addToHand(newHandPieces, gameState.currentPlayer, handPieceType);
    }

    // 成る場合
    let movedPiece = piece;
    if (move.promote) {
      movedPiece = promotePiece(piece);
    }

    // 移動先に配置
    setPieceAt(newBoard, move.to, movedPiece);
  } else {
    // 持ち駒を打つ
    if (!removeFromHand(newHandPieces, gameState.currentPlayer, move.piece.type)) {
      return null;
    }
    setPieceAt(newBoard, move.to, move.piece);
  }

  // 次のプレイヤーに交代
  const nextPlayer = getOpponentPlayer(gameState.currentPlayer);

  return {
    board: newBoard,
    handPieces: newHandPieces,
    currentPlayer: nextPlayer,
    moveHistory: newMoveHistory,
  };
}

// ゲームの状態をチェック
export interface GameStatus {
  isOver: boolean;
  winner: Player | null;
  reason: 'checkmate' | 'stalemate' | 'resignation' | null;
}

export function getGameStatus(gameState: GameState): GameStatus {
  // 詰みチェック
  if (isCheckmate(gameState)) {
    return {
      isOver: true,
      winner: getOpponentPlayer(gameState.currentPlayer),
      reason: 'checkmate',
    };
  }

  // ステイルメイトチェック
  if (isStalemate(gameState)) {
    return {
      isOver: true,
      winner: null,
      reason: 'stalemate',
    };
  }

  return {
    isOver: false,
    winner: null,
    reason: null,
  };
}

// 移動の表記法（簡易版）
export function moveToString(move: Move): string {
  const colNames = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];
  const rowNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  
  const pieceNames: Record<PieceType, string> = {
    [PieceType.FU]: '歩',
    [PieceType.KYO]: '香',
    [PieceType.KEI]: '桂',
    [PieceType.GIN]: '銀',
    [PieceType.KIN]: '金',
    [PieceType.KAKU]: '角',
    [PieceType.HI]: '飛',
    [PieceType.OU]: '玉',
    [PieceType.TO]: 'と',
    [PieceType.NKYO]: '成香',
    [PieceType.NKEI]: '成桂',
    [PieceType.NGIN]: '成銀',
    [PieceType.UMA]: '馬',
    [PieceType.RYU]: '龍',
  };

  const col = colNames[move.to.col];
  const row = rowNames[move.to.row];
  const piece = pieceNames[move.piece.type];
  
  let result = '';
  
  if (move.from) {
    result = `${col}${row}${piece}`;
    if (move.promote) {
      result += '成';
    }
    if (move.captured) {
      result += '(取)';
    }
  } else {
    result = `${col}${row}${piece}打`;
  }
  
  return result;
}

// 棋譜を文字列に変換
export function gameToKifu(gameState: GameState): string {
  const lines: string[] = [];
  
  gameState.moveHistory.forEach((move, index) => {
    const moveNumber = index + 1;
    const moveStr = moveToString(move);
    lines.push(`${moveNumber}. ${moveStr}`);
  });
  
  return lines.join('\n');
}