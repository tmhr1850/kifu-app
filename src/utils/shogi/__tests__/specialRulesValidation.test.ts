import { canDropPieceAtWithError } from '../validators';
import { createEmptyBoard } from '../board';
import { Player, PieceType } from '@/types/shogi';

describe('特殊ルール違反の検出', () => {
  describe('二歩（にふ）の検出', () => {
    it('同じ筋に歩が既にある場合はエラーを返す', () => {
      const board = createEmptyBoard();
      // 7七に歩を配置（先手）
      board[6][2] = { type: PieceType.FU, player: Player.SENTE };
      
      // 同じ筋（3筋）の別の場所に歩を置こうとする
      const result = canDropPieceAtWithError(board, { row: 4, col: 2 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('二歩：同じ筋に歩を2枚置くことはできません');
    });

    it('違う筋なら歩を置ける', () => {
      const board = createEmptyBoard();
      // 7七に歩を配置（先手）
      board[6][2] = { type: PieceType.FU, player: Player.SENTE };
      
      // 違う筋（4筋）に歩を置く
      const result = canDropPieceAtWithError(board, { row: 4, col: 3 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('相手の歩は二歩にカウントしない', () => {
      const board = createEmptyBoard();
      // 3三に後手の歩を配置
      board[2][2] = { type: PieceType.FU, player: Player.GOTE };
      
      // 同じ筋に先手の歩を置く
      const result = canDropPieceAtWithError(board, { row: 6, col: 2 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('行き所のない駒の検出', () => {
    describe('歩（ふ）', () => {
      it('先手の歩を1段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 0, col: 4 }, PieceType.FU, Player.SENTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('歩を1段目に置くことはできません');
      });

      it('後手の歩を9段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 8, col: 4 }, PieceType.FU, Player.GOTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('歩を9段目に置くことはできません');
      });
    });

    describe('香車（きょう）', () => {
      it('先手の香車を1段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 0, col: 0 }, PieceType.KYO, Player.SENTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('香車を1段目に置くことはできません');
      });

      it('後手の香車を9段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 8, col: 8 }, PieceType.KYO, Player.GOTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('香車を9段目に置くことはできません');
      });
    });

    describe('桂馬（けい）', () => {
      it('先手の桂馬を1段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 0, col: 1 }, PieceType.KEI, Player.SENTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('桂馬を1・2段目に置くことはできません');
      });

      it('先手の桂馬を2段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 1, col: 1 }, PieceType.KEI, Player.SENTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('桂馬を1・2段目に置くことはできません');
      });

      it('後手の桂馬を8段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 7, col: 7 }, PieceType.KEI, Player.GOTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('桂馬を8・9段目に置くことはできません');
      });

      it('後手の桂馬を9段目に置けない', () => {
        const board = createEmptyBoard();
        const result = canDropPieceAtWithError(board, { row: 8, col: 7 }, PieceType.KEI, Player.GOTE);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('桂馬を8・9段目に置くことはできません');
      });
    });
  });

  describe('打ち歩詰めの検出', () => {
    it('歩を打って相手の王を詰める手は禁止', () => {
      const board = createEmptyBoard();
      // 簡単な打ち歩詰めの局面を作る - 完全に囲まれた王
      // 後手の王を1一に配置（隅）
      board[0][0] = { type: PieceType.OU, player: Player.GOTE };
      // 完全に周りを先手の駒で囲む
      board[0][1] = { type: PieceType.KIN, player: Player.SENTE }; // 1二に金
      board[1][1] = { type: PieceType.KIN, player: Player.SENTE }; // 2二に金
      // これで王は2一にしか逃げられない
      
      // 2一に歩を打とうとする（打ち歩詰め）
      const result = canDropPieceAtWithError(board, { row: 1, col: 0 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('打ち歩詰め：この歩で相手の王を詰めることはできません');
    });

    it('歩を打っても王手にならない場合は許可', () => {
      const board = createEmptyBoard();
      
      // 適当な位置に歩を打つ
      const result = canDropPieceAtWithError(board, { row: 5, col: 4 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('基本的なバリデーション', () => {
    it('盤面の外に駒を置けない', () => {
      const board = createEmptyBoard();
      const result = canDropPieceAtWithError(board, { row: -1, col: 0 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('盤面の外には駒を置けません');
    });

    it('既に駒がある場所に置けない', () => {
      const board = createEmptyBoard();
      // 5五に駒を配置
      board[4][4] = { type: PieceType.KIN, player: Player.SENTE };
      
      const result = canDropPieceAtWithError(board, { row: 4, col: 4 }, PieceType.FU, Player.SENTE);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('すでに駒がある場所には置けません');
    });
  });
});