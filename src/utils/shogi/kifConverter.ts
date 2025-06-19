import { KifuMove, GameInfo, KifuRecord, KifHeader, VariationNode } from '@/types/kifu';
import { Player } from '@/types/shogi';
import { createRootNode, createVariationNode, findNodeById, getMainLineMoves } from './variations';

const colToKanji = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];
const rowToKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function positionToKif(row: number, col: number): string {
  return `${colToKanji[col]}${rowToKanji[row]}`;
}

export function kifToPosition(kif: string): { row: number; col: number } {
  const col = colToKanji.indexOf(kif[0]);
  const row = rowToKanji.indexOf(kif[1]);
  return { row, col };
}

export function moveToKif(move: KifuMove, moveNumber: number): string {
  const to = positionToKif(move.to.row, move.to.col);
  const piece = move.piece;
  const promote = move.promote ? '成' : '';
  
  let notation: string;
  if (move.from) {
    const from = `(${move.from.col + 1}${move.from.row + 1})`;
    notation = `${to}${piece}${promote}${from}`;
  } else {
    notation = `${to}${piece}打`;
  }
  
  let result = `   ${moveNumber} ${notation}`;
  
  if (move.time !== undefined) {
    const minutes = Math.floor(move.time / 60);
    const seconds = move.time % 60;
    const totalTime = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    result += `   ( ${minutes}:${String(seconds).padStart(2, '0')}/${totalTime})`;
  }
  
  return result;
}

