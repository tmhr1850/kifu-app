import { 
  createVariationNode,
  createRootNode,
  findNodeById,
  getPathToNode,
  getMovesAlongPath,
  addVariation,
  deleteVariation,
  movesToVariationTree,
  getMainLineMoves,
  wouldCreateVariation
} from '../variations';
import { KifuMove } from '@/types/kifu';
import { Player } from '@/types/shogi';

describe('Variation Tree Functions', () => {
  describe('createVariationNode', () => {
    it('should create a new variation node with correct properties', () => {
      const move: KifuMove = {
        to: { row: 2, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      
      const node = createVariationNode(move, 1, 'parent-id', true);
      
      expect(node).toMatchObject({
        move,
        moveNumber: 1,
        parentId: 'parent-id',
        isMainLine: true,
        children: []
      });
      expect(node.id).toBeDefined();
    });

    it('should create a root node with null move', () => {
      const root = createRootNode();
      
      expect(root).toMatchObject({
        move: null,
        moveNumber: 0,
        parentId: null,
        isMainLine: true,
        children: []
      });
    });
  });

  describe('findNodeById', () => {
    it('should find a node by ID in the tree', () => {
      const root = createRootNode();
      const child1 = createVariationNode(null, 1, root.id, true);
      const child2 = createVariationNode(null, 2, child1.id, true);
      
      root.children.push(child1);
      child1.children.push(child2);
      
      expect(findNodeById(root, root.id)).toBe(root);
      expect(findNodeById(root, child1.id)).toBe(child1);
      expect(findNodeById(root, child2.id)).toBe(child2);
      expect(findNodeById(root, 'non-existent')).toBeNull();
    });
  });

  describe('getPathToNode', () => {
    it('should return the path from root to a specific node', () => {
      const root = createRootNode();
      const child1 = createVariationNode(null, 1, root.id, true);
      const child2 = createVariationNode(null, 2, child1.id, true);
      
      root.children.push(child1);
      child1.children.push(child2);
      
      const path = getPathToNode(root, child2.id);
      expect(path).toEqual([root.id, child1.id, child2.id]);
    });

    it('should return null if node is not found', () => {
      const root = createRootNode();
      const path = getPathToNode(root, 'non-existent');
      expect(path).toBeNull();
    });
  });

  describe('getMovesAlongPath', () => {
    it('should return all moves along a path', () => {
      const root = createRootNode();
      const move1: KifuMove = {
        to: { row: 2, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      const move2: KifuMove = {
        to: { row: 6, col: 2 },
        piece: '歩',
        player: Player.GOTE
      };
      
      const child1 = createVariationNode(move1, 1, root.id, true);
      const child2 = createVariationNode(move2, 2, child1.id, true);
      
      root.children.push(child1);
      child1.children.push(child2);
      
      const path = [root.id, child1.id, child2.id];
      const moves = getMovesAlongPath(root, path);
      
      expect(moves).toEqual([move1, move2]);
    });
  });

  describe('addVariation', () => {
    it('should add a new variation to a parent node', () => {
      const root = createRootNode();
      const move: KifuMove = {
        to: { row: 2, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      
      const newNode = addVariation(root, root.id, move, true);
      
      expect(root.children).toHaveLength(1);
      expect(root.children[0]).toBe(newNode);
      expect(newNode.move).toBe(move);
      expect(newNode.moveNumber).toBe(1);
      expect(newNode.parentId).toBe(root.id);
    });

    it('should throw error if parent node is not found', () => {
      const root = createRootNode();
      const move: KifuMove = {
        to: { row: 2, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      
      expect(() => {
        addVariation(root, 'non-existent', move);
      }).toThrow();
    });
  });

  describe('deleteVariation', () => {
    it('should delete a variation and its children', () => {
      const root = createRootNode();
      const child1 = createVariationNode(null, 1, root.id, true);
      const child2 = createVariationNode(null, 2, child1.id, true);
      
      root.children.push(child1);
      child1.children.push(child2);
      
      const success = deleteVariation(root, child1.id);
      
      expect(success).toBe(true);
      expect(root.children).toHaveLength(0);
    });

    it('should not delete root node', () => {
      const root = createRootNode();
      
      expect(() => {
        deleteVariation(root, root.id);
      }).toThrow();
    });
  });

  describe('movesToVariationTree', () => {
    it('should convert linear moves to a variation tree', () => {
      const moves: KifuMove[] = [
        {
          to: { row: 2, col: 6 },
          piece: '歩',
          player: Player.SENTE
        },
        {
          to: { row: 6, col: 2 },
          piece: '歩',
          player: Player.GOTE
        }
      ];
      
      const root = movesToVariationTree(moves);
      
      expect(root.move).toBeNull();
      expect(root.children).toHaveLength(1);
      expect(root.children[0].move).toEqual(moves[0]);
      expect(root.children[0].children).toHaveLength(1);
      expect(root.children[0].children[0].move).toEqual(moves[1]);
    });
  });

  describe('getMainLineMoves', () => {
    it('should return moves from the main line', () => {
      const root = createRootNode();
      const move1: KifuMove = {
        to: { row: 2, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      const move2: KifuMove = {
        to: { row: 6, col: 2 },
        piece: '歩',
        player: Player.GOTE
      };
      const variation: KifuMove = {
        to: { row: 3, col: 6 },
        piece: '歩',
        player: Player.GOTE
      };
      
      const child1 = createVariationNode(move1, 1, root.id, true);
      const child2 = createVariationNode(move2, 2, child1.id, true);
      const varChild = createVariationNode(variation, 2, child1.id, false);
      
      root.children.push(child1);
      child1.children.push(child2);
      child1.children.push(varChild);
      
      const mainLineMoves = getMainLineMoves(root);
      
      expect(mainLineMoves).toEqual([move1, move2]);
    });
  });

  describe('wouldCreateVariation', () => {
    it('should detect when a move would create a variation', () => {
      const root = createRootNode();
      const existingMove: KifuMove = {
        to: { row: 2, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      const child = createVariationNode(existingMove, 1, root.id, true);
      root.children.push(child);
      
      const newMove: KifuMove = {
        to: { row: 3, col: 6 },
        piece: '歩',
        player: Player.SENTE
      };
      
      const path = [root.id];
      
      expect(wouldCreateVariation(root, path, newMove)).toBe(true);
      expect(wouldCreateVariation(root, path, existingMove)).toBe(false);
    });
  });
});