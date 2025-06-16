import { describe, it, expect } from '@jest/globals';
import {
  moveToCsa,
  csaToMove,
  gameToCsaFormat,
  csaFormatToGame
} from '../csaConverter';
import { KifuMove, KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';

describe('CSA Converter', () => {
  describe('moveToCsa', () => {
    it('should convert a simple move to CSA notation', () => {
      const move: KifuMove = {
        from: { row: 6, col: 2 },
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(moveToCsa(move)).toBe('+7776FU');
    });

    it('should convert gote move to CSA notation', () => {
      const move: KifuMove = {
        from: { row: 2, col: 6 },
        to: { row: 3, col: 6 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(moveToCsa(move)).toBe('-3334FU');
    });

    it('should convert a drop move to CSA notation', () => {
      const move: KifuMove = {
        to: { row: 4, col: 4 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(moveToCsa(move)).toBe('+0055FU');
    });

    it('should convert a promotion move to CSA notation', () => {
      const move: KifuMove = {
        from: { row: 1, col: 7 },
        to: { row: 0, col: 7 },
        piece: '銀',
        promote: true,
        player: Player.SENTE
      };
      expect(moveToCsa(move)).toBe('+2221GI');
    });

    it('should handle special pieces', () => {
      const moves: KifuMove[] = [
        { from: { row: 8, col: 4 }, to: { row: 7, col: 4 }, piece: '玉', player: Player.SENTE },
        { from: { row: 0, col: 3 }, to: { row: 1, col: 3 }, piece: '金', player: Player.GOTE },
        { from: { row: 7, col: 7 }, to: { row: 5, col: 5 }, piece: '角', player: Player.SENTE },
        { from: { row: 7, col: 7 }, to: { row: 1, col: 3 }, piece: '飛', player: Player.SENTE },
        { from: { row: 8, col: 7 }, to: { row: 6, col: 6 }, piece: '桂', player: Player.SENTE },
        { from: { row: 8, col: 8 }, to: { row: 5, col: 5 }, piece: '香', player: Player.SENTE }
      ];
      
      expect(moveToCsa(moves[0])).toBe('+5958OU');
      expect(moveToCsa(moves[1])).toBe('-6162KI');
      expect(moveToCsa(moves[2])).toBe('+2846KA');
      expect(moveToCsa(moves[3])).toBe('+2862HI');
      expect(moveToCsa(moves[4])).toBe('+2937KE');
      expect(moveToCsa(moves[5])).toBe('+1946KY');
    });
  });

  describe('csaToMove', () => {
    it('should parse a simple CSA move', () => {
      const csaMove = '+7776FU';
      const expected: KifuMove = {
        from: { row: 6, col: 2 },
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(csaToMove(csaMove)).toEqual(expected);
    });

    it('should parse gote move', () => {
      const csaMove = '-3334FU';
      const expected: KifuMove = {
        from: { row: 2, col: 6 },
        to: { row: 3, col: 6 },
        piece: '歩',
        player: Player.GOTE
      };
      expect(csaToMove(csaMove)).toEqual(expected);
    });

    it('should parse a drop move', () => {
      const csaMove = '+0055FU';
      const expected: KifuMove = {
        to: { row: 4, col: 4 },
        piece: '歩',
        player: Player.SENTE
      };
      expect(csaToMove(csaMove)).toEqual(expected);
    });

    it('should parse promoted pieces', () => {
      const moves = [
        { csa: '+7776TO', expected: { piece: 'と', from: { row: 6, col: 2 }, to: { row: 5, col: 2 }, player: Player.SENTE } },
        { csa: '-3334NY', expected: { piece: '成香', from: { row: 2, col: 6 }, to: { row: 3, col: 6 }, player: Player.GOTE } },
        { csa: '+2837NK', expected: { piece: '成桂', from: { row: 7, col: 7 }, to: { row: 6, col: 6 }, player: Player.SENTE } },
        { csa: '-2122NG', expected: { piece: '成銀', from: { row: 0, col: 7 }, to: { row: 1, col: 7 }, player: Player.GOTE } },
        { csa: '+2846UM', expected: { piece: '馬', from: { row: 7, col: 7 }, to: { row: 5, col: 5 }, player: Player.SENTE } },
        { csa: '+2862RY', expected: { piece: '龍', from: { row: 7, col: 7 }, to: { row: 1, col: 3 }, player: Player.SENTE } }
      ];
      
      moves.forEach(({ csa, expected }) => {
        expect(csaToMove(csa)).toEqual(expected);
      });
    });
  });

  describe('gameToCsaFormat', () => {
    it('should convert a game record to CSA format', () => {
      const record: KifuRecord = {
        id: 'test-id',
        gameInfo: {
          date: '2024/01/15',
          startTime: '10:00:00',
          sente: '先手太郎',
          gote: '後手花子',
          event: '練習対局'
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

      const csa = gameToCsaFormat(record);
      expect(csa).toContain('V2.2');
      expect(csa).toContain('N+先手太郎');
      expect(csa).toContain('N-後手花子');
      expect(csa).toContain('$EVENT:練習対局');
      expect(csa).toContain('+7776FU');
      expect(csa).toContain('-3334FU');
    });
  });

  describe('csaFormatToGame', () => {
    it('should parse CSA format to game record', () => {
      const csa = `V2.2
N+先手太郎
N-後手花子
$START_TIME:2024/01/15 10:00:00
$EVENT:練習対局
PI
+
+7776FU
-3334FU
+2726FU
%TORYO
`;

      const result = csaFormatToGame(csa);
      expect(result.gameInfo.sente).toBe('先手太郎');
      expect(result.gameInfo.gote).toBe('後手花子');
      expect(result.gameInfo.event).toBe('練習対局');
      expect(result.moves).toHaveLength(3);
      expect(result.moves[0].piece).toBe('歩');
      expect(result.moves[0].to).toEqual({ row: 5, col: 2 });
    });

    it('should handle time information', () => {
      const csa = `V2.2
N+先手太郎
N-後手花子
PI
+
+7776FU,T15
-3334FU,T10
`;

      const result = csaFormatToGame(csa);
      expect(result.moves[0].time).toBe(15);
      expect(result.moves[1].time).toBe(10);
    });
  });
});