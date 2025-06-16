import { describe, it, expect } from '@jest/globals';
import {
  moveToKi2,
  ki2ToMove,
  gameToKi2Format,
  ki2FormatToGame
} from '../ki2Converter';
import { KifuMove, KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';

describe('KI2 Converter', () => {
  describe('moveToKi2', () => {
    it('should convert a simple move to KI2 notation', () => {
      const move: KifuMove = {
        from: { row: 6, col: 2 },
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(moveToKi2(move, null)).toBe('☗７六歩');
    });

    it('should convert a move with same destination', () => {
      const move: KifuMove = {
        from: { row: 7, col: 1 },
        to: { row: 5, col: 2 },
        piece: '角',
        player: Player.SENTE
      };
      const prevMove: KifuMove = {
        from: { row: 6, col: 2 },
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(moveToKi2(move, prevMove)).toBe('☗同角');
    });

    it('should convert a drop move to KI2 notation', () => {
      const move: KifuMove = {
        to: { row: 4, col: 4 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(moveToKi2(move, null)).toBe('☖５五歩打');
    });

    it('should convert a promotion move to KI2 notation', () => {
      const move: KifuMove = {
        from: { row: 1, col: 7 },
        to: { row: 0, col: 7 },
        piece: '銀',
        promote: true,
        player: Player.SENTE
      };
      expect(moveToKi2(move, null)).toBe('☗２一銀成');
    });

    it('should handle disambiguation', () => {
      const move: KifuMove = {
        from: { row: 6, col: 1 },
        to: { row: 5, col: 2 },
        piece: '銀',
        player: Player.SENTE,
        disambiguation: '右'
      };
      expect(moveToKi2(move, null)).toBe('☗７六銀右');
    });
  });

  describe('ki2ToMove', () => {
    it('should parse a simple KI2 move', () => {
      const ki2Move = '☗７六歩';
      const expected: KifuMove = {
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(ki2ToMove(ki2Move, Player.SENTE, null)).toMatchObject(expected);
    });

    it('should parse a move with same destination', () => {
      const ki2Move = '☗同角';
      const prevMove: KifuMove = {
        from: { row: 6, col: 2 },
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.GOTE
      };
      const expected: KifuMove = {
        to: { row: 5, col: 2 },
        piece: '角',
        player: Player.SENTE
      };
      expect(ki2ToMove(ki2Move, 'sente', prevMove)).toMatchObject(expected);
    });

    it('should parse a drop move', () => {
      const ki2Move = '☖５五歩打';
      const expected: KifuMove = {
        to: { row: 4, col: 4 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(ki2ToMove(ki2Move, Player.GOTE, null)).toMatchObject(expected);
    });

    it('should parse a promotion move', () => {
      const ki2Move = '☗２一銀成';
      const expected: KifuMove = {
        to: { row: 0, col: 7 },
        piece: '銀',
        promote: true,
        player: Player.SENTE
      };
      expect(ki2ToMove(ki2Move, Player.SENTE, null)).toMatchObject(expected);
    });
  });

  describe('gameToKi2Format', () => {
    it('should convert a game record to KI2 format', () => {
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
            from: { row: 6, col: 2 },
            to: { row: 5, col: 2 },
            piece: '歩',
            player: Player.SENTE
          },
          {
            from: { row: 2, col: 6 },
            to: { row: 3, col: 6 },
            piece: '歩',
            player: Player.GOTE
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      const ki2 = gameToKi2Format(record);
      expect(ki2).toContain('開始日時：2024/01/15 10:00:00');
      expect(ki2).toContain('先手：先手太郎');
      expect(ki2).toContain('後手：後手花子');
      expect(ki2).toContain('☗７六歩');
      expect(ki2).toContain('☖３四歩');
    });
  });

  describe('ki2FormatToGame', () => {
    it('should parse KI2 format to game record', () => {
      const ki2 = `# KI2 Format
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子

☗７六歩
☖３四歩
☗２六歩
`;

      const result = ki2FormatToGame(ki2);
      expect(result.gameInfo.sente).toBe('先手太郎');
      expect(result.gameInfo.gote).toBe('後手花子');
      expect(result.moves).toHaveLength(3);
      expect(result.moves[0].piece).toBe('歩');
      expect(result.moves[0].to).toEqual({ row: 5, col: 2 });
    });
  });
});