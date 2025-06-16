import { GameState, PieceType, Player, Board, HandPieces } from '@/types/shogi';

// 駒の基本価値
const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.FU]: 100,      // 歩
  [PieceType.KYO]: 350,     // 香
  [PieceType.KEI]: 450,     // 桂
  [PieceType.GIN]: 550,     // 銀
  [PieceType.KIN]: 600,     // 金
  [PieceType.KAKU]: 900,    // 角
  [PieceType.HI]: 1000,     // 飛
  [PieceType.OU]: 10000,    // 王
  // 成り駒
  [PieceType.TO]: 600,      // と金
  [PieceType.NKYO]: 550,    // 成香
  [PieceType.NKEI]: 550,    // 成桂
  [PieceType.NGIN]: 600,    // 成銀
  [PieceType.UMA]: 1100,    // 馬
  [PieceType.RYU]: 1300,    // 龍
};

// 駒の位置による価値補正（先手視点）
const POSITION_BONUS: Record<PieceType, number[][]> = {
  [PieceType.FU]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [15, 15, 15, 15, 15, 15, 15, 15, 15],
    [20, 20, 20, 20, 20, 20, 20, 20, 20],
    [25, 25, 25, 25, 25, 25, 25, 25, 25],
    [30, 30, 30, 30, 30, 30, 30, 30, 30],
    [50, 50, 50, 50, 50, 50, 50, 50, 50],
    [60, 60, 60, 60, 60, 60, 60, 60, 60],
    [70, 70, 70, 70, 70, 70, 70, 70, 70],
  ],
  [PieceType.KEI]: [
    [-20, -10, -10, -10, -10, -10, -10, -10, -20],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [15, 15, 15, 15, 15, 15, 15, 15, 15],
    [20, 20, 20, 20, 20, 20, 20, 20, 20],
    [25, 25, 25, 25, 25, 25, 25, 25, 25],
    [30, 30, 30, 30, 30, 30, 30, 30, 30],
    [20, 20, 20, 20, 20, 20, 20, 20, 20],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
  ],
  [PieceType.GIN]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 5, 5, 5, 5, 5, 5, 5, 5],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [15, 15, 20, 20, 20, 20, 20, 15, 15],
    [20, 20, 25, 25, 25, 25, 25, 20, 20],
    [15, 15, 20, 20, 20, 20, 20, 15, 15],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [5, 5, 5, 5, 5, 5, 5, 5, 5],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [PieceType.KIN]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 5, 5, 5, 5, 5, 5, 5, 5],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [15, 15, 15, 15, 15, 15, 15, 15, 15],
    [20, 20, 20, 20, 20, 20, 20, 20, 20],
    [20, 20, 20, 20, 20, 20, 20, 20, 20],
    [15, 15, 15, 15, 15, 15, 15, 15, 15],
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [5, 5, 5, 5, 5, 5, 5, 5, 5],
  ],
  [PieceType.OU]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-10, -10, -10, -10, -10, -10, -10, -10, -10],
    [-20, -20, -20, -20, -20, -20, -20, -20, -20],
    [-30, -30, -30, -30, -30, -30, -30, -30, -30],
    [-40, -40, -40, -40, -40, -40, -40, -40, -40],
    [-50, -50, -40, -30, -30, -30, -40, -50, -50],
    [-50, -50, -30, -20, -10, -20, -30, -50, -50],
  ],
};

// デフォルトの位置ボーナス（他の駒用）
const DEFAULT_POSITION_BONUS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [5, 5, 5, 5, 5, 5, 5, 5, 5],
  [10, 10, 10, 10, 10, 10, 10, 10, 10],
  [15, 15, 15, 15, 15, 15, 15, 15, 15],
  [20, 20, 20, 20, 20, 20, 20, 20, 20],
  [15, 15, 15, 15, 15, 15, 15, 15, 15],
  [10, 10, 10, 10, 10, 10, 10, 10, 10],
  [5, 5, 5, 5, 5, 5, 5, 5, 5],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// 局面の静的評価関数
export function evaluatePosition(gameState: GameState): number {
  let score = 0;

  // 1. 駒の価値を計算
  score += evaluateMaterial(gameState.board, gameState.handPieces);

  // 2. 駒の位置による評価
  score += evaluatePositions(gameState.board);

  // 3. 王の安全性
  score += evaluateKingSafety(gameState.board);

  // 4. 駒の活動性
  score += evaluatePieceActivity(gameState.board);

  return score;
}

