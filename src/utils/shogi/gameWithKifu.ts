import { GameState, Move, Player, PieceType } from '@/types/shogi';
import { KifuRecord, KifuMove, GameInfo } from '@/types/kifu';
import { createNewGame, makeMove, getGameStatus, undoMove } from './game';
import { 
  saveKifuRecord, 
  loadKifuRecord, 
  createNewKifuRecord,
  exportKifToText 
} from './storageService';

export interface GameWithKifu {
  gameState: GameState;
  kifuRecord: KifuRecord;
}

// Alias for compatibility with existing components
export interface GameStateWithKifu {
  game: GameState;
  kifu: KifuRecord;
}

export interface GameStateWrapper {
  game: {
    board: (PieceType | null)[][];
    captures: { sente: Map<PieceType, number>, gote: Map<PieceType, number> };
    currentPlayer: Player;
    makeMove: (from: number, to: number, promote: boolean) => GameStateWrapper['game'];
    placePiece: (pieceType: PieceType, to: number) => GameStateWrapper['game'];
    getPieceTypeFromKanji: (kanji: string) => PieceType | null;
  };
}

// 新しいゲームを開始（棋譜記録付き）
export function createNewGameWithKifu(gameInfo?: Partial<GameInfo>): GameStateWithKifu {
  const gameState = createNewGame();
  const kifuRecord = createNewKifuRecord(gameInfo);
  
  // 初回保存
  saveKifuRecord(kifuRecord);
  
  return {
    game: gameState,
    kifu: kifuRecord
  };
}

// 棋譜から対局を読み込む
export function loadGameFromKifu(kifuId: string): GameStateWithKifu | null {
  const kifuRecord = loadKifuRecord(kifuId);
  if (!kifuRecord) {
    return null;
  }
  
  // 初期局面から棋譜の手順を再現
  let gameState = createNewGame();
  
  for (const kifuMove of kifuRecord.moves) {
    const move = kifuMoveToGameMove(kifuMove);
    if (move) {
      const newState = makeMove(gameState, move);
      if (newState) {
        gameState = newState;
      }
    }
  }
  
  return {
    game: gameState,
    kifu: kifuRecord
  };
}

// 移動を実行（棋譜記録付き）
export function makeMoveWithKifu(
  gameWithKifu: GameStateWithKifu, 
  move: Move
): GameStateWithKifu | null {
  const newGameState = makeMove(gameWithKifu.game, move);
  if (!newGameState) {
    return null;
  }
  
  // KifuMove形式に変換
  const kifuMove: KifuMove = {
    from: move.from ? { row: move.from.row, col: move.from.col } : undefined,
    to: { row: move.to.row, col: move.to.col },
    piece: getPieceChar(move.piece.type),
    promote: move.promote,
    player: move.piece.player
  };
  
  // 棋譜記録を更新
  const updatedKifuRecord = {
    ...gameWithKifu.kifu,
    moves: [...gameWithKifu.kifu.moves, kifuMove],
    updatedAt: new Date().toISOString()
  };
  
  // 自動保存（オプション：パフォーマンスを考慮して数手ごとに保存するなど）
  saveKifuRecord(updatedKifuRecord);
  
  return {
    game: newGameState,
    kifu: updatedKifuRecord
  };
}

// 対局終了時の処理
export function endGameWithKifu(
  gameWithKifu: GameStateWithKifu,
  result?: 'sente_win' | 'gote_win' | 'draw' | 'resign'
): GameStateWithKifu {
  const status = getGameStatus(gameWithKifu.game);
  
  // 結果を記録
  const gameResult = result || (
    status.winner === Player.SENTE ? 'sente_win' :
    status.winner === Player.GOTE ? 'gote_win' :
    'draw'
  );
  
  const updatedKifuRecord = {
    ...gameWithKifu.kifu,
    gameInfo: {
      ...gameWithKifu.kifu.gameInfo,
      endTime: new Date().toTimeString().split(' ')[0],
      result: gameResult
    },
    updatedAt: new Date().toISOString()
  };
  
  saveKifuRecord(updatedKifuRecord);
  
  // 更新されたゲーム状態を返す
  // 投了の場合はresignedフラグを立てる
  const isResignation = result === 'sente_win' || result === 'gote_win';
  const updatedGameState = {
    ...gameWithKifu.game,
    resigned: isResignation
  };
  
  return {
    game: updatedGameState,
    kifu: updatedKifuRecord
  };
}

// 手動保存
export function saveCurrentGame(gameWithKifu: GameStateWithKifu): void {
  const updatedKifuRecord = {
    ...gameWithKifu.kifu,
    updatedAt: new Date().toISOString()
  };
  
  saveKifuRecord(updatedKifuRecord);
}

