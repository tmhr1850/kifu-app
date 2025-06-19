import { KifuMove, GameInfo, KifuRecord, VariationNode } from '@/types/kifu';
import { Player } from '@/types/shogi';
import { createRootNode, createVariationNode, findNodeById, getMainLineMoves } from './variations';

const colToKanji = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];
const rowToKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function positionToKi2(row: number, col: number): string {
  return `${colToKanji[col]}${rowToKanji[row]}`;
}

function ki2ToPosition(ki2: string): { row: number; col: number } {
  const col = colToKanji.indexOf(ki2[0]);
  const row = rowToKanji.indexOf(ki2[1]);
  return { row, col };
}

export function moveToKi2(move: KifuMove, prevMove: KifuMove | null): string {
  const playerSymbol = move.player === Player.SENTE ? '☗' : '☖';
  
  let notation = playerSymbol;
  
  // Check if it's the same destination as previous move
  if (prevMove && prevMove.to.row === move.to.row && prevMove.to.col === move.to.col) {
    notation += '同';
  } else {
    notation += positionToKi2(move.to.row, move.to.col);
  }
  
  notation += move.piece;
  
  // Add disambiguation if provided
  if (move.disambiguation) {
    notation += move.disambiguation;
  }
  
  // Add promotion
  if (move.promote) {
    notation += '成';
  }
  
  // Add drop indicator
  if (!move.from) {
    notation += '打';
  }
  
  return notation;
}

export function ki2ToMove(ki2Move: string, player: Player, prevMove: KifuMove | null): KifuMove {
  // Remove player symbol if present
  const moveWithoutSymbol = ki2Move.replace(/^[☗☖]/, '');
  
  const match = moveWithoutSymbol.match(/^(同|[１-９][一二三四五六七八九])(.+)$/u);
  if (!match) {
    throw new Error(`Invalid KI2 move format: ${ki2Move}`);
  }
  
  const [, position, pieceInfo] = match;
  
  let to: { row: number; col: number };
  if (position === '同') {
    if (!prevMove) {
      throw new Error('同 notation requires previous move');
    }
    to = prevMove.to;
  } else {
    to = ki2ToPosition(position);
  }
  
  const isPromotion = pieceInfo.includes('成') && !pieceInfo.includes('成香') && !pieceInfo.includes('成桂') && !pieceInfo.includes('成銀');
  
  // Extract piece and remove modifiers
  const piece = pieceInfo.replace(/[打成左右上下直]/g, '');
  
  const move: KifuMove = {
    to,
    piece,
    player
  };
  
  if (isPromotion) {
    move.promote = true;
  }
  
  // Extract disambiguation
  const disambiguationMatch = pieceInfo.match(/[左右上下直]/);
  if (disambiguationMatch) {
    move.disambiguation = disambiguationMatch[0];
  }
  
  return move;
}

export function gameToKi2Format(record: KifuRecord): string {
  const lines: string[] = [];
  
  lines.push('# KI2 Format');
  
  if (record.gameInfo.date && record.gameInfo.startTime) {
    lines.push(`開始日時：${record.gameInfo.date} ${record.gameInfo.startTime}`);
  }
  
  if (record.gameInfo.date && record.gameInfo.endTime) {
    lines.push(`終了日時：${record.gameInfo.date} ${record.gameInfo.endTime}`);
  }
  
  lines.push(`先手：${record.gameInfo.sente}`);
  lines.push(`後手：${record.gameInfo.gote}`);
  
  if (record.gameInfo.event) {
    lines.push(`棋戦：${record.gameInfo.event}`);
  }
  
  if (record.gameInfo.site) {
    lines.push(`場所：${record.gameInfo.site}`);
  }
  
  lines.push('');
  
  // If variationTree exists, use it; otherwise use the linear moves
  if (record.variationTree) {
    const ki2Lines = variationTreeToKi2Lines(record.variationTree);
    lines.push(...ki2Lines);
  } else {
    let prevMove: KifuMove | null = null;
    record.moves.forEach((move) => {
      lines.push(moveToKi2(move, prevMove));
      if (move.comment) {
        lines.push(`※${move.comment}`);
      }
      prevMove = move;
    });
  }
  
  const result = record.gameInfo.result;
  if (result) {
    lines.push('');
    const mainLineMoves = record.variationTree ? getMainLineMoves(record.variationTree) : record.moves;
    lines.push(`まで${mainLineMoves.length}手で${getResultText(result)}`);
  }
  
  return lines.join('\n');
}

