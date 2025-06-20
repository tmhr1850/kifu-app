import { describe, it, expect } from '@jest/globals';
import { gameToKifFormat, kifFormatToGame } from '../kifConverter';
import { KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';
import { createRootNode, createVariationNode, getMainLineMoves } from '../variations';

describe('KIF Converter with Variations', () => {
  describe('gameToKifFormat with variations', () => {
    it('should convert a game with variations to KIF format', () => {
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
        to: { row: 1, col: 7 },
        piece: '角',
        promote: true,
        player: Player.SENTE
      }, 3, move2.id, false);
      move2.children.push(var3);
      
      const var4 = createVariationNode({
        from: { row: 2, col: 7 },
        to: { row: 1, col: 7 },
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
      
      const kif = gameToKifFormat(record);
      
      expect(kif).toContain('# ---- Kifu for Windows ----');
      expect(kif).toContain('先手：先手太郎');
      expect(kif).toContain('後手：後手花子');
      expect(kif).toContain('   1 ７六歩(77)');
      expect(kif).toContain('   2 ３四歩(33)');
      expect(kif).toContain('   3 ２六歩(27)');
      expect(kif).toContain('変化：2手');
      expect(kif).toContain('   3 ２二角成(88)');
      expect(kif).toContain('   4 同銀(32)');
    });
    
    it('should handle nested variations', () => {
      const root = createRootNode();
      
      // Main line
      const move1 = createVariationNode({
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: '歩',
        player: Player.SENTE
      }, 1, root.id, true);
      root.children.push(move1);
      
      // First variation at move 1
      const var1 = createVariationNode({
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
        piece: '歩',
        player: Player.SENTE
      }, 1, root.id, false);
      root.children.push(var1);
      
      const var2 = createVariationNode({
        from: { row: 2, col: 2 },
        to: { row: 3, col: 2 },
        piece: '歩',
        player: Player.GOTE
      }, 2, var1.id, false);
      var1.children.push(var2);
      
      // Nested variation at move 2
      const var2b = createVariationNode({
        from: { row: 2, col: 6 },
        to: { row: 3, col: 6 },
        piece: '歩',
        player: Player.GOTE
      }, 2, var1.id, false);
      var1.children.push(var2b);
      
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
      
      const kif = gameToKifFormat(record);
      
      expect(kif).toContain('   1 ７六歩(77)');
      expect(kif).toContain('変化：0手'); // Variation from start
      expect(kif).toContain('   1 ２六歩(27)');
      expect(kif).toContain('   2 ３四歩(33)');
      expect(kif).toContain('変化：1手'); // Nested variation
      expect(kif).toContain('   2 ７四歩(73)');
    });
  });
  
  describe('kifFormatToGame with variations', () => {
    it('should parse a KIF file with variations', () => {
      const kif = `# ---- Kifu for Windows ----
開始日時：2024/01/01 10:00
先手：先手太郎
後手：後手花子
手合割：平手
手数----指手---------消費時間--
   1 ７六歩(77)
   2 ３四歩(33)
   3 ２六歩(27)

変化：2手
   3 ２二角成(88)
   4 同銀(32)
`;
      
      const result = kifFormatToGame(kif);
      
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
    
    it('should parse multiple variations at different points', () => {
      const kif = `# ---- Kifu for Windows ----
先手：A
後手：B
手数----指手---------消費時間--
   1 ７六歩(77)
   2 ３四歩(33)
   3 ２六歩(27)
   4 ８四歩(83)

変化：1手
   2 ８四歩(83)
   3 ２六歩(27)

変化：3手
   4 ３三角(22)
`;
      
      const result = kifFormatToGame(kif);
      
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
      const kif = `# ---- Kifu for Windows ----
先手：A
後手：B
手数----指手---------消費時間--
   1 ７六歩(77)
*本譜
   2 ３四歩(33)

変化：1手
   2 ８四歩(83)
*変化手順のコメント
`;
      
      const result = kifFormatToGame(kif);
      
      expect(result.moves[0].comment).toBe('本譜');
      
      if (result.variationTree) {
        const variation = result.variationTree.children[0].children.find(child => !child.isMainLine);
        expect(variation?.comment).toBe('変化手順のコメント');
      }
    });
  });
  
  describe('round-trip conversion', () => {
    it('should preserve variations through conversion', () => {
      const original = `# ---- Kifu for Windows ----
先手：先手
後手：後手
手数----指手---------消費時間--
   1 ７六歩(77)
   2 ３四歩(33)
   3 ２六歩(27)

変化：2手
   3 ２二角成(88)
   4 同銀(32)
`;
      
      const parsed = kifFormatToGame(original);
      const record: KifuRecord = {
        id: 'test',
        gameInfo: parsed.gameInfo,
        moves: parsed.moves,
        variationTree: parsed.variationTree,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const converted = gameToKifFormat(record);
      
      // Check that key elements are preserved
      expect(converted).toContain('   1 ７六歩(77)');
      expect(converted).toContain('   2 ３四歩(33)');
      expect(converted).toContain('   3 ２六歩(27)');
      expect(converted).toContain('変化：2手');
      expect(converted).toContain('   3 ２二角成(88)');
      expect(converted).toContain('   4 同銀(32)');
    });
  });
});