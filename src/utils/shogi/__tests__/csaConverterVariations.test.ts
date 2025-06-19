import { describe, it, expect } from '@jest/globals';
import { gameToCsaFormat, csaFormatToGame } from '../csaConverter';
import { KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';
import { createRootNode, createVariationNode, getMainLineMoves } from '../variations';

describe('CSA Converter with Variations', () => {
  describe('gameToCsaFormat with variations', () => {
    it('should export only main line when variations exist', () => {
      // Create a variation tree
      const root = createRootNode();
      
      // Main line: 1.76歩 2.34歩 3.26歩
      const move1 = createVariationNode({
        from: { row: 6, col: 2 },
        to: { row: 5, col: 2 },
        piece: '歩',
        player: Player.SENTE
      }, 1, root.id, true);
      root.children.push(move1);
      
      const move2 = createVariationNode({
        from: { row: 2, col: 6 },
        to: { row: 3, col: 6 },
        piece: '歩',
        player: Player.GOTE
      }, 2, move1.id, true);
      move1.children.push(move2);
      
      const move3 = createVariationNode({
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE
      }, 3, move2.id, true);
      move2.children.push(move3);
      
      // Variation at move 3: 3.22角成
      const var3 = createVariationNode({
        from: { row: 7, col: 7 },
        to: { row: 1, col: 1 },
        piece: '角',
        promote: true,
        player: Player.SENTE
      }, 3, move2.id, false);
      move2.children.push(var3);
      
      const record: KifuRecord = {
        id: 'test',
        gameInfo: {
          date: '2024/01/01',
          startTime: '10:00',
          sente: '先手太郎',
          gote: '後手花子'
        },
        moves: getMainLineMoves(root),
        variationTree: root,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const csa = gameToCsaFormat(record);
      
      // Check header
      expect(csa).toContain('V2.2');
      expect(csa).toContain('N+先手太郎');
      expect(csa).toContain('N-後手花子');
      
      // Check warning comment about variations
      expect(csa).toContain("'このCSAファイルには本譜のみが含まれています。変化手順は保存されません。");
      
      // Check main line moves
      expect(csa).toContain('+7776FU'); // 76歩
      expect(csa).toContain('-3334FU'); // 34歩
      expect(csa).toContain('+2726FU'); // 26歩
      
      // Variation should NOT be included
      expect(csa).not.toContain('+8822KA'); // 22角成
    });
    
    it('should not add warning comment when no variations exist', () => {
      const record: KifuRecord = {
        id: 'test',
        gameInfo: {
          date: '2024/01/01',
          startTime: '10:00',
          sente: '先手',
          gote: '後手'
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
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const csa = gameToCsaFormat(record);
      
      // Should not contain warning
      expect(csa).not.toContain('変化手順は保存されません');
    });
    
    it('should handle game with only linear variation tree', () => {
      const root = createRootNode();
      
      // Only main line, no variations
      const move1 = createVariationNode({
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE
      }, 1, root.id, true);
      root.children.push(move1);
      
      const move2 = createVariationNode({
        from: { row: 2, col: 2 },
        to: { row: 3, col: 2 },
        piece: '歩',
        player: Player.GOTE
      }, 2, move1.id, true);
      move1.children.push(move2);
      
      const record: KifuRecord = {
        id: 'test',
        gameInfo: {
          date: '2024/01/01',
          startTime: '10:00',
          sente: '先手',
          gote: '後手'
        },
        moves: getMainLineMoves(root),
        variationTree: root,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const csa = gameToCsaFormat(record);
      
      // Should not contain warning since there are no actual variations
      expect(csa).not.toContain('変化手順は保存されません');
      
      // Should contain the moves
      expect(csa).toContain('+7776FU');
      expect(csa).toContain('-3334FU');
    });
  });
  
  describe('csaFormatToGame', () => {
    it('should parse CSA format without variations', () => {
      const csa = `V2.2
N+先手
N-後手
PI
+
+7776FU
-3334FU
+2726FU
%TORYO`;
      
      const result = csaFormatToGame(csa);
      
      expect(result.gameInfo.sente).toBe('先手');
      expect(result.gameInfo.gote).toBe('後手');
      expect(result.moves).toHaveLength(3);
      expect(result.moves[0].piece).toBe('歩');
      expect(result.moves[0].to).toEqual({ row: 5, col: 6 });
      
      // Should not have variationTree
      expect(result.variationTree).toBeUndefined();
    });
    
    it('should ignore variation warning comment', () => {
      const csa = `V2.2
N+先手
N-後手
PI
+
'このCSAファイルには本譜のみが含まれています。変化手順は保存されません。
+7776FU
-3334FU`;
      
      const result = csaFormatToGame(csa);
      
      expect(result.moves).toHaveLength(2);
      expect(result.moves[0].comment).toBeUndefined(); // Warning should not be attached to move
    });
  });
  
  describe('round-trip conversion', () => {
    it('should preserve main line through conversion', () => {
      const original: KifuRecord = {
        id: 'test',
        gameInfo: {
          date: '2024/01/01',
          startTime: '10:00',
          sente: '先手',
          gote: '後手'
        },
        moves: [
          {
            from: { row: 6, col: 6 },
            to: { row: 5, col: 6 },
            piece: '歩',
            player: Player.SENTE,
            comment: 'First move'
          },
          {
            from: { row: 2, col: 2 },
            to: { row: 3, col: 2 },
            piece: '歩',
            player: Player.GOTE
          }
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const csa = gameToCsaFormat(original);
      const parsed = csaFormatToGame(csa);
      
      expect(parsed.gameInfo.sente).toBe('先手');
      expect(parsed.gameInfo.gote).toBe('後手');
      expect(parsed.moves).toHaveLength(2);
      expect(parsed.moves[0].comment).toBe('First move');
    });
  });
});