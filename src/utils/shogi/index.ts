// 型定義のエクスポート
export * from '@/types/shogi';

// ゲームロジックのエクスポート
export {
  createNewGame,
  makeMove,
  getGameStatus,
  moveToString,
  gameToKifu,
  type GameStatus,
} from './game';

// 盤面操作のエクスポート
export {
  createEmptyBoard,
  createInitialBoard,
  createEmptyHandPieces,
  isValidPosition,
  getPieceAt,
  setPieceAt,
  getOpponentPlayer,
  promotePiece,
  canPromote,
  mustPromote,
  canPromoteAt,
  copyBoard,
  copyHandPieces,
  addToHand,
  removeFromHand,
  unpromoteForHand,
} from './board';

// 駒の移動ルールのエクスポート
export {
  getPieceValidMoves,
} from './pieces';

// バリデーターのエクスポート
export {
  isValidMove,
  isValidPieceMove,
  isValidDrop,
  canPromoteMove,
  mustPromoteMove,
  getAllValidMoves,
  isCheckmate,
  isStalemate,
  isUchifuzume,
} from './validators';

export {
  canDropPieceAt,
  hasNifu,
  isInCheck,
  findKing,
  wouldBeInCheck,
} from './validators/basic';