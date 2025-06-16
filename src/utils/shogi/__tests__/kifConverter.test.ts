import { describe, it, expect } from '@jest/globals';
import { 
  moveToKif, 
  kifToMove, 
  gameToKifFormat,
  kifFormatToGame,
  formatKifHeader
} from '../kifConverter';
import { KifuMove, GameInfo, KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';

describe('KIF Converter', () => {
  describe('moveToKif', () => {
    it('should convert a simple move to KIF notation', () => {
      const move: KifuMove = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(moveToKif(move, 1)).toBe('   1 ７六歩(77)');
    });

    it('should convert a drop move to KIF notation', () => {
      const move: KifuMove = {
        to: { row: 4, col: 4 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(moveToKif(move, 2)).toBe('   2 ５五歩打');
    });

    it('should convert a promotion move to KIF notation', () => {
      const move: KifuMove = {
        from: { row: 2, col: 7 },
        to: { row: 1, col: 7 },
        piece: '銀',
        promote: true,
        player: Player.SENTE
      };
      expect(moveToKif(move, 3)).toBe('   3 ２一銀成(22)');
    });

    it('should include time if provided', () => {
      const move: KifuMove = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE,
        time: 15
      };
      expect(moveToKif(move, 1)).toBe('   1 ７六歩(77)   ( 0:15/00:00:15)');
    });
  });

  describe('kifToMove', () => {
    it('should parse a simple KIF move', () => {
      const kifMove = '   1 ７六歩(77)';
      const expected: KifuMove = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(kifToMove(kifMove, Player.SENTE)).toEqual(expected);
    });

    it('should parse a drop move', () => {
      const kifMove = '   2 ５五歩打';
      const expected: KifuMove = {
        to: { row: 4, col: 4 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(kifToMove(kifMove, Player.GOTE)).toEqual(expected);
    });

    it('should parse a promotion move', () => {
      const kifMove = '   3 ２一銀成(22)';
      const expected: KifuMove = {
        from: { row: 2, col: 7 },
        to: { row: 1, col: 7 },
        piece: '銀',
        promote: true,
        player: Player.SENTE
      };
      expect(kifToMove(kifMove, Player.SENTE)).toEqual(expected);
    });

    it('should parse move with time', () => {
      const kifMove = '   1 ７六歩(77)   ( 0:15/00:00:15)';
      const move = kifToMove(kifMove, Player.SENTE);
      expect(move.time).toBe(15);
    });
  });

  describe('formatKifHeader', () => {
    it('should format game info into KIF headers', () => {
      const gameInfo: GameInfo = {
        date: '2024/01/15',
        startTime: '10:00:00',
        endTime: '11:30:00',
        sente: '先手太郎',
        gote: '後手花子',
        event: '練習対局',
        site: 'オンライン',
        result: 'sente_win'
      };

      const headers = formatKifHeader(gameInfo);
      expect(headers['開始日時']).toBe('2024/01/15 10:00:00');
      expect(headers['終了日時']).toBe('2024/01/15 11:30:00');
      expect(headers['先手']).toBe('先手太郎');
      expect(headers['後手']).toBe('後手花子');
      expect(headers['棋戦']).toBe('練習対局');
      expect(headers['場所']).toBe('オンライン');
    });
  });

  describe('gameToKifFormat', () => {
    it('should convert a game record to KIF format', () => {
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

      const kif = gameToKifFormat(record);
      expect(kif).toContain('開始日時：2024/01/15 10:00:00');
      expect(kif).toContain('先手：先手太郎');
      expect(kif).toContain('後手：後手花子');
      expect(kif).toContain('   1 ７六歩(77)');
      expect(kif).toContain('   2 ３四歩(33)');
    });
  });

  describe('kifFormatToGame', () => {
    it('should parse KIF format to game record', () => {
      const kif = `# ---- Kifu for Windows ----
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子
手合割：平手
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:15/00:00:15)
   2 ３四歩(33)   ( 0:10/00:00:10)
   3 ２六歩(27)   ( 0:12/00:00:27)
`;

      const result = kifFormatToGame(kif);
      expect(result.gameInfo.sente).toBe('先手太郎');
      expect(result.gameInfo.gote).toBe('後手花子');
      expect(result.moves).toHaveLength(3);
      expect(result.moves[0].piece).toBe('歩');
      expect(result.moves[0].to).toEqual({ row: 5, col: 6 });
    });

    it('should handle comments in KIF format', () => {
      const kif = `# ---- Kifu for Windows ----
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:15/00:00:15)
*初手は歩から
   2 ３四歩(33)   ( 0:10/00:00:10)
`;

      const result = kifFormatToGame(kif);
      expect(result.moves[0].comment).toBe('初手は歩から');
    });
  });
});