import { GameState, Move, Player } from '@/types/shogi';
import { KifuRecord, KifuMove, GameInfo } from '@/types/kifu';
import { createNewGame, makeMove } from './game';
import { 
  saveKifuRecord, 
  loadKifuRecord, 
  createNewKifuRecord
} from './storageService';
import {
  createRootNode,
  addVariation,
  findNodeById,
  getMovesAlongPath,
  getPathToNode,
  wouldCreateVariation,
  initializeVariations,
  deleteVariation as deleteVariationNode
} from './variations';

export interface GameStateWithKifu {
  game: GameState;
  kifu: KifuRecord;
}

// Create a new game with variation support
export function createNewGameWithKifuVariations(gameInfo?: Partial<GameInfo>): GameStateWithKifu {
  const gameState = createNewGame();
  const kifuRecord = createNewKifuRecord(gameInfo);
  
  // Initialize with variation tree
  const rootNode = createRootNode();
  const enhancedKifu = {
    ...kifuRecord,
    variationTree: rootNode,
    currentPath: [rootNode.id]
  };
  
  saveKifuRecord(enhancedKifu);
  
  return {
    game: gameState,
    kifu: enhancedKifu
  };
}

// Load a game and ensure it has variation support
export function loadGameFromKifuWithVariations(kifuId: string): GameStateWithKifu | null {
  const kifuRecord = loadKifuRecord(kifuId);
  if (!kifuRecord) {
    return null;
  }
  
  // Initialize variations if not present
  const enhancedKifu = initializeVariations(kifuRecord);
  
  // Rebuild game state along the current path
  const gameState = rebuildGameStateAlongPath(enhancedKifu);
  
  return {
    game: gameState,
    kifu: enhancedKifu
  };
}

