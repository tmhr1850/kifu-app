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
  getRemainingDays,
  PausedGame
} from '../storageService';
import { KifuRecord } from '@/types/kifu';
import { Player, GameState } from '@/types/shogi';

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
          moves: [1, 2, 3],
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
          moves: [1, 2],
          createdAt: '2024-01-16T11:00:00Z',
          updatedAt: '2024-01-16T11:00:00Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(records));

      const metadata = listKifuRecords();
      expect(metadata).toHaveLength(2);
      // Records are sorted by updatedAt (latest first)
      expect(metadata[0].moveCount).toBe(2); // 2024-01-16 record
      expect(metadata[1].moveCount).toBe(3); // 2024-01-15 record
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

  describe('Paused Games', () => {
    const createMockPausedGame = (id: string, pausedAt: string): PausedGame => ({
      id,
      gameState: {} as GameState,
      kifuRecord: {
        id: `kifu-${id}`,
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: 'Player 1',
          gote: 'Player 2'
        },
        moves: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      pausedAt,
      gameMode: 'local'
    });

    describe('savePausedGame', () => {
      it('should save a paused game', () => {
        const pausedGame = createMockPausedGame('pause-1', '2024-01-15T10:00:00Z');
        
        localStorageMock.getItem.mockReturnValue('[]');
        
        savePausedGame(pausedGame);
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'paused_games',
          expect.any(String)
        );
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe('pause-1');
      });

      it('should update existing paused game', () => {
        const existingGames = [
          createMockPausedGame('pause-1', '2024-01-15T10:00:00Z'),
          createMockPausedGame('pause-2', '2024-01-15T11:00:00Z')
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingGames));
        
        const updatedGame = createMockPausedGame('pause-1', '2024-01-15T12:00:00Z');
        savePausedGame(updatedGame);
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(2);
        expect(savedData[0].pausedAt).toBe('2024-01-15T12:00:00Z');
      });
    });

    describe('loadPausedGame', () => {
      it('should load a specific paused game', () => {
        const games = [
          createMockPausedGame('pause-1', '2024-01-15T10:00:00Z'),
          createMockPausedGame('pause-2', '2024-01-15T11:00:00Z')
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(games));
        
        const game = loadPausedGame('pause-2');
        expect(game).toBeDefined();
        expect(game?.id).toBe('pause-2');
      });

      it('should return null if game not found', () => {
        localStorageMock.getItem.mockReturnValue('[]');
        
        const game = loadPausedGame('non-existent');
        expect(game).toBeNull();
      });
    });

    describe('listPausedGames', () => {
      it('should return list of paused games sorted by date', () => {
        const games = [
          createMockPausedGame('pause-1', '2024-01-15T10:00:00Z'),
          createMockPausedGame('pause-2', '2024-01-15T12:00:00Z'),
          createMockPausedGame('pause-3', '2024-01-15T11:00:00Z')
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(games));
        
        const sortedGames = listPausedGames();
        expect(sortedGames).toHaveLength(3);
        expect(sortedGames[0].id).toBe('pause-2'); // Latest first
        expect(sortedGames[1].id).toBe('pause-3');
        expect(sortedGames[2].id).toBe('pause-1');
      });
    });

    describe('deletePausedGame', () => {
      it('should delete a specific paused game', () => {
        const games = [
          createMockPausedGame('pause-1', '2024-01-15T10:00:00Z'),
          createMockPausedGame('pause-2', '2024-01-15T11:00:00Z')
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(games));
        
        const result = deletePausedGame('pause-1');
        expect(result).toBe(true);
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe('pause-2');
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
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        
        const games = [
          createMockPausedGame('pause-1', tenDaysAgo.toISOString()),
          createMockPausedGame('pause-2', fiveDaysAgo.toISOString()),
          createMockPausedGame('pause-3', yesterday.toISOString())
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(games));
        
        const deletedCount = deleteExpiredPausedGames(7); // 7 days expiration
        expect(deletedCount).toBe(1); // Only the 10-days-old game should be deleted
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(savedData).toHaveLength(2);
        expect(savedData.find((g: PausedGame) => g.id === 'pause-1')).toBeUndefined();
      });

      it('should return 0 if no games expired', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        
        const games = [
          createMockPausedGame('pause-1', yesterday.toISOString()),
          createMockPausedGame('pause-2', now.toISOString())
        ];
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(games));
        
        const deletedCount = deleteExpiredPausedGames(7);
        expect(deletedCount).toBe(0);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });
    });

    describe('getRemainingDays', () => {
      it('should calculate remaining days correctly', () => {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        
        const remainingDays = getRemainingDays(twoDaysAgo.toISOString(), 7);
        expect(remainingDays).toBe(5);
      });

      it('should return 0 for expired games', () => {
        const now = new Date();
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        
        const remainingDays = getRemainingDays(tenDaysAgo.toISOString(), 7);
        expect(remainingDays).toBe(0);
      });

      it('should round up partial days', () => {
        const now = new Date();
        const almostSixDaysAgo = new Date(now.getTime() - (6 * 24 - 1) * 60 * 60 * 1000);
        
        const remainingDays = getRemainingDays(almostSixDaysAgo.toISOString(), 7);
        expect(remainingDays).toBe(2); // Should round up
      });
    });
  });
});