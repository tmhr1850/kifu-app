import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveKifuRecord,
  loadKifuRecord,
  listKifuRecords,
  deleteKifuRecord,
  importKifFromText,
  exportKifToText,
  savePausedGame,
  loadPausedGame,
  listPausedGames,
  deletePausedGame,
  deleteExpiredPausedGames,
  PausedGame
} from '../storageService';
import { KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('saveKifuRecord', () => {
    it('should save a kifu record to localStorage', () => {
      const record: KifuRecord = {
        id: 'test-id',
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: '先手太郎',
          gote: '後手花子'
        },
        moves: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      localStorageMock.getItem.mockReturnValue('[]');
      
      saveKifuRecord(record);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kifu_records',
        expect.any(String)
      );
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('test-id');
    });

    it('should update existing record if ID matches', () => {
      const existingRecords = [
        { id: 'test-id', gameInfo: { sente: 'Old Name' } },
        { id: 'other-id', gameInfo: { sente: 'Other' } }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingRecords));

      const updatedRecord: KifuRecord = {
        id: 'test-id',
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: 'New Name',
          gote: '後手花子'
        },
        moves: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z'
      };

      saveKifuRecord(updatedRecord);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].gameInfo.sente).toBe('New Name');
      expect(savedData[1].id).toBe('other-id');
    });
  });

  describe('loadKifuRecord', () => {
    it('should load a specific kifu record by ID', () => {
      const records = [
        { id: 'test-id-1', gameInfo: { sente: 'Player 1' } },
        { id: 'test-id-2', gameInfo: { sente: 'Player 2' } }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(records));

      const record = loadKifuRecord('test-id-2');
      expect(record).toBeDefined();
      expect(record?.id).toBe('test-id-2');
      expect(record?.gameInfo.sente).toBe('Player 2');
    });

    it('should return null if record not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const record = loadKifuRecord('non-existent');
      expect(record).toBeNull();
    });
  });

  describe('listKifuRecords', () => {
    it('should return list of kifu metadata', () => {
      const records = [
        {
          id: 'test-id-1',
          gameInfo: { 
            date: '2024/01/15',
            startTime: '10:00:00',
            sente: 'Player 1',
            gote: 'Player 2'
          },
          moves: [{}, {}, {}], // 3 moves
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'test-id-2',
          gameInfo: {
            date: '2024/01/16',
            startTime: '11:00:00',
            sente: 'Player 3',
            gote: 'Player 4'
          },
          moves: [{}, {}], // 2 moves
          createdAt: '2024-01-16T11:00:00Z',
          updatedAt: '2024-01-16T12:00:00Z' // Later time for sorting
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(records));

      const metadata = listKifuRecords();
      expect(metadata).toHaveLength(2);
      // test-id-2 comes first because it has a later updatedAt
      expect(metadata[0].moveCount).toBe(2);
      expect(metadata[1].moveCount).toBe(3);
    });

    it('should return empty array if no records', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const metadata = listKifuRecords();
      expect(metadata).toEqual([]);
    });
  });

  describe('deleteKifuRecord', () => {
    it('should delete a specific kifu record', () => {
      const records = [
        { id: 'test-id-1' },
        { id: 'test-id-2' },
        { id: 'test-id-3' }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(records));

      const result = deleteKifuRecord('test-id-2');
      expect(result).toBe(true);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData.find((r: KifuRecord) => r.id === 'test-id-2')).toBeUndefined();
    });

    it('should return false if record not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = deleteKifuRecord('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('importKifFromText', () => {
    it('should import KIF text and save as record', () => {
      const kifText = `# ---- Kifu for Windows ----
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子
手合割：平手
手数----指手---------消費時間--
   1 ７六歩(77)
   2 ３四歩(33)
`;

      localStorageMock.getItem.mockReturnValue('[]');
      
      const record = importKifFromText(kifText);
      
      expect(record).toBeDefined();
      expect(record.gameInfo.sente).toBe('先手太郎');
      expect(record.gameInfo.gote).toBe('後手花子');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('exportKifToText', () => {
    it('should export a kifu record to KIF text', () => {
      const record: KifuRecord = {
        id: 'test-id',
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: '先手太郎',
          gote: '後手花子'
        },
        moves: [
          {
            from: { row: 6, col: 6 },
            to: { row: 5, col: 6 },
            piece: '歩',
            player: Player.SENTE
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      const records = [record];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(records));

      const kifText = exportKifToText('test-id');
      
      expect(kifText).toContain('先手：先手太郎');
      expect(kifText).toContain('後手：後手花子');
      expect(kifText).toContain('歩');
    });

    it('should return null if record not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const kifText = exportKifToText('non-existent');
      expect(kifText).toBeNull();
    });
  });

  describe('Paused Game Functions', () => {
    const mockPausedGame: PausedGame = {
      id: 'paused-game-1',
      gameState: {
        board: [],
        handPieces: {
          SENTE: new Map(),
          GOTE: new Map()
        },
        currentPlayer: Player.SENTE,
        moveHistory: []
      },
      kifuRecord: {
        id: 'paused-game-1',
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: '先手太郎',
          gote: '後手花子'
        },
        moves: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      pausedAt: new Date().toISOString(),
      gameMode: 'local'
    };

    describe('savePausedGame', () => {
      it('should save a paused game', () => {
        localStorageMock.getItem.mockReturnValue('[]');
        
        savePausedGame(mockPausedGame);
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'paused_games',
          expect.any(String)
        );
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe('paused-game-1');
      });

      it('should update existing paused game', () => {
        const existingGames = [
          { id: 'paused-game-1', pausedAt: '2024-01-01T00:00:00Z' },
          { id: 'paused-game-2', pausedAt: '2024-01-02T00:00:00Z' }
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingGames));
        
        savePausedGame(mockPausedGame);
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(2);
        expect(savedData[0].pausedAt).toBe(mockPausedGame.pausedAt);
      });
    });

    describe('loadPausedGame', () => {
      it('should load a paused game by ID', () => {
        const pausedGames = [mockPausedGame];
        localStorageMock.getItem.mockReturnValue(JSON.stringify(pausedGames));
        
        const loaded = loadPausedGame('paused-game-1');
        
        expect(loaded).toBeDefined();
        expect(loaded?.id).toBe('paused-game-1');
      });

      it('should return null if game not found', () => {
        localStorageMock.getItem.mockReturnValue('[]');
        
        const loaded = loadPausedGame('non-existent');
        
        expect(loaded).toBeNull();
      });
    });

    describe('listPausedGames', () => {
      it('should return sorted list of paused games', () => {
        const pausedGames = [
          { ...mockPausedGame, id: 'game-1', pausedAt: '2024-01-01T00:00:00Z' },
          { ...mockPausedGame, id: 'game-2', pausedAt: '2024-01-03T00:00:00Z' },
          { ...mockPausedGame, id: 'game-3', pausedAt: '2024-01-02T00:00:00Z' }
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(pausedGames));
        
        const list = listPausedGames();
        
        expect(list).toHaveLength(3);
        expect(list[0].id).toBe('game-2'); // 最新が最初
        expect(list[1].id).toBe('game-3');
        expect(list[2].id).toBe('game-1');
      });
    });

    describe('deletePausedGame', () => {
      it('should delete a paused game', () => {
        const pausedGames = [
          { id: 'game-1' },
          { id: 'game-2' },
          { id: 'game-3' }
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(pausedGames));
        
        const result = deletePausedGame('game-2');
        
        expect(result).toBe(true);
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(2);
        expect(savedData.find((g: { id: string }) => g.id === 'game-2')).toBeUndefined();
      });

      it('should return false if game not found', () => {
        localStorageMock.getItem.mockReturnValue('[]');
        
        const result = deletePausedGame('non-existent');
        
        expect(result).toBe(false);
      });
    });

    describe('deleteExpiredPausedGames', () => {
      it('should delete games older than expiration days', () => {
        const now = new Date();
        const oldDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8日前
        const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2日前
        
        const pausedGames = [
          { ...mockPausedGame, id: 'old-game', pausedAt: oldDate.toISOString() },
          { ...mockPausedGame, id: 'recent-game', pausedAt: recentDate.toISOString() }
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(pausedGames));
        
        const deletedCount = deleteExpiredPausedGames(7); // 7日間の期限
        
        expect(deletedCount).toBe(1);
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe('recent-game');
      });

      it('should not modify storage if no expired games', () => {
        const recentDate = new Date();
        
        const pausedGames = [
          { ...mockPausedGame, id: 'recent-game-1', pausedAt: recentDate.toISOString() },
          { ...mockPausedGame, id: 'recent-game-2', pausedAt: recentDate.toISOString() }
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(pausedGames));
        
        const deletedCount = deleteExpiredPausedGames(7);
        
        expect(deletedCount).toBe(0);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });
    });
  });
});