// 待った（手を戻す）
export function undoMoveWithKifu(gameWithKifu: GameStateWithKifu): GameStateWithKifu | null {
  const undoneGameState = undoMove(gameWithKifu.game);
  if (!undoneGameState) {
    return null;
  }

  // 棋譜から最後の手を削除
  const updatedMoves = gameWithKifu.kifu.moves.slice(0, -1);
  
  const updatedKifuRecord = {
    ...gameWithKifu.kifu,
    moves: updatedMoves,
    updatedAt: new Date().toISOString()
  };

  return {
    game: undoneGameState,
    kifu: updatedKifuRecord
  };
}

// KIF形式でエクスポート
export function exportGameAsKif(gameWithKifu: GameStateWithKifu): string {
  return exportKifToText(gameWithKifu.kifu.id) || '';
}

// Helper functions
function getPieceChar(pieceType: string): string {
  const pieceMap: { [key: string]: string } = {
    'FU': '歩',
    'KYO': '香',
    'KEI': '桂',
    'GIN': '銀',
    'KIN': '金',
    'KAKU': '角',
    'HI': '飛',
    'OU': '王',
    'TO': 'と',
    'NKYO': '成香',
    'NKEI': '成桂',
    'NGIN': '成銀',
    'UMA': '馬',
    'RYU': '龍'
  };
  
  return pieceMap[pieceType] || pieceType;
}

function kifuMoveToGameMove(kifuMove: KifuMove): Move | null {
  // KifuMoveからGame Moveへの変換
  // これは実際の盤面状態を参照して、適切なPieceオブジェクトを構築する必要がある
  const piece = {
    type: getPieceTypeFromChar(kifuMove.piece),
    player: kifuMove.player === Player.SENTE ? Player.SENTE : Player.GOTE
  };
  
  return {
    from: kifuMove.from ? { row: kifuMove.from.row, col: kifuMove.from.col } : null,
    to: { row: kifuMove.to.row, col: kifuMove.to.col },
    piece,
    promote: kifuMove.promote
  };
}

function getPieceTypeFromChar(char: string): string {
  const charMap: { [key: string]: string } = {
    '歩': 'FU',
    '香': 'KYO',
    '桂': 'KEI',
    '銀': 'GIN',
    '金': 'KIN',
    '角': 'KAKU',
    '飛': 'HI',
    '王': 'OU',
    'と': 'TO',
    '成香': 'NKYO',
    '成桂': 'NKEI',
    '成銀': 'NGIN',
    '馬': 'UMA',
    '龍': 'RYU'
  };
  
  return charMap[char] || 'FU';
}

// 棋譜からゲームを作成（再生用）
export function createGameFromKifu(): GameStateWrapper {
  const gameState = createNewGame();
  
  const wrapper: GameStateWrapper = {
    game: {
      board: gameState.board,
      captures: {
        sente: gameState.handPieces[Player.SENTE],
        gote: gameState.handPieces[Player.GOTE]
      },
      currentPlayer: gameState.currentPlayer,
      makeMove: (from: number, to: number, promote: boolean) => {
        const fromPos = from >= 0 ? { row: Math.floor(from / 9), col: from % 9 } : null;
        const toPos = { row: Math.floor(to / 9), col: to % 9 };
        
        if (fromPos) {
          const piece = gameState.board[fromPos.row][fromPos.col];
          if (piece) {
            const move: Move = {
              from: fromPos,
              to: toPos,
              piece,
              promote
            };
            const newState = makeMove(gameState, move);
            if (newState) {
              Object.assign(gameState, newState);
            }
          }
        }
        
        wrapper.game.board = gameState.board;
        wrapper.game.captures = {
          sente: gameState.handPieces[Player.SENTE],
          gote: gameState.handPieces[Player.GOTE]
        };
        wrapper.game.currentPlayer = gameState.currentPlayer;
        
        return wrapper.game;
      },
      placePiece: (pieceType: PieceType, to: number) => {
        const toPos = { row: Math.floor(to / 9), col: to % 9 };
        const move: Move = {
          from: null,
          to: toPos,
          piece: {
            type: pieceType,
            player: gameState.currentPlayer
          },
          promote: false
        };
        
        const newState = makeMove(gameState, move);
        if (newState) {
          Object.assign(gameState, newState);
        }
        
        wrapper.game.board = gameState.board;
        wrapper.game.captures = {
          sente: gameState.handPieces[Player.SENTE],
          gote: gameState.handPieces[Player.GOTE]
        };
        wrapper.game.currentPlayer = gameState.currentPlayer;
        
        return wrapper.game;
      },
      getPieceTypeFromKanji: (kanji: string): PieceType | null => {
        const pieceTypeStr = getPieceTypeFromChar(kanji);
        return PieceType[pieceTypeStr as keyof typeof PieceType] || null;
      }
    }
  };
  
  return wrapper;
}