import { describe, test, expect } from '@jest/globals';
import {
  createNewGame,
  makeMove,
  getGameStatus,
  moveToString,
  gameToKifu,
} from '../game';
import { Player, PieceType, Move, GameState } from '@/types/shogi';
import { setPieceAt, addToHand } from '../board';

describe('Game Logic', () => {
  describe('createNewGame', () => {
    test('初期局面を作成する', () => {
      const game = createNewGame();
      
      expect(game.currentPlayer).toBe(Player.SENTE);
      expect(game.moveHistory).toHaveLength(0);
      
      // 先手の王
      expect(game.board[8][4]).toEqual({ type: PieceType.OU, player: Player.SENTE });
      
      // 後手の王
      expect(game.board[0][4]).toEqual({ type: PieceType.OU, player: Player.GOTE });
      
      // 持ち駒は空
      expect(game.handPieces[Player.SENTE].size).toBe(0);
      expect(game.handPieces[Player.GOTE].size).toBe(0);
    });
  });

  describe('makeMove', () => {
    test('通常の移動ができる', () => {
      const game = createNewGame();
      const move: Move = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      const newGame = makeMove(game, move);
      
      expect(newGame).not.toBeNull();
      expect(newGame!.board[5][6]).toEqual({ type: PieceType.FU, player: Player.SENTE });
      expect(newGame!.board[6][6]).toBeNull();
      expect(newGame!.currentPlayer).toBe(Player.GOTE);
      expect(newGame!.moveHistory).toHaveLength(1);
    });

    test('駒を取る移動ができる', () => {
      const game = createNewGame();
      // 先手の歩を前進
      game.board[3][4] = { type: PieceType.FU, player: Player.SENTE };
      game.board[6][4] = null;
      
      const move: Move = {
        from: { row: 3, col: 4 },
        to: { row: 2, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
        captured: { type: PieceType.FU, player: Player.GOTE },
      };
      
      const newGame = makeMove(game, move);
      
      expect(newGame).not.toBeNull();
      expect(newGame!.board[2][4]).toEqual({ type: PieceType.FU, player: Player.SENTE });
      expect(newGame!.handPieces[Player.SENTE].get(PieceType.FU)).toBe(1);
    });

    test('成る移動ができる', () => {
      const game = createNewGame();
      // 先手の歩を敵陣手前に配置
      game.board[3][4] = { type: PieceType.FU, player: Player.SENTE };
      game.board[6][4] = null;
      
      const move: Move = {
        from: { row: 3, col: 4 },
        to: { row: 2, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
        promote: true,
      };
      
      const newGame = makeMove(game, move);
      
      expect(newGame).not.toBeNull();
      expect(newGame!.board[2][4]).toEqual({ 
        type: PieceType.TO, 
        player: Player.SENTE,
        promoted: true 
      });
    });

    test('持ち駒を打つことができる', () => {
      const game = createNewGame();
      // 通常の初期配置には王がいるが、念のため空盤面で作り直す
      game.board = Array(9).fill(null).map(() => Array(9).fill(null));
      // 王を配置（王手放置チェックのため必要）
      setPieceAt(game.board, { row: 8, col: 4 }, { type: PieceType.OU, player: Player.SENTE });
      setPieceAt(game.board, { row: 0, col: 4 }, { type: PieceType.OU, player: Player.GOTE });
      
      addToHand(game.handPieces, Player.SENTE, PieceType.FU);
      
      const move: Move = {
        from: null,
        to: { row: 4, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      const newGame = makeMove(game, move);
      
      expect(newGame).not.toBeNull();
      expect(newGame!.board[4][4]).toEqual({ type: PieceType.FU, player: Player.SENTE });
      expect(newGame!.handPieces[Player.SENTE].has(PieceType.FU)).toBe(false);
    });

    test('違法手は実行できない', () => {
      const game = createNewGame();
      
      // 歩を2マス進める違法手
      const move: Move = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      const newGame = makeMove(game, move);
      expect(newGame).toBeNull();
    });

    test('成り駒を取ると元の駒として持ち駒になる', () => {
      const game = createNewGame();
      // 後手のと金を配置
      game.board[4][4] = { type: PieceType.TO, player: Player.GOTE, promoted: true };
      // 先手の銀を配置
      game.board[5][5] = { type: PieceType.GIN, player: Player.SENTE };
      
      const move: Move = {
        from: { row: 5, col: 5 },
        to: { row: 4, col: 4 },
        piece: { type: PieceType.GIN, player: Player.SENTE },
        captured: { type: PieceType.TO, player: Player.GOTE, promoted: true },
      };
      
      const newGame = makeMove(game, move);
      
      expect(newGame).not.toBeNull();
      // 歩として持ち駒になる
      expect(newGame!.handPieces[Player.SENTE].get(PieceType.FU)).toBe(1);
      expect(newGame!.handPieces[Player.SENTE].has(PieceType.TO)).toBe(false);
    });
  });

  describe('getGameStatus', () => {
    test('通常の局面では終了していない', () => {
      const game = createNewGame();
      const status = getGameStatus(game);
      
      expect(status.isOver).toBe(false);
      expect(status.winner).toBeNull();
      expect(status.reason).toBeNull();
    });

    test('詰みを検出する', () => {
      const game: GameState = {
        board: createNewGame().board,
        handPieces: createNewGame().handPieces,
        currentPlayer: Player.SENTE,
        moveHistory: [],
      };
      
      // より確実な詰み局面を作成
      game.board = Array(9).fill(null).map(() => Array(9).fill(null));
      setPieceAt(game.board, { row: 8, col: 8 }, { type: PieceType.OU, player: Player.SENTE });
      setPieceAt(game.board, { row: 7, col: 8 }, { type: PieceType.KIN, player: Player.GOTE });
      setPieceAt(game.board, { row: 8, col: 7 }, { type: PieceType.KIN, player: Player.GOTE });
      setPieceAt(game.board, { row: 7, col: 7 }, { type: PieceType.HI, player: Player.GOTE });
      
      const status = getGameStatus(game);
      
      expect(status.isOver).toBe(true);
      expect(status.winner).toBe(Player.GOTE);
      expect(status.reason).toBe('checkmate');
    });
  });

  describe('moveToString', () => {
    test('通常の移動を表記する', () => {
      const move: Move = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      expect(moveToString(move)).toBe('３六歩');
    });

    test('駒を取る移動を表記する', () => {
      const move: Move = {
        from: { row: 3, col: 4 },
        to: { row: 2, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
        captured: { type: PieceType.FU, player: Player.GOTE },
      };
      
      expect(moveToString(move)).toBe('５三歩(取)');
    });

    test('成る移動を表記する', () => {
      const move: Move = {
        from: { row: 3, col: 4 },
        to: { row: 2, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
        promote: true,
      };
      
      expect(moveToString(move)).toBe('５三歩成');
    });

    test('持ち駒を打つ移動を表記する', () => {
      const move: Move = {
        from: null,
        to: { row: 4, col: 4 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      expect(moveToString(move)).toBe('５五歩打');
    });
  });

  describe('gameToKifu', () => {
    test('棋譜を文字列に変換する', () => {
      const game = createNewGame();
      
      const move1: Move = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: { type: PieceType.FU, player: Player.SENTE },
      };
      
      const move2: Move = {
        from: { row: 2, col: 2 },
        to: { row: 3, col: 2 },
        piece: { type: PieceType.FU, player: Player.GOTE },
      };
      
      game.moveHistory.push(move1, move2);
      
      const kifu = gameToKifu(game);
      
      expect(kifu).toBe('1. ３六歩\n2. ７四歩');
    });
  });
});