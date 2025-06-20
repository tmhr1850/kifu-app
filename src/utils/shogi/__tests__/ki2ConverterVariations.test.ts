import { describe, it, expect } from '@jest/globals';
import { gameToKi2Format, ki2FormatToGame } from '../ki2Converter';
import { KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';
import { createRootNode, createVariationNode, getMainLineMoves } from '../variations';

describe('KI2 Converter with Variations', () => {
  describe('gameToKi2Format with variations', () => {
    it('should convert a game with variations to KI2 format', () => {
      // Create a variation tree
      const root = createRootNode();
      
      // Main line: 1.76歩 2.34歩 3.26歩
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
      
      const move3 = createVariationNode({
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
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
      
      const var4 = createVariationNode({
        from: { row: 2, col: 1 },
        to: { row: 1, col: 1 },
        piece: '銀',
        player: Player.GOTE
      }, 4, var3.id, false);
      var3.children.push(var4);
      
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
      
      const ki2 = gameToKi2Format(record);
      
      expect(ki2).toContain('# KI2 Format');
      expect(ki2).toContain('先手：先手太郎');
      expect(ki2).toContain('後手：後手花子');
      expect(ki2).toContain('☗７六歩');
      expect(ki2).toContain('☖３四歩');
      expect(ki2).toContain('☗２六歩');
      expect(ki2).toContain('** 2手目の変化');
      expect(ki2).toContain('☗２二角成');
      expect(ki2).toContain('☖同銀');
    });
    
    it('should handle 同 notation in variations', () => {
      const root = createRootNode();
      
      // Main line with capture
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
      
      const move3 = createVariationNode({
        from: { row: 5, col: 6 },
        to: { row: 4, col: 6 },
        piece: '歩',
        player: Player.SENTE
      }, 3, move2.id, true);
      move2.children.push(move3);
      
      const move4 = createVariationNode({
        from: { row: 3, col: 5 },
        to: { row: 4, col: 6 },
        piece: '歩',
        player: Player.GOTE
      }, 4, move3.id, true);
      move3.children.push(move4);
      
      // Variation with same square capture
      const var4 = createVariationNode({
        from: { row: 3, col: 7 },
        to: { row: 4, col: 6 },
        piece: '歩',
        player: Player.GOTE
      }, 4, move3.id, false);
      move3.children.push(var4);
      
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
      
      const ki2 = gameToKi2Format(record);
      
      expect(ki2).toContain('☗７六歩');
      expect(ki2).toContain('☖３四歩');
      expect(ki2).toContain('☗７五歩');
      expect(ki2).toContain('☖６五歩'); // Main line capture
      expect(ki2).toContain('** 3手目の変化');
      expect(ki2).toContain('☖同歩'); // Same square in variation should use 同
    });
  });
  
  describe('ki2FormatToGame with variations', () => {
    it('should parse a KI2 file with variations', () => {
      const ki2 = `# KI2 Format
先手：先手太郎
後手：後手花子

☗７六歩
☖３四歩
☗２六歩

** 2手目の変化
☗２二角成
☖同銀
`;
      
      const result = ki2FormatToGame(ki2);
      
      expect(result.gameInfo.sente).toBe('先手太郎');
      expect(result.gameInfo.gote).toBe('後手花子');
      expect(result.moves).toHaveLength(3); // Main line only
      expect(result.variationTree).toBeDefined();
      
      if (result.variationTree) {
        // Check main line
        expect(result.variationTree.children).toHaveLength(1);
        const move1 = result.variationTree.children[0];
        expect(move1.move?.piece).toBe('歩');
        expect(move1.children).toHaveLength(1);
        
        const move2 = move1.children[0];
        expect(move2.move?.piece).toBe('歩');
        expect(move2.children).toHaveLength(2); // Main line + variation
        
        // Check variation
        const variation = move2.children.find(child => !child.isMainLine);
        expect(variation?.move?.piece).toBe('角');
        expect(variation?.move?.promote).toBe(true);
      }
    });
    
    it('should parse multiple variations', () => {
      const ki2 = `# KI2 Format
先手：A
後手：B

☗７六歩
☖３四歩
☗２六歩
☖８四歩

** 1手目の変化
☖８四歩
☗２六歩

** 3手目の変化
☖３三角
`;
      
      const result = ki2FormatToGame(ki2);
      
      expect(result.moves).toHaveLength(4); // Main line
      expect(result.variationTree).toBeDefined();
      
      if (result.variationTree) {
        const move1 = result.variationTree.children[0];
        expect(move1.children).toHaveLength(2); // Main + variation at move 1
        
        const move3 = move1.children[0].children[0]; // Main line move 3
        expect(move3.children).toHaveLength(2); // Main + variation at move 3
      }
    });
    
    it('should handle comments in variations', () => {
      const ki2 = `# KI2 Format
先手：A
後手：B

☗７六歩
※本譜
☖３四歩

** 1手目の変化
☖８四歩
※変化手順のコメント
`;
      
      const result = ki2FormatToGame(ki2);
      
      expect(result.moves[0].comment).toBe('本譜');
      
      if (result.variationTree) {
        const variation = result.variationTree.children[0].children.find(child => !child.isMainLine);
        expect(variation?.comment).toBe('変化手順のコメント');
      }
    });
    
    it('should parse 同 notation correctly in variations', () => {
      const ki2 = `# KI2 Format
先手：A
後手：B

☗７六歩
☖３四歩
☗７五歩
☖６五歩

** 3手目の変化
☖同歩
`;
      
      const result = ki2FormatToGame(ki2);
      
      if (result.variationTree) {
        const move3 = result.variationTree.children[0].children[0].children[0];
        const variation = move3.children.find(child => !child.isMainLine);
        
        expect(variation?.move?.to.row).toBe(4); // Same as move 3's destination
        expect(variation?.move?.to.col).toBe(6);
        expect(variation?.move?.piece).toBe('歩');
      }
    });
  });
  
  describe('round-trip conversion', () => {
    it('should preserve variations through conversion', () => {
      const original = `# KI2 Format
先手：先手
後手：後手

☗７六歩
☖３四歩
☗２六歩

** 2手目の変化
☗２二角成
☖同銀
`;
      
      const parsed = ki2FormatToGame(original);
      const record: KifuRecord = {
        id: 'test',
        gameInfo: parsed.gameInfo,
        moves: parsed.moves,
        variationTree: parsed.variationTree,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const converted = gameToKi2Format(record);
      
      // Check that key elements are preserved
      expect(converted).toContain('☗７六歩');
      expect(converted).toContain('☖３四歩');
      expect(converted).toContain('☗２六歩');
      expect(converted).toContain('** 2手目の変化');
      expect(converted).toContain('☗２二角成');
      expect(converted).toContain('☖同銀');
    });
  });
});