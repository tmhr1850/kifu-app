import { describe, test, expect } from '@jest/globals';
import { getPieceValidMoves } from '../pieces';
import { createEmptyBoard, setPieceAt } from '../board';
import { Player, PieceType, Position } from '@/types/shogi';

describe('Piece Movements', () => {
  describe('歩兵（FU）', () => {
    test('先手の歩は前に1マス移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 6, col: 4 };
      setPieceAt(board, pos, { type: PieceType.FU, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.FU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(1);
      expect(moves[0]).toEqual({ row: 5, col: 4 });
    });

    test('後手の歩は前（下）に1マス移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 2, col: 4 };
      setPieceAt(board, pos, { type: PieceType.FU, player: Player.GOTE });
      
      const moves = getPieceValidMoves(PieceType.FU, board, pos, Player.GOTE);
      expect(moves).toHaveLength(1);
      expect(moves[0]).toEqual({ row: 3, col: 4 });
    });

    test('前に味方の駒があると移動できない', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 6, col: 4 };
      setPieceAt(board, pos, { type: PieceType.FU, player: Player.SENTE });
      setPieceAt(board, { row: 5, col: 4 }, { type: PieceType.FU, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.FU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(0);
    });
  });

  describe('香車（KYO）', () => {
    test('先手の香車は前に何マスでも移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 8, col: 0 };
      setPieceAt(board, pos, { type: PieceType.KYO, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.KYO, board, pos, Player.SENTE);
      expect(moves).toHaveLength(8);
      expect(moves[0]).toEqual({ row: 7, col: 0 });
      expect(moves[7]).toEqual({ row: 0, col: 0 });
    });

    test('途中に駒があるとそこまでしか移動できない', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 8, col: 0 };
      setPieceAt(board, pos, { type: PieceType.KYO, player: Player.SENTE });
      setPieceAt(board, { row: 5, col: 0 }, { type: PieceType.FU, player: Player.GOTE });
      
      const moves = getPieceValidMoves(PieceType.KYO, board, pos, Player.SENTE);
      expect(moves).toHaveLength(3); // 7,6,5段目まで（5段目の敵駒は取れる）
    });
  });

  describe('桂馬（KEI）', () => {
    test('先手の桂馬は前方2マス、横1マスに移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 8, col: 1 };
      setPieceAt(board, pos, { type: PieceType.KEI, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.KEI, board, pos, Player.SENTE);
      expect(moves).toHaveLength(2);
      expect(moves).toContainEqual({ row: 6, col: 0 });
      expect(moves).toContainEqual({ row: 6, col: 2 });
    });

    test('移動先が盤外の場合は移動できない', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 8, col: 0 };
      setPieceAt(board, pos, { type: PieceType.KEI, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.KEI, board, pos, Player.SENTE);
      expect(moves).toHaveLength(1); // 右前のみ
      expect(moves[0]).toEqual({ row: 6, col: 1 });
    });
  });

  describe('銀将（GIN）', () => {
    test('銀将は前方3方向と斜め後ろ2方向に移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.GIN, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.GIN, board, pos, Player.SENTE);
      expect(moves).toHaveLength(5);
      expect(moves).toContainEqual({ row: 3, col: 4 }); // 前
      expect(moves).toContainEqual({ row: 3, col: 3 }); // 左前
      expect(moves).toContainEqual({ row: 3, col: 5 }); // 右前
      expect(moves).toContainEqual({ row: 5, col: 3 }); // 左後ろ
      expect(moves).toContainEqual({ row: 5, col: 5 }); // 右後ろ
    });
  });

  describe('金将（KIN）', () => {
    test('金将は前方3方向、横2方向、後ろ1方向に移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.KIN, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.KIN, board, pos, Player.SENTE);
      expect(moves).toHaveLength(6);
      expect(moves).toContainEqual({ row: 3, col: 4 }); // 前
      expect(moves).toContainEqual({ row: 3, col: 3 }); // 左前
      expect(moves).toContainEqual({ row: 3, col: 5 }); // 右前
      expect(moves).toContainEqual({ row: 4, col: 3 }); // 左
      expect(moves).toContainEqual({ row: 4, col: 5 }); // 右
      expect(moves).toContainEqual({ row: 5, col: 4 }); // 後ろ
    });
  });

  describe('角行（KAKU）', () => {
    test('角行は斜め4方向に何マスでも移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.KAKU, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.KAKU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(16); // 斜め4方向の合計
    });

    test('途中に駒があるとそこまでしか移動できない', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.KAKU, player: Player.SENTE });
      setPieceAt(board, { row: 2, col: 2 }, { type: PieceType.FU, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.KAKU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(13); // 左上方向が2マス減る
      expect(moves).not.toContainEqual({ row: 2, col: 2 }); // 味方の駒
      expect(moves).not.toContainEqual({ row: 1, col: 1 }); // その先
    });
  });

  describe('飛車（HI）', () => {
    test('飛車は縦横4方向に何マスでも移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.HI, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.HI, board, pos, Player.SENTE);
      expect(moves).toHaveLength(16); // 縦横4方向の合計
    });
  });

  describe('王将（OU）', () => {
    test('王将は8方向に1マスずつ移動できる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.OU, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.OU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(8);
    });

    test('盤端では移動方向が制限される', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 0, col: 0 };
      setPieceAt(board, pos, { type: PieceType.OU, player: Player.SENTE });
      
      const moves = getPieceValidMoves(PieceType.OU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(3); // 右、下、右下のみ
    });
  });

  describe('成り駒', () => {
    test('と金は金将と同じ動きができる', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.TO, player: Player.SENTE, promoted: true });
      
      const moves = getPieceValidMoves(PieceType.TO, board, pos, Player.SENTE);
      expect(moves).toHaveLength(6);
    });

    test('龍馬（成角）は角行の動き＋1マス前後左右', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.UMA, player: Player.SENTE, promoted: true });
      
      const moves = getPieceValidMoves(PieceType.UMA, board, pos, Player.SENTE);
      expect(moves).toHaveLength(20); // 斜め16マス + 前後左右4マス
    });

    test('龍王（成飛）は飛車の動き＋斜め1マス', () => {
      const board = createEmptyBoard();
      const pos: Position = { row: 4, col: 4 };
      setPieceAt(board, pos, { type: PieceType.RYU, player: Player.SENTE, promoted: true });
      
      const moves = getPieceValidMoves(PieceType.RYU, board, pos, Player.SENTE);
      expect(moves).toHaveLength(20); // 縦横16マス + 斜め4マス
    });
  });
});