// Make a move with variation support
export function makeMoveWithVariations(
  gameWithKifu: GameStateWithKifu, 
  move: Move,
  createNewVariation: boolean = true
): GameStateWithKifu | null {
  const newGameState = makeMove(gameWithKifu.game, move);
  if (!newGameState) {
    return null;
  }
  
  // Create KifuMove
  const kifuMove: KifuMove = {
    from: move.from ? { row: move.from.row, col: move.from.col } : undefined,
    to: { row: move.to.row, col: move.to.col },
    piece: getPieceChar(move.piece.type),
    promote: move.promote,
    player: move.piece.player
  };
  
  const kifu = gameWithKifu.kifu;
  let updatedKifu: KifuRecord;
  
  if (!kifu.variationTree || !kifu.currentPath) {
    // Fallback to linear mode
    updatedKifu = {
      ...kifu,
      moves: [...kifu.moves, kifuMove],
      updatedAt: new Date().toISOString()
    };
  } else {
    const currentNodeId = kifu.currentPath[kifu.currentPath.length - 1];
    const currentNode = findNodeById(kifu.variationTree, currentNodeId);
    
    if (!currentNode) {
      return null;
    }
    
    // Check if this move already exists as a variation
    const existingChild = currentNode.children.find(child => 
      child.move &&
      child.move.from?.row === kifuMove.from?.row &&
      child.move.from?.col === kifuMove.from?.col &&
      child.move.to.row === kifuMove.to.row &&
      child.move.to.col === kifuMove.to.col &&
      child.move.promote === kifuMove.promote
    );
    
    if (existingChild) {
      // Move along existing variation
      const newPath = [...kifu.currentPath, existingChild.id];
      updatedKifu = {
        ...kifu,
        currentPath: newPath,
        moves: getMovesAlongPath(kifu.variationTree, newPath),
        updatedAt: new Date().toISOString()
      };
    } else if (createNewVariation && wouldCreateVariation(kifu.variationTree, kifu.currentPath, kifuMove)) {
      // Create new variation
      const isMainLine = currentNode.children.length === 0;
      const newNode = addVariation(kifu.variationTree, currentNodeId, kifuMove, isMainLine);
      const newPath = [...kifu.currentPath, newNode.id];
      
      updatedKifu = {
        ...kifu,
        currentPath: newPath,
        moves: getMovesAlongPath(kifu.variationTree, newPath),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Regular move (first move from this position)
      const isMainLine = true;
      const newNode = addVariation(kifu.variationTree, currentNodeId, kifuMove, isMainLine);
      const newPath = [...kifu.currentPath, newNode.id];
      
      updatedKifu = {
        ...kifu,
        currentPath: newPath,
        moves: getMovesAlongPath(kifu.variationTree, newPath),
        updatedAt: new Date().toISOString()
      };
    }
  }
  
  saveKifuRecord(updatedKifu);
  
  return {
    game: newGameState,
    kifu: updatedKifu
  };
}

// Navigate to a specific variation node
export function navigateToVariation(
  gameWithKifu: GameStateWithKifu,
  nodeId: string
): GameStateWithKifu | null {
  const kifu = gameWithKifu.kifu;
  
  if (!kifu.variationTree) {
    return null;
  }
  
  const targetNode = findNodeById(kifu.variationTree, nodeId);
  if (!targetNode) {
    return null;
  }
  
  const newPath = getPathToNode(kifu.variationTree, nodeId);
  if (!newPath) {
    return null;
  }
  
  const updatedKifu = {
    ...kifu,
    currentPath: newPath,
    moves: getMovesAlongPath(kifu.variationTree, newPath),
    updatedAt: new Date().toISOString()
  };
  
  const newGameState = rebuildGameStateAlongPath(updatedKifu);
  
  saveKifuRecord(updatedKifu);
  
  return {
    game: newGameState,
    kifu: updatedKifu
  };
}

// Delete a variation branch
export function deleteVariation(
  gameWithKifu: GameStateWithKifu,
  nodeId: string
): GameStateWithKifu | null {
  const kifu = gameWithKifu.kifu;
  
  if (!kifu.variationTree || !kifu.currentPath) {
    return null;
  }
  
  // Don't allow deleting nodes in the current path
  if (kifu.currentPath.includes(nodeId)) {
    return null;
  }
  
  const success = deleteVariationNode(kifu.variationTree, nodeId);
  if (!success) {
    return null;
  }
  
  const updatedKifu = {
    ...kifu,
    updatedAt: new Date().toISOString()
  };
  
  saveKifuRecord(updatedKifu);
  
  return {
    game: gameWithKifu.game,
    kifu: updatedKifu
  };
}

// Rebuild game state by replaying moves along a path
function rebuildGameStateAlongPath(kifu: KifuRecord): GameState {
  let gameState = createNewGame();
  
  if (!kifu.variationTree || !kifu.currentPath) {
    // Fallback to linear replay
    for (const kifuMove of kifu.moves) {
      const move = kifuMoveToGameMove(kifuMove);
      if (move) {
        const newState = makeMove(gameState, move);
        if (newState) {
          gameState = newState;
        }
      }
    }
  } else {
    // Replay along variation path
    const moves = getMovesAlongPath(kifu.variationTree, kifu.currentPath);
    for (const kifuMove of moves) {
      const move = kifuMoveToGameMove(kifuMove);
      if (move) {
        const newState = makeMove(gameState, move);
        if (newState) {
          gameState = newState;
        }
      }
    }
  }
  
  return gameState;
}

// Helper functions (same as original)
function getPieceChar(pieceType: string): string {
  const pieceMap: { [key: string]: string } = {
    'FU': '歩',
    'KYO': '香',
    'KEI': '桂',
    'GIN': '銀',
    'KIN': '金',
    'KAKU': '角',
    'HI': '飛',
    'OU': '王',
    'TO': 'と',
    'NKYO': '成香',
    'NKEI': '成桂',
    'NGIN': '成銀',
    'UMA': '馬',
    'RYU': '龍'
  };
  
  return pieceMap[pieceType] || pieceType;
}

function kifuMoveToGameMove(kifuMove: KifuMove): Move | null {
  const piece = {
    type: getPieceTypeFromChar(kifuMove.piece),
    player: kifuMove.player === Player.SENTE ? Player.SENTE : Player.GOTE
  };
  
  return {
    from: kifuMove.from ? { row: kifuMove.from.row, col: kifuMove.from.col } : null,
    to: { row: kifuMove.to.row, col: kifuMove.to.col },
    piece,
    promote: kifuMove.promote
  };
}

function getPieceTypeFromChar(char: string): string {
  const charMap: { [key: string]: string } = {
    '歩': 'FU',
    '香': 'KYO',
    '桂': 'KEI',
    '銀': 'GIN',
    '金': 'KIN',
    '角': 'KAKU',
    '飛': 'HI',
    '王': 'OU',
    'と': 'TO',
    '成香': 'NKYO',
    '成桂': 'NKEI',
    '成銀': 'NGIN',
    '馬': 'UMA',
    '龍': 'RYU'
  };
  
  return charMap[char] || 'FU';
}

// Export other functions from original file
export { 
  endGameWithKifu,
  saveCurrentGame,
  undoMoveWithKifu,
  exportGameAsKif,
  pauseGame,
  resumeGame
} from './gameWithKifu';