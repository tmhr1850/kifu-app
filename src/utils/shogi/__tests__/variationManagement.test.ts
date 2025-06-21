import { 
  createRootNode,
  addVariation,
  renameVariation,
  promoteToMainLine,
  getPathToNode,
  getMovesAlongPath
} from '../variations'
import { KifuMove } from '@/types/kifu'
import { Player } from '@/types/shogi'

describe('Variation Management', () => {
  const createTestMove = (piece: string, row: number, col: number, player: Player): KifuMove => ({
    to: { row, col },
    piece,
    player
  })

  describe('renameVariation', () => {
    it('should rename a variation node', () => {
      const root = createRootNode()
      const move1 = createTestMove('歩', 2, 6, Player.SENTE)
      const node1 = addVariation(root, root.id, move1, true)
      
      const move2 = createTestMove('歩', 3, 4, Player.GOTE)
      const node2 = addVariation(root, node1.id, move2, true)
      
      // Rename the second node
      const success = renameVariation(root, node2.id, '攻めの変化')
      
      expect(success).toBe(true)
      expect(node2.comment).toBe('攻めの変化')
    })

    it('should return false for non-existent node', () => {
      const root = createRootNode()
      const success = renameVariation(root, 'non-existent-id', '新しい名前')
      
      expect(success).toBe(false)
    })
  })

  describe('promoteToMainLine', () => {
    it('should promote a variation to main line', () => {
      const root = createRootNode()
      const move1 = createTestMove('歩', 2, 6, Player.SENTE)
      const mainNode = addVariation(root, root.id, move1, true)
      
      // Add main line continuation
      const move2a = createTestMove('歩', 3, 4, Player.GOTE)
      const mainContinuation = addVariation(root, mainNode.id, move2a, true)
      
      // Add variation
      const move2b = createTestMove('角', 8, 8, Player.GOTE)
      const variation = addVariation(root, mainNode.id, move2b, false)
      
      // Promote variation to main line
      const success = promoteToMainLine(root, variation.id)
      
      expect(success).toBe(true)
      expect(variation.isMainLine).toBe(true)
      expect(mainContinuation.isMainLine).toBe(false)
    })

    it('should handle nested variations correctly', () => {
      const root = createRootNode()
      const move1 = createTestMove('歩', 2, 6, Player.SENTE)
      const node1 = addVariation(root, root.id, move1, true)
      
      // Main line continuation
      const move2 = createTestMove('歩', 3, 4, Player.GOTE)
      const mainNode2 = addVariation(root, node1.id, move2, true)
      
      // Add variation at move 1
      const moveVar = createTestMove('香', 1, 8, Player.GOTE)
      const varNode = addVariation(root, node1.id, moveVar, false)
      
      // Add continuation to variation
      const moveVar2 = createTestMove('桂', 2, 8, Player.SENTE)
      const varCont = addVariation(root, varNode.id, moveVar2, false)
      
      // Promote variation
      const success = promoteToMainLine(root, varNode.id)
      
      expect(success).toBe(true)
      expect(varNode.isMainLine).toBe(true)
      expect(varCont.isMainLine).toBe(true) // Descendant should also be main line
      expect(mainNode2.isMainLine).toBe(false)
    })

    it('should return false for root node', () => {
      const root = createRootNode()
      const success = promoteToMainLine(root, root.id)
      
      expect(success).toBe(false)
    })

    it('should return false for non-existent node', () => {
      const root = createRootNode()
      const success = promoteToMainLine(root, 'non-existent-id')
      
      expect(success).toBe(false)
    })
  })

  describe('variation tree navigation', () => {
    it('should correctly identify main line after promotion', () => {
      const root = createRootNode()
      
      // Build a tree with variations
      const move1 = createTestMove('歩', 2, 6, Player.SENTE)
      const node1 = addVariation(root, root.id, move1, true)
      
      const move2Main = createTestMove('歩', 3, 4, Player.GOTE)
      const node2Main = addVariation(root, node1.id, move2Main, true)
      
      const move2Var = createTestMove('角', 8, 8, Player.GOTE)
      const node2Var = addVariation(root, node1.id, move2Var, false)
      
      // Get original main line
      const originalPath = getPathToNode(root, node2Main.id)
      const originalMoves = getMovesAlongPath(root, originalPath!)
      
      expect(originalMoves).toHaveLength(2)
      expect(originalMoves[1].piece).toBe('歩')
      
      // Promote variation
      promoteToMainLine(root, node2Var.id)
      
      // Get new main line through variation
      const newPath = getPathToNode(root, node2Var.id)
      const newMoves = getMovesAlongPath(root, newPath!)
      
      expect(newMoves).toHaveLength(2)
      expect(newMoves[1].piece).toBe('角')
    })
  })
})