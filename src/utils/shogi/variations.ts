import { KifuMove, VariationNode, VariationPath, KifuRecord } from '@/types/kifu';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new variation node
 */
export function createVariationNode(
  move: KifuMove | null,
  moveNumber: number,
  parentId: string | null = null,
  isMainLine: boolean = false
): VariationNode {
  return {
    id: uuidv4(),
    move,
    moveNumber,
    children: [],
    parentId,
    isMainLine,
  };
}

/**
 * Creates the root node for a variation tree
 */
export function createRootNode(): VariationNode {
  return createVariationNode(null, 0, null, true);
}

/**
 * Finds a node by ID in the variation tree
 */
export function findNodeById(root: VariationNode, nodeId: string): VariationNode | null {
  if (root.id === nodeId) {
    return root;
  }
  
  for (const child of root.children) {
    const found = findNodeById(child, nodeId);
    if (found) {
      return found;
    }
  }
  
  return null;
}

/**
 * Gets the path from root to a specific node
 */
export function getPathToNode(root: VariationNode, nodeId: string): VariationPath | null {
  const path: VariationPath = [];
  
  function traverse(node: VariationNode): boolean {
    path.push(node.id);
    
    if (node.id === nodeId) {
      return true;
    }
    
    for (const child of node.children) {
      if (traverse(child)) {
        return true;
      }
    }
    
    path.pop();
    return false;
  }
  
  if (traverse(root)) {
    return path;
  }
  
  return null;
}

/**
 * Gets all moves along a specific path
 */
export function getMovesAlongPath(root: VariationNode, path: VariationPath): KifuMove[] {
  const moves: KifuMove[] = [];
  let currentNode = root;
  
  // Skip the root node (index 0) as it has no move
  for (let i = 1; i < path.length; i++) {
    const nextNode = currentNode.children.find(child => child.id === path[i]);
    if (!nextNode || !nextNode.move) {
      break;
    }
    moves.push(nextNode.move);
    currentNode = nextNode;
  }
  
  return moves;
}

/**
 * Adds a new variation at the specified node
 */
export function addVariation(
  root: VariationNode,
  parentNodeId: string,
  move: KifuMove,
  isMainLine: boolean = false
): VariationNode {
  const parentNode = findNodeById(root, parentNodeId);
  if (!parentNode) {
    throw new Error(`Parent node with ID ${parentNodeId} not found`);
  }
  
  const newNode = createVariationNode(
    move,
    parentNode.moveNumber + 1,
    parentNodeId,
    isMainLine
  );
  
  parentNode.children.push(newNode);
  return newNode;
}

/**
 * Deletes a variation and all its children
 */
export function deleteVariation(root: VariationNode, nodeId: string): boolean {
  if (nodeId === root.id) {
    throw new Error('Cannot delete root node');
  }
  
  function removeFromParent(node: VariationNode): boolean {
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].id === nodeId) {
        node.children.splice(i, 1);
        return true;
      }
      if (removeFromParent(node.children[i])) {
        return true;
      }
    }
    return false;
  }
  
  return removeFromParent(root);
}

/**
 * Converts linear moves array to variation tree (for backward compatibility)
 */
export function movesToVariationTree(moves: KifuMove[]): VariationNode {
  const root = createRootNode();
  let currentNode = root;
  
  for (let i = 0; i < moves.length; i++) {
    const newNode = createVariationNode(moves[i], i + 1, currentNode.id, true);
    currentNode.children.push(newNode);
    currentNode = newNode;
  }
  
  return root;
}

/**
 * Gets the main line moves from a variation tree
 */
export function getMainLineMoves(root: VariationNode): KifuMove[] {
  const moves: KifuMove[] = [];
  let currentNode = root;
  
  while (currentNode.children.length > 0) {
    // Find the main line child (or first child if none marked as main)
    const mainChild = currentNode.children.find(child => child.isMainLine) || currentNode.children[0];
    if (mainChild.move) {
      moves.push(mainChild.move);
    }
    currentNode = mainChild;
  }
  
  return moves;
}

/**
 * Initializes variation support for a KifuRecord
 */
export function initializeVariations(kifu: KifuRecord): KifuRecord {
  if (!kifu.variationTree) {
    const tree = movesToVariationTree(kifu.moves);
    const mainPath = [];
    let node = tree;
    
    // Build the main path
    while (node) {
      mainPath.push(node.id);
      node = node.children.find(child => child.isMainLine) || node.children[0];
    }
    
    return {
      ...kifu,
      variationTree: tree,
      currentPath: mainPath,
    };
  }
  
  return kifu;
}

/**
 * Checks if a move at the current position would create a variation
 */
export function wouldCreateVariation(
  root: VariationNode,
  currentPath: VariationPath,
  move: KifuMove
): boolean {
  if (currentPath.length === 0) {
    return false;
  }
  
  const currentNodeId = currentPath[currentPath.length - 1];
  const currentNode = findNodeById(root, currentNodeId);
  
  if (!currentNode) {
    return false;
  }
  
  // Check if any existing child matches this move
  return !currentNode.children.some(child => 
    child.move &&
    child.move.from?.row === move.from?.row &&
    child.move.from?.col === move.from?.col &&
    child.move.to.row === move.to.row &&
    child.move.to.col === move.to.col &&
    child.move.promote === move.promote
  );
}