// 駒の価値を計算
function evaluateMaterial(board: Board, handPieces: HandPieces): number {
  let score = 0;

  // 盤上の駒
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        score += piece.player === Player.SENTE ? value : -value;
      }
    }
  }

  // 持ち駒
  handPieces[Player.SENTE].forEach((count, pieceType) => {
    score += (PIECE_VALUES[pieceType] || 0) * count * 0.9; // 持ち駒は少し価値を下げる
  });
  handPieces[Player.GOTE].forEach((count, pieceType) => {
    score -= (PIECE_VALUES[pieceType] || 0) * count * 0.9;
  });

  return score;
}

// 駒の位置による評価
function evaluatePositions(board: Board): number {
  let score = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type !== PieceType.OU) { // 王は別途評価
        const bonus = getPositionBonus(piece.type, row, col, piece.player);
        score += piece.player === Player.SENTE ? bonus : -bonus;
      }
    }
  }

  return score;
}

// 位置ボーナスを取得
function getPositionBonus(pieceType: PieceType, row: number, col: number, player: Player): number {
  const bonusTable = POSITION_BONUS[pieceType] || DEFAULT_POSITION_BONUS;
  
  // 後手の場合は盤面を反転
  const actualRow = player === Player.SENTE ? row : 8 - row;
  
  return bonusTable[actualRow][col];
}

// 王の安全性を評価
function evaluateKingSafety(board: Board): number {
  let score = 0;

  // 王の位置を探す
  let senteKingPos: { row: number; col: number } | null = null;
  let goteKingPos: { row: number; col: number } | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PieceType.OU) {
        if (piece.player === Player.SENTE) {
          senteKingPos = { row, col };
        } else {
          goteKingPos = { row, col };
        }
      }
    }
  }

  // 王の周りの守備駒を評価
  if (senteKingPos) {
    score += evaluateKingDefense(board, senteKingPos, Player.SENTE);
  }
  if (goteKingPos) {
    score -= evaluateKingDefense(board, goteKingPos, Player.GOTE);
  }

  return score;
}

// 王の周りの守備を評価
function evaluateKingDefense(board: Board, kingPos: { row: number; col: number }, player: Player): number {
  let defenseScore = 0;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  for (const [dr, dc] of directions) {
    const row = kingPos.row + dr;
    const col = kingPos.col + dc;
    
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      const piece = board[row][col];
      if (piece && piece.player === player) {
        // 味方の駒がある場合は防御力アップ
        if (piece.type === PieceType.KIN || piece.type === PieceType.GIN) {
          defenseScore += 30;
        } else {
          defenseScore += 20;
        }
      }
    }
  }

  return defenseScore;
}

// 駒の活動性を評価
function evaluatePieceActivity(board: Board): number {
  let score = 0;

  // 飛車・角の活動性を評価
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.type === PieceType.HI || piece.type === PieceType.RYU) {
          const activity = evaluateRookActivity(board, { row, col }, piece.player);
          score += piece.player === Player.SENTE ? activity : -activity;
        } else if (piece.type === PieceType.KAKU || piece.type === PieceType.UMA) {
          const activity = evaluateBishopActivity(board, { row, col }, piece.player);
          score += piece.player === Player.SENTE ? activity : -activity;
        }
      }
    }
  }

  return score;
}

// 飛車の活動性を評価
function evaluateRookActivity(board: Board, pos: { row: number; col: number }, player: Player): number {
  let activity = 0;
  
  // 縦横の移動可能マス数をカウント
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dr, dc] of directions) {
    let row = pos.row + dr;
    let col = pos.col + dc;
    
    while (row >= 0 && row < 9 && col >= 0 && col < 9) {
      const piece = board[row][col];
      if (piece) {
        if (piece.player !== player) {
          activity += 5; // 敵の駒を攻撃できる
        }
        break;
      }
      activity += 3; // 空きマス
      row += dr;
      col += dc;
    }
  }

  return activity;
}

// 角の活動性を評価
function evaluateBishopActivity(board: Board, pos: { row: number; col: number }, player: Player): number {
  let activity = 0;
  
  // 斜めの移動可能マス数をカウント
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  for (const [dr, dc] of directions) {
    let row = pos.row + dr;
    let col = pos.col + dc;
    
    while (row >= 0 && row < 9 && col >= 0 && col < 9) {
      const piece = board[row][col];
      if (piece) {
        if (piece.player !== player) {
          activity += 5; // 敵の駒を攻撃できる
        }
        break;
      }
      activity += 3; // 空きマス
      row += dr;
      col += dc;
    }
  }

  return activity;
}