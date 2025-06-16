import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createNewGameWithKifu,
  makeMoveWithKifu,
  endGameWithKifu,
  saveCurrentGame,
  loadGameFromKifu
} from '../gameWithKifu';
import { Player, PieceType } from '@/types/shogi';
import * as storageService from '../storageService';

// Mock the storage service
jest.mock('../storageService');
const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

describe('Game with Kifu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock createNewKifuRecord to return a consistent ID
    mockedStorageService.createNewKifuRecord.mockReturnValue({
      id: 'test-kifu-id',
      gameInfo: {
        date: '2024/01/15',
        startTime: '10:00:00',
        sente: 'Player 1',
        gote: 'Player 2'
      },
      moves: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    });
  });

  describe('createNewGameWithKifu', () => {
    it('should create a new game with kifu record', () => {
      const gameWithKifu = createNewGameWithKifu({
        sente: 'Tanaka',
        gote: 'Suzuki'
      });

      expect(gameWithKifu).toBeDefined();
      expect(gameWithKifu.gameState).toBeDefined();
      expect(gameWithKifu.kifuRecord).toBeDefined();
      expect(mockedStorageService.saveKifuRecord).toHaveBeenCalledWith(gameWithKifu.kifuRecord);
    });
  });

  describe('makeMoveWithKifu', () => {
    it('should make a move and update kifu record', () => {
      const gameWithKifu = createNewGameWithKifu();
      
      const move = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: { type: PieceType.FU, player: Player.SENTE }
      };

      const newGameWithKifu = makeMoveWithKifu(gameWithKifu, move);

      expect(newGameWithKifu).toBeDefined();
      expect(newGameWithKifu?.kifuRecord.moves).toHaveLength(1);
      expect(newGameWithKifu?.kifuRecord.moves[0]).toEqual({
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE
      });
      expect(mockedStorageService.saveKifuRecord).toHaveBeenCalledTimes(2); // Once on create, once on move
    });

    it('should return null for invalid move', () => {
      const gameWithKifu = createNewGameWithKifu();
      
      const invalidMove = {
        from: { row: 0, col: 0 },
        to: { row: 5, col: 5 },
        piece: { type: PieceType.FU, player: Player.SENTE }
      };

      const result = makeMoveWithKifu(gameWithKifu, invalidMove);
      expect(result).toBeNull();
    });
  });

  describe('endGameWithKifu', () => {
    it('should record game result', () => {
      const gameWithKifu = createNewGameWithKifu();
      
      endGameWithKifu(gameWithKifu, 'sente_win');

      const lastCall = mockedStorageService.saveKifuRecord.mock.calls[mockedStorageService.saveKifuRecord.mock.calls.length - 1];
      const savedRecord = lastCall[0];
      
      expect(savedRecord.gameInfo.result).toBe('sente_win');
      expect(savedRecord.gameInfo.endTime).toBeDefined();
    });
  });

  describe('saveCurrentGame', () => {
    it('should save current game state', () => {
      const gameWithKifu = createNewGameWithKifu();
      jest.clearAllMocks(); // Clear the initial save
      
      saveCurrentGame(gameWithKifu);
      
      expect(mockedStorageService.saveKifuRecord).toHaveBeenCalledTimes(1);
      expect(mockedStorageService.saveKifuRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-kifu-id'
        })
      );
    });
  });

  describe('loadGameFromKifu', () => {
    it('should load game from kifu record', () => {
      const kifuRecord = {
        id: 'test-kifu-id',
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: 'Tanaka',
          gote: 'Suzuki'
        },
        moves: [
          {
            from: { row: 6, col: 6 },
            to: { row: 5, col: 6 },
            piece: '歩',
            player: Player.SENTE
          },
          {
            from: { row: 2, col: 2 },
            to: { row: 3, col: 2 },
            piece: '歩',
            player: Player.GOTE
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      mockedStorageService.loadKifuRecord.mockReturnValue(kifuRecord);

      const gameWithKifu = loadGameFromKifu('test-kifu-id');

      expect(gameWithKifu).toBeDefined();
      expect(gameWithKifu?.kifuRecord).toEqual(kifuRecord);
      expect(gameWithKifu?.gameState.moveHistory).toHaveLength(2);
      expect(gameWithKifu?.gameState.currentPlayer).toBe(Player.SENTE);
    });

    it('should return null if kifu not found', () => {
      mockedStorageService.loadKifuRecord.mockReturnValue(null);

      const result = loadGameFromKifu('non-existent');
      expect(result).toBeNull();
    });
  });
});