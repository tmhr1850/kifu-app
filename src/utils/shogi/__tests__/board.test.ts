import { describe, test, expect } from '@jest/globals';
import {
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
  addToHand,
  removeFromHand,
  unpromoteForHand,
} from '../board';
import { Player, PieceType, Position, Piece } from '@/types/shogi';

describe('Board Utilities', () => {
  describe('createEmptyBoard', () => {
    test('空の9x9盤面を作成する', () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(9);
      expect(board[0]).toHaveLength(9);
      expect(board[8][8]).toBeNull();
    });
  });

  describe('createInitialBoard', () => {
    test('初期配置の盤面を作成する', () => {
      const board = createInitialBoard();
      
      // 先手の王将
      expect(board[8][4]).toEqual({ type: PieceType.OU, player: Player.SENTE });
      
      // 後手の王将
      expect(board[0][4]).toEqual({ type: PieceType.OU, player: Player.GOTE });
      
      // 先手の飛車
      expect(board[7][7]).toEqual({ type: PieceType.HI, player: Player.SENTE });
      
      // 後手の歩兵
      expect(board[2][0]).toEqual({ type: PieceType.FU, player: Player.GOTE });
    });
  });

  describe('isValidPosition', () => {
    test('有効な位置を判定する', () => {
      expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
      expect(isValidPosition({ row: 8, col: 8 })).toBe(true);
      expect(isValidPosition({ row: 4, col: 4 })).toBe(true);
    });

    test('無効な位置を判定する', () => {
      expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 9, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
      expect(isValidPosition({ row: 0, col: 9 })).toBe(false);
    });
  });

  describe('getPieceAt / setPieceAt', () => {
    test('駒の取得と配置ができる', () => {
      const board = createEmptyBoard();
      const piece: Piece = { type: PieceType.FU, player: Player.SENTE };
      const pos: Position = { row: 4, col: 4 };
      
      setPieceAt(board, pos, piece);
      expect(getPieceAt(board, pos)).toEqual(piece);
    });

    test('無効な位置には配置できない', () => {
      const board = createEmptyBoard();
      const piece: Piece = { type: PieceType.FU, player: Player.SENTE };
      const invalidPos: Position = { row: 9, col: 9 };
      
      setPieceAt(board, invalidPos, piece);
      expect(getPieceAt(board, invalidPos)).toBeNull();
    });
  });

  describe('getOpponentPlayer', () => {
    test('相手プレイヤーを取得する', () => {
      expect(getOpponentPlayer(Player.SENTE)).toBe(Player.GOTE);
      expect(getOpponentPlayer(Player.GOTE)).toBe(Player.SENTE);
    });
  });

  describe('promotePiece', () => {
    test('駒を成る', () => {
      const fu: Piece = { type: PieceType.FU, player: Player.SENTE };
      const promoted = promotePiece(fu);
      expect(promoted.type).toBe(PieceType.TO);
      expect(promoted.promoted).toBe(true);
    });

    test('成れない駒は変化しない', () => {
      const kin: Piece = { type: PieceType.KIN, player: Player.SENTE };
      const promoted = promotePiece(kin);
      expect(promoted).toEqual(kin);
    });
  });

  describe('canPromote', () => {
    test('成れる駒を判定する', () => {
      expect(canPromote({ type: PieceType.FU, player: Player.SENTE })).toBe(true);
      expect(canPromote({ type: PieceType.KYO, player: Player.SENTE })).toBe(true);
      expect(canPromote({ type: PieceType.KEI, player: Player.SENTE })).toBe(true);
      expect(canPromote({ type: PieceType.GIN, player: Player.SENTE })).toBe(true);
      expect(canPromote({ type: PieceType.KAKU, player: Player.SENTE })).toBe(true);
      expect(canPromote({ type: PieceType.HI, player: Player.SENTE })).toBe(true);
    });

    test('成れない駒を判定する', () => {
      expect(canPromote({ type: PieceType.KIN, player: Player.SENTE })).toBe(false);
      expect(canPromote({ type: PieceType.OU, player: Player.SENTE })).toBe(false);
      expect(canPromote({ type: PieceType.TO, player: Player.SENTE, promoted: true })).toBe(false);
    });
  });

  describe('mustPromote', () => {
    test('先手の歩が1段目で成らなければならない', () => {
      const fu: Piece = { type: PieceType.FU, player: Player.SENTE };
      expect(mustPromote(fu, { row: 0, col: 4 })).toBe(true);
      expect(mustPromote(fu, { row: 1, col: 4 })).toBe(false);
    });

    test('後手の桂馬が8-9段目で成らなければならない', () => {
      const kei: Piece = { type: PieceType.KEI, player: Player.GOTE };
      expect(mustPromote(kei, { row: 7, col: 4 })).toBe(true);
      expect(mustPromote(kei, { row: 8, col: 4 })).toBe(true);
      expect(mustPromote(kei, { row: 6, col: 4 })).toBe(false);
    });
  });

  describe('canPromoteAt', () => {
    test('先手が敵陣（1-3段目）で成れる', () => {
      expect(canPromoteAt(Player.SENTE, { row: 4, col: 4 }, { row: 2, col: 4 })).toBe(true);
      expect(canPromoteAt(Player.SENTE, { row: 2, col: 4 }, { row: 3, col: 4 })).toBe(true);
      expect(canPromoteAt(Player.SENTE, { row: 3, col: 4 }, { row: 4, col: 4 })).toBe(false);
    });

    test('後手が敵陣（7-9段目）で成れる', () => {
      expect(canPromoteAt(Player.GOTE, { row: 4, col: 4 }, { row: 6, col: 4 })).toBe(true);
      expect(canPromoteAt(Player.GOTE, { row: 6, col: 4 }, { row: 5, col: 4 })).toBe(true);
      expect(canPromoteAt(Player.GOTE, { row: 5, col: 4 }, { row: 4, col: 4 })).toBe(false);
    });
  });

  describe('HandPieces operations', () => {
    test('持ち駒の追加と削除ができる', () => {
      const handPieces = createEmptyHandPieces();
      
      // 追加
      addToHand(handPieces, Player.SENTE, PieceType.FU);
      expect(handPieces[Player.SENTE].get(PieceType.FU)).toBe(1);
      
      addToHand(handPieces, Player.SENTE, PieceType.FU);
      expect(handPieces[Player.SENTE].get(PieceType.FU)).toBe(2);
      
      // 削除
      expect(removeFromHand(handPieces, Player.SENTE, PieceType.FU)).toBe(true);
      expect(handPieces[Player.SENTE].get(PieceType.FU)).toBe(1);
      
      expect(removeFromHand(handPieces, Player.SENTE, PieceType.FU)).toBe(true);
      expect(handPieces[Player.SENTE].has(PieceType.FU)).toBe(false);
      
      // 持っていない駒は削除できない
      expect(removeFromHand(handPieces, Player.SENTE, PieceType.FU)).toBe(false);
    });
  });

  describe('unpromoteForHand', () => {
    test('成り駒を元の駒に戻す', () => {
      expect(unpromoteForHand(PieceType.TO)).toBe(PieceType.FU);
      expect(unpromoteForHand(PieceType.NKYO)).toBe(PieceType.KYO);
      expect(unpromoteForHand(PieceType.NKEI)).toBe(PieceType.KEI);
      expect(unpromoteForHand(PieceType.NGIN)).toBe(PieceType.GIN);
      expect(unpromoteForHand(PieceType.UMA)).toBe(PieceType.KAKU);
      expect(unpromoteForHand(PieceType.RYU)).toBe(PieceType.HI);
    });

    test('成っていない駒はそのまま', () => {
      expect(unpromoteForHand(PieceType.FU)).toBe(PieceType.FU);
      expect(unpromoteForHand(PieceType.KIN)).toBe(PieceType.KIN);
      expect(unpromoteForHand(PieceType.OU)).toBe(PieceType.OU);
    });
  });
});