export function ki2FormatToGame(ki2: string): { gameInfo: GameInfo; moves: KifuMove[]; variationTree?: VariationNode } {
  const lines = ki2.split('\n').filter(line => line.trim());
  const gameInfo: GameInfo = {
    date: '',
    startTime: '',
    sente: '',
    gote: ''
  };
  
  // Parse headers first
  let lineIndex = 0;
  for (; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    if (line.startsWith('#')) {
      continue;
    }
    
    if (line.includes('：')) {
      const [key, value] = line.split('：').map(s => s.trim());
      
      switch (key) {
        case '開始日時':
          const [date, time] = value.split(' ');
          gameInfo.date = date;
          gameInfo.startTime = time;
          break;
        case '終了日時':
          const endTimeParts = value.split(' ');
          if (endTimeParts.length > 1) {
            gameInfo.endTime = endTimeParts[1];
          }
          break;
        case '先手':
          gameInfo.sente = value;
          break;
        case '後手':
          gameInfo.gote = value;
          break;
        case '棋戦':
          gameInfo.event = value;
          break;
        case '場所':
          gameInfo.site = value;
          break;
      }
    } else if (line.match(/^[☗☖]/) || line.startsWith('※') || line.startsWith('**')) {
      // Found first move or comment, break header parsing
      break;
    }
  }
  
  // Check if the KI2 contains variations
  const hasVariations = lines.some(line => line.match(/^\*\*.*手目の変化$/));
  
  if (hasVariations) {
    // Parse with variation support
    const variationTree = parseKi2WithVariations(lines, lineIndex);
    const moves = getMainLineMoves(variationTree);
    return { gameInfo, moves, variationTree };
  } else {
    // Parse linear moves only (original logic)
    const moves: KifuMove[] = [];
    let currentPlayer: Player = Player.SENTE;
    let prevMove: KifuMove | null = null;
    let lastComment: string | undefined;
    
    for (let i = lineIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('※')) {
        lastComment = line.substring(1);
      } else if (line.match(/^[☗☖]/)) {
        const move = ki2ToMove(line, currentPlayer, prevMove);
        if (lastComment) {
          move.comment = lastComment;
          lastComment = undefined;
        }
        moves.push(move);
        prevMove = move;
        currentPlayer = currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
      }
    }
    
    return { gameInfo, moves };
  }
}

/**
 * Parse KI2 format with variation support
 */
function parseKi2WithVariations(lines: string[], startIndex: number): VariationNode {
  const root = createRootNode();
  const moveNumberToNodes = new Map<number, VariationNode[]>(); // Track nodes by move number
  
  interface ParseState {
    currentNode: VariationNode;
    player: Player;
    prevMove: KifuMove | null;
    moveNumber: number;
  }
  
  function parseMoveLine(line: string, state: ParseState): VariationNode | null {
    if (!line.match(/^[☗☖]/)) return null;
    
    const move = ki2ToMove(line, state.player, state.prevMove);
    state.moveNumber++;
    
    const newNode = createVariationNode(
      move,
      state.moveNumber,
      state.currentNode.id,
      true // Will be adjusted for variations
    );
    
    state.currentNode.children.push(newNode);
    
    // Track nodes by move number
    if (!moveNumberToNodes.has(state.moveNumber)) {
      moveNumberToNodes.set(state.moveNumber, []);
    }
    moveNumberToNodes.get(state.moveNumber)!.push(newNode);
    
    return newNode;
  }
  
  // Main line parsing state
  let mainState: ParseState = {
    currentNode: root,
    player: Player.SENTE,
    prevMove: null,
    moveNumber: 0
  };
  
  let i = startIndex;
  let pendingComment: string | undefined;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line) {
      i++;
      continue;
    }
    
    // Check for variation marker
    const variationMatch = line.match(/^\*\*\s*(\d+)手目の変化$/);
    if (variationMatch) {
      const branchMoveNumber = parseInt(variationMatch[1]);
      i++;
      
      // Find the node to branch from (parent of the variation)
      const nodesAtMove = moveNumberToNodes.get(branchMoveNumber);
      if (!nodesAtMove || nodesAtMove.length === 0) {
        console.warn(`Could not find branch point for variation at move ${branchMoveNumber}`);
        continue;
      }
      
      // Use the first (main line) node's parent as branch point
      const branchNode = nodesAtMove[0].parentId ? findNodeById(root, nodesAtMove[0].parentId) : null;
      if (!branchNode) {
        console.warn(`Could not find parent node for variation at move ${branchMoveNumber}`);
        continue;
      }
      
      // Parse variation
      const varState: ParseState = {
        currentNode: branchNode,
        player: branchMoveNumber % 2 === 1 ? Player.SENTE : Player.GOTE,
        prevMove: branchMoveNumber > 1 ? (moveNumberToNodes.get(branchMoveNumber - 1)?.[0]?.move || null) : null,
        moveNumber: branchMoveNumber - 1
      };
      
      let varPendingComment: string | undefined;
      
      while (i < lines.length) {
        const varLine = lines[i].trim();
        
        if (!varLine || varLine.match(/^\*\*.*手目の変化$/) || varLine.includes('まで')) {
          break;
        }
        
        if (varLine.startsWith('※')) {
          varPendingComment = varLine.substring(1);
          i++;
        } else if (varLine.match(/^[☗☖]/)) {
          const newNode = parseMoveLine(varLine, varState);
          if (newNode) {
            newNode.isMainLine = false; // Mark as variation
            if (varPendingComment) {
              newNode.comment = varPendingComment;
              varPendingComment = undefined;
            }
            varState.currentNode = newNode;
            varState.prevMove = newNode.move;
            varState.player = varState.player === Player.SENTE ? Player.GOTE : Player.SENTE;
          }
          i++;
        } else {
          i++;
        }
      }
    } else if (line.startsWith('※')) {
      pendingComment = line.substring(1);
      i++;
    } else if (line.match(/^[☗☖]/)) {
      // Main line move
      const newNode = parseMoveLine(line, mainState);
      if (newNode) {
        if (pendingComment) {
          newNode.comment = pendingComment;
          pendingComment = undefined;
        }
        mainState.currentNode = newNode;
        mainState.prevMove = newNode.move;
        mainState.player = mainState.player === Player.SENTE ? Player.GOTE : Player.SENTE;
      }
      i++;
    } else if (line.includes('まで')) {
      // End of game marker
      break;
    } else {
      i++;
    }
  }
  
  return root;
}

