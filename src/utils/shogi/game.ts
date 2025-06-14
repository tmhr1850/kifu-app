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
  isInCheck,
} from './validators';
import {
  createPositionHistory,
  detectRepetition,
  PositionHistory,
} from './repetition';

// 新しいゲームを開始
export function createNewGame(): GameState {
  return {
    board: createInitialBoard(),
    handPieces: createEmptyHandPieces(),
    currentPlayer: Player.SENTE,
    moveHistory: [],
    positionHistory: createPositionHistory(),
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
    positionHistory: gameState.positionHistory,
  };
}

// ゲームの状態をチェック
export interface GameStatus {
  isOver: boolean;
  winner: Player | null;
  reason: 'checkmate' | 'stalemate' | 'resignation' | 'repetition' | 'perpetual_check' | 'impasse' | 'timeout' | null;
}

export function getGameStatus(gameState: GameState): GameStatus {
  // 投了チェック
  if (gameState.resigned) {
    return {
      isOver: true,
      winner: getOpponentPlayer(gameState.currentPlayer),
      reason: 'resignation',
    };
  }

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

  // 千日手チェック
  if (gameState.positionHistory) {
    // isInCheckは失敗する可能性があるので、try-catchで囲む
    let currentIsInCheck = false
    try {
      currentIsInCheck = isInCheck(gameState.board, gameState.currentPlayer)
    } catch {
      // 王が見つからない場合などは無視
    }
    
    const repetitionResult = detectRepetition(
      gameState,
      gameState.positionHistory as PositionHistory,
      currentIsInCheck
    )
    
    if (repetitionResult.isRepetition) {
      if (repetitionResult.isPerpetualCheck) {
        // 連続王手の千日手は王手をかけている側の負け
        return {
          isOver: true,
          winner: gameState.currentPlayer, // 王手をかけられている側の勝ち
          reason: 'perpetual_check',
        };
      } else {
        // 通常の千日手は引き分け
        return {
          isOver: true,
          winner: null,
          reason: 'repetition',
        };
      }
    }
  }

  // 持将棋チェック
  if (checkImpasse(gameState)) {
    // 点数計算で勝敗を決める
    const sentePoints = calculateMaterialPoints(gameState, Player.SENTE);
    const gotePoints = calculateMaterialPoints(gameState, Player.GOTE);

    if (sentePoints >= 24 && gotePoints < 24) {
      return {
        isOver: true,
        winner: Player.SENTE,
        reason: 'impasse',
      };
    } else if (gotePoints >= 24 && sentePoints < 24) {
      return {
        isOver: true,
        winner: Player.GOTE,
        reason: 'impasse',
      };
    } else {
      // 両者24点以上または両者24点未満の場合は引き分け
      return {
        isOver: true,
        winner: null,
        reason: 'impasse',
      };
    }
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

// 投了
export function resign(gameState: GameState): GameState {
  return {
    ...gameState,
    resigned: true,
  };
}

// 手を戻す（待った）
export function undoMove(gameState: GameState): GameState | null {
  if (gameState.moveHistory.length === 0) {
    return null; // 戻す手がない
  }

  // 初期状態から最後の手を除いて再構築
  const newGameState = createNewGame();
  const movesToReplay = gameState.moveHistory.slice(0, -1);

  // 各手を再適用
  let currentState = newGameState;
  for (const move of movesToReplay) {
    const nextState = makeMove(currentState, move);
    if (!nextState) {
      return null; // エラーが発生した場合
    }
    currentState = nextState;
  }

  return currentState;
}

// 持将棋判定
export function checkImpasse(gameState: GameState): boolean {
  // 両玉の位置を探す
  let senteKingPos: { row: number; col: number } | null = null;
  let goteKingPos: { row: number; col: number } | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = gameState.board[row][col];
      if (piece && piece.type === PieceType.OU) {
        if (piece.player === Player.SENTE) {
          senteKingPos = { row, col };
        } else {
          goteKingPos = { row, col };
        }
      }
    }
  }

  // 両玉が存在しない場合は持将棋ではない
  if (!senteKingPos || !goteKingPos) {
    return false;
  }

  // 先手の玉が敵陣（0-2段目）にいるか
  const senteInEnemyTerritory = senteKingPos.row <= 2;
  // 後手の玉が敵陣（6-8段目）にいるか
  const goteInEnemyTerritory = goteKingPos.row >= 6;

  return senteInEnemyTerritory && goteInEnemyTerritory;
}

// 駒の点数計算（持将棋判定用）
export function calculateMaterialPoints(gameState: GameState, player: Player): number {
  const pointMap: Partial<Record<PieceType, number>> = {
    [PieceType.FU]: 1,
    [PieceType.KYO]: 1,
    [PieceType.KEI]: 1,
    [PieceType.GIN]: 1,
    [PieceType.KIN]: 1,
    [PieceType.KAKU]: 5,
    [PieceType.HI]: 5,
    // 成り駒
    [PieceType.TO]: 1,
    [PieceType.NKYO]: 1,
    [PieceType.NKEI]: 1,
    [PieceType.NGIN]: 1,
    [PieceType.UMA]: 5,
    [PieceType.RYU]: 5,
  };

  let points = 0;

  // 盤上の駒を数える
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = gameState.board[row][col];
      if (piece && piece.player === player && piece.type !== PieceType.OU) {
        points += pointMap[piece.type] || 0;
      }
    }
  }

  // 持ち駒を数える
  const handPieces = gameState.handPieces[player];
  handPieces.forEach((count, pieceType) => {
    points += (pointMap[pieceType] || 0) * count;
  });

  return points;
}