export function kifToMove(kifMove: string, player: Player): KifuMove {
  const moveMatch = kifMove.match(/^\s*\d+\s+([１-９])([一二三四五六七八九])([^\s(]+)(?:\((\d)(\d)\))?/);
  if (!moveMatch) {
    throw new Error(`Invalid KIF move format: ${kifMove}`);
  }
  
  const [, col, row, pieceInfo, fromCol, fromRow] = moveMatch;
  const to = kifToPosition(col + row);
  
  const isDrop = pieceInfo.includes('打');
  const isPromotion = pieceInfo.includes('成') && !pieceInfo.includes('成香') && !pieceInfo.includes('成桂') && !pieceInfo.includes('成銀');
  const piece = pieceInfo.replace(/[打成]/g, '');
  
  const move: KifuMove = {
    to,
    piece,
    player
  };
  
  if (!isDrop && fromCol && fromRow) {
    move.from = {
      col: parseInt(fromCol) - 1,
      row: parseInt(fromRow) - 1
    };
  }
  
  if (isPromotion) {
    move.promote = true;
  }
  
  const timeMatch = kifMove.match(/\(\s*(\d+):(\d+)\/[\d:]+\)/);
  if (timeMatch) {
    move.time = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
  }
  
  return move;
}

export function formatKifHeader(gameInfo: GameInfo): KifHeader {
  const headers: KifHeader = {};
  
  if (gameInfo.date && gameInfo.startTime) {
    headers['開始日時'] = `${gameInfo.date} ${gameInfo.startTime}`;
  }
  
  if (gameInfo.date && gameInfo.endTime) {
    headers['終了日時'] = `${gameInfo.date} ${gameInfo.endTime}`;
  }
  
  headers['先手'] = gameInfo.sente;
  headers['後手'] = gameInfo.gote;
  
  if (gameInfo.event) {
    headers['棋戦'] = gameInfo.event;
  }
  
  if (gameInfo.site) {
    headers['場所'] = gameInfo.site;
  }
  
  headers['手合割'] = gameInfo.handicap || '平手';
  
  if (gameInfo.timeLimit) {
    headers['持ち時間'] = `${gameInfo.timeLimit.initial}分`;
    if (gameInfo.timeLimit.byoyomi) {
      headers['秒読み'] = `${gameInfo.timeLimit.byoyomi}秒`;
    }
  }
  
  return headers;
}

export function gameToKifFormat(record: KifuRecord): string {
  const lines: string[] = [];
  
  lines.push('# ---- Kifu for Windows ----');
  
  const headers = formatKifHeader(record.gameInfo);
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${key}：${value}`);
  }
  
  lines.push('手数----指手---------消費時間--');
  
  // If variationTree exists, use it; otherwise use the linear moves
  if (record.variationTree) {
    const kifLines = variationTreeToKifLines(record.variationTree);
    lines.push(...kifLines);
  } else {
    record.moves.forEach((move, index) => {
      lines.push(moveToKif(move, index + 1));
      if (move.comment) {
        lines.push(`*${move.comment}`);
      }
    });
  }
  
  const result = record.gameInfo.result;
  if (result) {
    const mainLineMoves = record.variationTree ? getMainLineMoves(record.variationTree) : record.moves;
    const resultText = getResultText(result);
    lines.push(`まで${mainLineMoves.length}手で${resultText}`);
  }
  
  return lines.join('\n');
}

export function kifFormatToGame(kif: string): { gameInfo: GameInfo; moves: KifuMove[]; variationTree?: VariationNode } {
  const lines = kif.split('\n').filter(line => line.trim());
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
    
    if (line.startsWith('#') || line.includes('手数----指手')) {
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
        case '手合割':
          gameInfo.handicap = value;
          break;
      }
    } else if (line.match(/^\s*\d+\s+/)) {
      // Found first move, break header parsing
      break;
    }
  }
  
  // Check if the KIF contains variations
  const hasVariations = lines.some(line => line.match(/^変化：\d+手$/));
  
  if (hasVariations) {
    // Parse with variation support
    const variationTree = parseKifWithVariations(lines, lineIndex);
    const moves = getMainLineMoves(variationTree);
    return { gameInfo, moves, variationTree };
  } else {
    // Parse linear moves only (original logic)
    const moves: KifuMove[] = [];
    let currentPlayer: Player = Player.SENTE;
    
    for (let i = lineIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('*')) {
        // Comment applies to the previous move
        if (moves.length > 0) {
          moves[moves.length - 1].comment = line.substring(1);
        }
      } else if (line.match(/^\s*\d+\s+/)) {
        const move = kifToMove(line, currentPlayer);
        moves.push(move);
        currentPlayer = currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
      }
    }
    
    return { gameInfo, moves };
  }
}

/**
 * Parse KIF format with variation support
 */
function parseKifWithVariations(lines: string[], startIndex: number): VariationNode {
  const root = createRootNode();
  const nodeMap = new Map<string, VariationNode>(); // Map moveNumber to node for variations
  let currentPlayer: Player = Player.SENTE;
  
  interface ParseState {
    currentNode: VariationNode;
    player: Player;
  }
  
  function parseMoveLine(line: string, state: ParseState): VariationNode | null {
    const moveMatch = line.match(/^\s*(\d+)\s+/);
    if (!moveMatch) return null;
    
    const moveNumber = parseInt(moveMatch[1]);
    const move = kifToMove(line, state.player);
    
    const newNode = createVariationNode(
      move,
      moveNumber,
      state.currentNode.id,
      true // Will be adjusted for variations
    );
    
    state.currentNode.children.push(newNode);
    
    // Store in map for variation reference
    const mapKey = `${moveNumber}-${state.currentNode.id}`;
    nodeMap.set(mapKey, newNode);
    
    return newNode;
  }
  
  // Main line parsing state
  let mainState: ParseState = {
    currentNode: root,
    player: Player.SENTE
  };
  
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line) {
      i++;
      continue;
    }
    
    // Check for variation marker
    const variationMatch = line.match(/^変化：(\d+)手$/);
    if (variationMatch) {
      const branchMoveNumber = parseInt(variationMatch[1]);
      i++;
      
      // Find the node to branch from
      let branchNode: VariationNode | null = null;
      for (const [key, node] of nodeMap.entries()) {
        if (node.moveNumber === branchMoveNumber) {
          branchNode = node.parentId ? findNodeById(root, node.parentId) : null;
          break;
        }
      }
      
      if (!branchNode) {
        console.warn(`Could not find branch point for variation at move ${branchMoveNumber}`);
        continue;
      }
      
      // Parse variation
      const varState: ParseState = {
        currentNode: branchNode,
        player: branchMoveNumber % 2 === 1 ? Player.SENTE : Player.GOTE
      };
      
      while (i < lines.length) {
        const varLine = lines[i].trim();
        
        if (!varLine || varLine.match(/^変化：\d+手$/) || varLine.includes('まで')) {
          break;
        }
        
        if (varLine.startsWith('*')) {
          // Comment for previous move in variation
          if (varState.currentNode.move) {
            varState.currentNode.comment = varLine.substring(1);
          }
          i++;
        } else if (varLine.match(/^\s*\d+\s+/)) {
          const newNode = parseMoveLine(varLine, varState);
          if (newNode) {
            newNode.isMainLine = false; // Mark as variation
            varState.currentNode = newNode;
            varState.player = varState.player === Player.SENTE ? Player.GOTE : Player.SENTE;
          }
          i++;
        } else {
          i++;
        }
      }
    } else if (line.startsWith('*')) {
      // Comment for main line
      if (mainState.currentNode.move) {
        mainState.currentNode.comment = line.substring(1);
      }
      i++;
    } else if (line.match(/^\s*\d+\s+/)) {
      // Main line move
      const newNode = parseMoveLine(line, mainState);
      if (newNode) {
        mainState.currentNode = newNode;
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
 * Converts a variation tree to KIF format lines
 */
function variationTreeToKifLines(root: VariationNode): string[] {
  const lines: string[] = [];
  const processedVariations = new Set<string>();
  
  function processNode(node: VariationNode, isMainLine: boolean = true) {
    if (!node.move) return; // Skip root node
    
    lines.push(moveToKif(node.move, node.moveNumber));
    if (node.comment) {
      lines.push(`*${node.comment}`);
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
          lines.push(`変化：${node.moveNumber}手`);
          processVariation(varChild);
        }
      }
      
      // Continue with main line
      processNode(mainChild, isMainLine);
    }
  }
  
  function processVariation(node: VariationNode) {
    if (!node.move) return;
    
    lines.push(moveToKif(node.move, node.moveNumber));
    if (node.comment) {
      lines.push(`*${node.comment}`);
    }
    
    // Process all children in this variation
    if (node.children.length > 0) {
      // For variations, we process all children recursively
      const mainChild = node.children[0];
      
      // Process additional variations first
      for (let i = 1; i < node.children.length; i++) {
        const varChild = node.children[i];
        if (!processedVariations.has(varChild.id)) {
          processedVariations.add(varChild.id);
          lines.push('');
          lines.push(`変化：${node.moveNumber}手`);
          processVariation(varChild);
        }
      }
      
      // Continue with the first child
      processVariation(mainChild);
    }
  }
  
  // Start processing from root's children (main line)
  if (root.children.length > 0) {
    processNode(root.children[0], true);
  }
  
  return lines;
}