function getResultText(result: string): string {
  const resultMap: { [key: string]: string } = {
    'sente_win': '先手の勝ち',
    'gote_win': '後手の勝ち',
    'draw': '引き分け',
    'sennichite': '千日手',
    'jishogi': '持将棋',
    'illegal_move': '反則負け',
    'time_up': '時間切れ',
    'resign': '投了',
    'abort': '中断'
  };
  
  return resultMap[result] || result;
}

/**
 * Converts a variation tree to KI2 format lines
 */
function variationTreeToKi2Lines(root: VariationNode): string[] {
  const lines: string[] = [];
  const processedVariations = new Set<string>();
  const moveHistory: KifuMove[] = []; // Track move history for 同 notation
  
  function processNode(node: VariationNode, isMainLine: boolean = true) {
    if (!node.move) return; // Skip root node
    
    const prevMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
    lines.push(moveToKi2(node.move, prevMove));
    moveHistory.push(node.move);
    
    if (node.comment) {
      lines.push(`※${node.comment}`);
    }
    
    // Process children
    if (node.children.length > 0) {
      // First child continues the current line
      const mainChild = node.children[0];
      
      // Process other children as variations
      for (let i = 1; i < node.children.length; i++) {
        const varChild = node.children[i];
        if (!processedVariations.has(varChild.id)) {
          processedVariations.add(varChild.id);
          lines.push('');
          lines.push(`** ${node.moveNumber}手目の変化`);
          
          // Save current move history state
          const savedHistoryLength = moveHistory.length;
          processVariation(varChild);
          // Restore move history state
          moveHistory.length = savedHistoryLength;
        }
      }
      
      // Continue with main line
      processNode(mainChild, isMainLine);
    }
    
    if (!isMainLine) {
      moveHistory.pop(); // Clean up for variations
    }
  }
  
  function processVariation(node: VariationNode) {
    if (!node.move) return;
    
    const prevMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
    lines.push(moveToKi2(node.move, prevMove));
    moveHistory.push(node.move);
    
    if (node.comment) {
      lines.push(`※${node.comment}`);
    }
    
    // Process all children in this variation
    if (node.children.length > 0) {
      const mainChild = node.children[0];
      
      // Process additional variations first
      for (let i = 1; i < node.children.length; i++) {
        const varChild = node.children[i];
        if (!processedVariations.has(varChild.id)) {
          processedVariations.add(varChild.id);
          lines.push('');
          lines.push(`** ${node.moveNumber}手目の変化`);
          
          const savedHistoryLength = moveHistory.length;
          processVariation(varChild);
          moveHistory.length = savedHistoryLength;
        }
      }
      
      // Continue with the first child
      processVariation(mainChild);
    }
    
    moveHistory.pop(); // Clean up after processing
  }
  
  // Start processing from root's children (main line)
  if (root.children.length > 0) {
    processNode(root.children[0], true);
  }
  
  return lines;
}