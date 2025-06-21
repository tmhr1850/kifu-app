import { 
  isValidMoveWithError, 
  isValidPieceMoveWithError,
  isValidDropWithError,
  canDropPieceAtWithError
} from '../validators';
import { createEmptyBoard } from '../board';
import { Player, PieceType, GameState } from '@/types/shogi';

describe('エラーハンドリングのテスト', () => {
  describe('isValidMoveWithError', () => {
    it('相手の手番でエラーメッセージを返す', () => {
      const board = createEmptyBoard();
      board[6][4] = { type: PieceType.FU, player: Player.SENTE };
      
      const gameState: GameState = {
        board,
        handPieces: {
          [Player.SENTE]: new Map(),
          [Player.GOTE]: new Map()
        },
        currentPlayer: Player.GOTE, // 後手の番
        moveHistory: []
      };

      const move = {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE } // 先手の駒を動かそうとする
      };

      const result = isValidMoveWithError(gameState, move);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('相手の手番です');
    });
  });

  describe('isValidPieceMoveWithError', () => {
    it('移動元に駒がない場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      
      const result = isValidPieceMoveWithError(
        board,
        { row: 5, col: 5 },
        { row: 4, col: 5 },
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('移動元に駒がありません');
    });

    it('相手の駒を動かそうとした場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      board[3][3] = { type: PieceType.FU, player: Player.GOTE };
      
      const result = isValidPieceMoveWithError(
        board,
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('相手の駒は動かせません');
    });

    it('無効な移動先の場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      board[6][4] = { type: PieceType.FU, player: Player.SENTE };
      
      const result = isValidPieceMoveWithError(
        board,
        { row: 6, col: 4 },
        { row: 6, col: 5 }, // 歩は横に動けない
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('その駒はそこには動かせません');
    });

    it('王手放置の場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      // 王手の状況を作る
      board[4][4] = { type: PieceType.OU, player: Player.SENTE };
      board[0][4] = { type: PieceType.HI, player: Player.GOTE }; // 飛車で王手
      board[6][2] = { type: PieceType.FU, player: Player.SENTE };
      
      const result = isValidPieceMoveWithError(
        board,
        { row: 6, col: 2 },
        { row: 5, col: 2 }, // 王手を解消しない手
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('王手放置：王様を守ってください');
    });
  });

  describe('isValidDropWithError', () => {
    it('持ち駒にない駒の場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      const handPieces = {
        [Player.SENTE]: new Map(),
        [Player.GOTE]: new Map()
      };
      
      const result = isValidDropWithError(
        board,
        handPieces,
        { row: 5, col: 5 },
        PieceType.FU,
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('その駒は持ち駒にありません');
    });

    it('駒打ちルール違反の場合、適切なエラーメッセージを返す', () => {
      const board = createEmptyBoard();
      const handPieces = {
        [Player.SENTE]: new Map([[PieceType.FU, 1]]),
        [Player.GOTE]: new Map()
      };
      
      // 二歩の状況を作る
      board[6][4] = { type: PieceType.FU, player: Player.SENTE };
      
      const result = isValidDropWithError(
        board,
        handPieces,
        { row: 5, col: 4 }, // 同じ筋に歩を打つ
        PieceType.FU,
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('二歩：同じ筋に歩を2枚置くことはできません');
    });
  });

  describe('canDropPieceAtWithError', () => {
    it('盤面外の場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      
      const result = canDropPieceAtWithError(
        board,
        { row: -1, col: 0 },
        PieceType.FU,
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('盤面の外には駒を置けません');
    });

    it('既に駒がある場所の場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      board[5][5] = { type: PieceType.KIN, player: Player.SENTE };
      
      const result = canDropPieceAtWithError(
        board,
        { row: 5, col: 5 },
        PieceType.FU,
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('すでに駒がある場所には置けません');
    });

    it('行き所のない駒の場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      
      // 歩を1段目に置こうとする
      const result = canDropPieceAtWithError(
        board,
        { row: 0, col: 4 },
        PieceType.FU,
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('歩を1段目に置くことはできません');
    });

    it('打ち歩詰めの場合エラーメッセージを返す', () => {
      const board = createEmptyBoard();
      // 簡単な打ち歩詰めの局面
      board[0][0] = { type: PieceType.OU, player: Player.GOTE };
      board[0][1] = { type: PieceType.KIN, player: Player.SENTE };
      board[1][1] = { type: PieceType.KIN, player: Player.SENTE };
      
      const result = canDropPieceAtWithError(
        board,
        { row: 1, col: 0 },
        PieceType.FU,
        Player.SENTE
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('打ち歩詰め：この歩で相手の王を詰めることはできません');
    });
  });
});