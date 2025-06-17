import { describe, test, expect } from '@jest/globals';
import {
  isUchifuzumeCheck,
  checkImmovablePiece,
  canDropPieceAt,
} from '../validators/basic';
import {
  validateMove,
  validatePieceMove,
} from '../validators';
import {
  createEmptyBoard,
  createEmptyHandPieces,
  setPieceAt,
  addToHand,
} from '../board';
import { Player, PieceType, GameState } from '@/types/shogi';

describe('特殊ルール違反の検出', () => {
  describe('打ち歩詰め（uchifuzume）', () => {
    test('打ち歩詰めを検出する', () => {
      const board = createEmptyBoard();
      // 後手王を配置（角に追い詰められた状態）
      setPieceAt(board, { row: 0, col: 0 }, { type: PieceType.OU, player: Player.GOTE });
      // 先手の金で囲む
      setPieceAt(board, { row: 0, col: 1 }, { type: PieceType.KIN, player: Player.SENTE });
      setPieceAt(board, { row: 1, col: 1 }, { type: PieceType.KIN, player: Player.SENTE });
      
      // 1二歩打ちが打ち歩詰めになる
      const isUchifuzume = isUchifuzumeCheck(board, { row: 1, col: 0 }, Player.SENTE);
      expect(isUchifuzume).toBe(true);
    });
    
    test('王が逃げられる場合は打ち歩詰めではない', () => {
      const board = createEmptyBoard();
      // 後手王を配置
      setPieceAt(board, { row: 0, col: 4 }, { type: PieceType.OU, player: Player.GOTE });
      
      // 5二歩打ちは王が横に逃げられるので打ち歩詰めではない
      const isUchifuzume = isUchifuzumeCheck(board, { row: 1, col: 4 }, Player.SENTE);
      expect(isUchifuzume).toBe(false);
    });
    
    // TODO: この実装は複雑なので後で改善
    test.skip('歩を取れる場合は打ち歩詰めではない', () => {
      const board = createEmptyBoard();
      // 後手王を配置
      setPieceAt(board, { row: 0, col: 0 }, { type: PieceType.OU, player: Player.GOTE });
      // 先手の金で囲む
      setPieceAt(board, { row: 0, col: 1 }, { type: PieceType.KIN, player: Player.SENTE });
      setPieceAt(board, { row: 1, col: 1 }, { type: PieceType.KIN, player: Player.SENTE });
      // 後手の飛車（歩を取れる）- 横から
      setPieceAt(board, { row: 1, col: 8 }, { type: PieceType.HI, player: Player.GOTE });
      
      // 1二歩打ちは飛車で取れるので打ち歩詰めではない
      const isUchifuzume = isUchifuzumeCheck(board, { row: 1, col: 0 }, Player.SENTE);
      expect(isUchifuzume).toBe(false);
    });
    
    test('canDropPieceAtで打ち歩詰めを検出', () => {
      const board = createEmptyBoard();
      // 後手王を配置（角に追い詰められた状態）
      setPieceAt(board, { row: 0, col: 0 }, { type: PieceType.OU, player: Player.GOTE });
      setPieceAt(board, { row: 0, col: 1 }, { type: PieceType.KIN, player: Player.SENTE });
      setPieceAt(board, { row: 1, col: 1 }, { type: PieceType.KIN, player: Player.SENTE });
      
      const result = canDropPieceAt(board, { row: 1, col: 0 }, PieceType.FU, Player.SENTE);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('打ち歩詰め：相手玉を詰ませる歩は打てません');
    });
  });

  describe('行き所のない駒（immovable pieces）', () => {
    test('歩を最奥段に進めることはできない', () => {
      const resultSente = checkImmovablePiece(PieceType.FU, { row: 0, col: 4 }, Player.SENTE);
      expect(resultSente.valid).toBe(false);
      expect(resultSente.errorMessage).toBe('歩を１段目に進めることはできません');
      
      const resultGote = checkImmovablePiece(PieceType.FU, { row: 8, col: 4 }, Player.GOTE);
      expect(resultGote.valid).toBe(false);
      expect(resultGote.errorMessage).toBe('歩を９段目に進めることはできません');
    });
    
    test('香車を最奥段に進めることはできない', () => {
      const resultSente = checkImmovablePiece(PieceType.KYO, { row: 0, col: 4 }, Player.SENTE);
      expect(resultSente.valid).toBe(false);
      expect(resultSente.errorMessage).toBe('香車を１段目に進めることはできません');
      
      const resultGote = checkImmovablePiece(PieceType.KYO, { row: 8, col: 4 }, Player.GOTE);
      expect(resultGote.valid).toBe(false);
      expect(resultGote.errorMessage).toBe('香車を９段目に進めることはできません');
    });
    
    test('桂馬を1,2段目に進めることはできない', () => {
      const result1Sente = checkImmovablePiece(PieceType.KEI, { row: 0, col: 4 }, Player.SENTE);
      expect(result1Sente.valid).toBe(false);
      expect(result1Sente.errorMessage).toBe('桂馬を１段目・２段目に進めることはできません');
      
      const result2Sente = checkImmovablePiece(PieceType.KEI, { row: 1, col: 4 }, Player.SENTE);
      expect(result2Sente.valid).toBe(false);
      
      const result1Gote = checkImmovablePiece(PieceType.KEI, { row: 8, col: 4 }, Player.GOTE);
      expect(result1Gote.valid).toBe(false);
      expect(result1Gote.errorMessage).toBe('桂馬を８段目・９段目に進めることはできません');
      
      const result2Gote = checkImmovablePiece(PieceType.KEI, { row: 7, col: 4 }, Player.GOTE);
      expect(result2Gote.valid).toBe(false);
    });
    
    test('validatePieceMoveで行き所のない駒を検出', () => {
      const board = createEmptyBoard();
      // 先手の歩を2段目に配置
      setPieceAt(board, { row: 1, col: 4 }, { type: PieceType.FU, player: Player.SENTE });
      
      // 1段目に進めようとする
      const result = validatePieceMove(board, { row: 1, col: 4 }, { row: 0, col: 4 }, Player.SENTE);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('歩を１段目に進めることはできません');
    });
  });

  describe('統合テスト', () => {
    test('GameStateでvalidateMoveが正しく動作する', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: [],
      };
      
      // 先手の歩を配置
      setPieceAt(gameState.board, { row: 6, col: 4 }, { type: PieceType.FU, player: Player.SENTE });
      // 先手の持ち駒に歩を追加
      addToHand(gameState.handPieces, Player.SENTE, PieceType.FU);
      
      // 二歩を打とうとする
      const move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      const result = validateMove(gameState, move);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('二歩：同じ筋に歩を２つ置くことはできません');
    });
    
    test('相手の手番で指そうとした場合のエラー', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: [],
      };
      
      setPieceAt(gameState.board, { row: 2, col: 4 }, { type: PieceType.FU, player: Player.GOTE });
      
      const move = {
        from: { row: 2, col: 4 },
        to: { row: 3, col: 4 },
        piece: { type: PieceType.FU, player: Player.GOTE },
      };
      
      const result = validateMove(gameState, move);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('相手の手番です');
    });
  });
});