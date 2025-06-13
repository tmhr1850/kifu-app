import {
  canPromotePiece,
  isPromotedPiece,
  promotePiece,
  demotePiece,
  isEnemyTerritory,
  canPromoteAt,
  mustPromoteAt
} from '../pieceUtils';

describe('pieceUtils', () => {
  describe('canPromotePiece', () => {
    it('should return true for promotable pieces', () => {
      expect(canPromotePiece('歩')).toBe(true);
      expect(canPromotePiece('香')).toBe(true);
      expect(canPromotePiece('桂')).toBe(true);
      expect(canPromotePiece('銀')).toBe(true);
      expect(canPromotePiece('角')).toBe(true);
      expect(canPromotePiece('飛')).toBe(true);
    });

    it('should return false for non-promotable pieces', () => {
      expect(canPromotePiece('王')).toBe(false);
      expect(canPromotePiece('玉')).toBe(false);
      expect(canPromotePiece('金')).toBe(false);
    });

    it('should return false for already promoted pieces', () => {
      expect(canPromotePiece('と')).toBe(false);
      expect(canPromotePiece('杏')).toBe(false);
      expect(canPromotePiece('圭')).toBe(false);
      expect(canPromotePiece('全')).toBe(false);
      expect(canPromotePiece('馬')).toBe(false);
      expect(canPromotePiece('竜')).toBe(false);
    });
  });

  describe('isPromotedPiece', () => {
    it('should return true for promoted pieces', () => {
      expect(isPromotedPiece('と')).toBe(true);
      expect(isPromotedPiece('杏')).toBe(true);
      expect(isPromotedPiece('圭')).toBe(true);
      expect(isPromotedPiece('全')).toBe(true);
      expect(isPromotedPiece('馬')).toBe(true);
      expect(isPromotedPiece('竜')).toBe(true);
    });

    it('should return false for regular pieces', () => {
      expect(isPromotedPiece('歩')).toBe(false);
      expect(isPromotedPiece('香')).toBe(false);
      expect(isPromotedPiece('桂')).toBe(false);
      expect(isPromotedPiece('銀')).toBe(false);
      expect(isPromotedPiece('角')).toBe(false);
      expect(isPromotedPiece('飛')).toBe(false);
      expect(isPromotedPiece('王')).toBe(false);
      expect(isPromotedPiece('金')).toBe(false);
    });
  });

  describe('promotePiece', () => {
    it('should correctly promote pieces', () => {
      expect(promotePiece('歩')).toBe('と');
      expect(promotePiece('香')).toBe('杏');
      expect(promotePiece('桂')).toBe('圭');
      expect(promotePiece('銀')).toBe('全');
      expect(promotePiece('角')).toBe('馬');
      expect(promotePiece('飛')).toBe('竜');
    });

    it('should return the same piece if not promotable', () => {
      expect(promotePiece('王')).toBe('王');
      expect(promotePiece('金')).toBe('金');
      expect(promotePiece('と')).toBe('と');
    });
  });

  describe('demotePiece', () => {
    it('should correctly demote promoted pieces', () => {
      expect(demotePiece('と')).toBe('歩');
      expect(demotePiece('杏')).toBe('香');
      expect(demotePiece('圭')).toBe('桂');
      expect(demotePiece('全')).toBe('銀');
      expect(demotePiece('馬')).toBe('角');
      expect(demotePiece('竜')).toBe('飛');
    });

    it('should return the same piece if not promoted', () => {
      expect(demotePiece('歩')).toBe('歩');
      expect(demotePiece('王')).toBe('王');
      expect(demotePiece('金')).toBe('金');
    });
  });

  describe('isEnemyTerritory', () => {
    it('should correctly identify enemy territory for sente', () => {
      // Sente (isGote = false): enemy territory is rows 0-2
      expect(isEnemyTerritory(0, false)).toBe(true);
      expect(isEnemyTerritory(1, false)).toBe(true);
      expect(isEnemyTerritory(2, false)).toBe(true);
      expect(isEnemyTerritory(3, false)).toBe(false);
      expect(isEnemyTerritory(8, false)).toBe(false);
    });

    it('should correctly identify enemy territory for gote', () => {
      // Gote (isGote = true): enemy territory is rows 6-8
      expect(isEnemyTerritory(0, true)).toBe(false);
      expect(isEnemyTerritory(5, true)).toBe(false);
      expect(isEnemyTerritory(6, true)).toBe(true);
      expect(isEnemyTerritory(7, true)).toBe(true);
      expect(isEnemyTerritory(8, true)).toBe(true);
    });
  });

  describe('canPromoteAt', () => {
    it('should return true if either position is in enemy territory', () => {
      // Sente moving into enemy territory
      expect(canPromoteAt(3, 2, false)).toBe(true);
      // Sente moving from enemy territory
      expect(canPromoteAt(2, 3, false)).toBe(true);
      // Sente moving within enemy territory
      expect(canPromoteAt(1, 2, false)).toBe(true);
      // Sente not in enemy territory
      expect(canPromoteAt(4, 5, false)).toBe(false);

      // Gote moving into enemy territory
      expect(canPromoteAt(5, 6, true)).toBe(true);
      // Gote moving from enemy territory
      expect(canPromoteAt(6, 5, true)).toBe(true);
      // Gote moving within enemy territory
      expect(canPromoteAt(7, 8, true)).toBe(true);
      // Gote not in enemy territory
      expect(canPromoteAt(3, 4, true)).toBe(false);
    });
  });

  describe('mustPromoteAt', () => {
    describe('for pawn and lance', () => {
      it('should force promotion at the last rank', () => {
        // Sente pawn/lance must promote at row 0
        expect(mustPromoteAt('歩', 0, false)).toBe(true);
        expect(mustPromoteAt('香', 0, false)).toBe(true);
        expect(mustPromoteAt('歩', 1, false)).toBe(false);
        expect(mustPromoteAt('香', 1, false)).toBe(false);

        // Gote pawn/lance must promote at row 8
        expect(mustPromoteAt('歩', 8, true)).toBe(true);
        expect(mustPromoteAt('香', 8, true)).toBe(true);
        expect(mustPromoteAt('歩', 7, true)).toBe(false);
        expect(mustPromoteAt('香', 7, true)).toBe(false);
      });
    });

    describe('for knight', () => {
      it('should force promotion at the last two ranks', () => {
        // Sente knight must promote at rows 0-1
        expect(mustPromoteAt('桂', 0, false)).toBe(true);
        expect(mustPromoteAt('桂', 1, false)).toBe(true);
        expect(mustPromoteAt('桂', 2, false)).toBe(false);

        // Gote knight must promote at rows 7-8
        expect(mustPromoteAt('桂', 7, true)).toBe(true);
        expect(mustPromoteAt('桂', 8, true)).toBe(true);
        expect(mustPromoteAt('桂', 6, true)).toBe(false);
      });
    });

    describe('for other pieces', () => {
      it('should never force promotion', () => {
        const pieces = ['銀', '角', '飛', '金', '王'];
        for (const piece of pieces) {
          for (let row = 0; row <= 8; row++) {
            expect(mustPromoteAt(piece as PieceType, row, false)).toBe(false);
            expect(mustPromoteAt(piece as PieceType, row, true)).toBe(false);
          }
        }
      });
    });
  });
});