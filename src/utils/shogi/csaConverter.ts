import { KifuMove, GameInfo, KifuRecord, VariationNode } from '@/types/kifu';
import { Player } from '@/types/shogi';
import { 
  getMainLineMoves, 
  createRootNode, 
  createVariationNode
} from './variations';

// CSA piece codes
const pieceToCSA: { [key: string]: string } = {
  '歩': 'FU',
  '香': 'KY',
  '桂': 'KE',
  '銀': 'GI',
  '金': 'KI',
  '角': 'KA',
  '飛': 'HI',
  '玉': 'OU',
  '王': 'OU',
  'と': 'TO',
  '成香': 'NY',
  '成桂': 'NK',
  '成銀': 'NG',
  '馬': 'UM',
  '龍': 'RY',
  '竜': 'RY'
};

const csaToPiece: { [key: string]: string } = {
  'FU': '歩',
  'KY': '香',
  'KE': '桂',
  'GI': '銀',
  'KI': '金',
  'KA': '角',
  'HI': '飛',
  'OU': '玉',
  'TO': 'と',
  'NY': '成香',
  'NK': '成桂',
  'NG': '成銀',
  'UM': '馬',
  'RY': '龍'
};

function positionToCSA(row: number, col: number): string {
  return `${9 - col}${row + 1}`;
}

function csaToPosition(csa: string): { row: number; col: number } {
  const col = 9 - parseInt(csa[0]);
  const row = parseInt(csa[1]) - 1;
  return { row, col };
}

export function moveToCsa(move: KifuMove): string {
  const player = move.player === Player.SENTE ? '+' : '-';
  const from = move.from ? positionToCSA(move.from.row, move.from.col) : '00';
  const to = positionToCSA(move.to.row, move.to.col);
  const piece = pieceToCSA[move.piece] || move.piece;
  
  return `${player}${from}${to}${piece}`;
}

export function csaToMove(csaMove: string): KifuMove {
  const match = csaMove.match(/^([+-])(\d{2})(\d{2})([A-Z]{2})$/);
  if (!match) {
    throw new Error(`Invalid CSA move format: ${csaMove}`);
  }
  
  const [, playerSign, fromPos, toPos, pieceCode] = match;
  const player: Player = playerSign === '+' ? Player.SENTE : Player.GOTE;
  const to = csaToPosition(toPos);
  const piece = csaToPiece[pieceCode] || pieceCode;
  
  const move: KifuMove = {
    to,
    piece,
    player
  };
  
  if (fromPos !== '00') {
    move.from = csaToPosition(fromPos);
    
    // Check if this is a promotion move
    const isPromotablePiece = ['歩', '香', '桂', '銀', '角', '飛'].includes(piece);
    const isPromotedPiece = ['と', '成香', '成桂', '成銀', '馬', '龍'].includes(piece);
    
    if (!isPromotedPiece && isPromotablePiece && move.from) {
      // In CSA, promotion is indicated by the piece code in the next position
      // For now, we'll handle this in the game parser
    }
  }
  
  return move;
}

export function gameToCsaFormat(record: KifuRecord): string {
  const lines: string[] = [];
  
  // Version
  lines.push('V2.2');
  
  // Player names
  lines.push(`N+${record.gameInfo.sente}`);
  lines.push(`N-${record.gameInfo.gote}`);
  
  // Game info
  if (record.gameInfo.date && record.gameInfo.startTime) {
    lines.push(`$START_TIME:${record.gameInfo.date} ${record.gameInfo.startTime}`);
  }
  
  if (record.gameInfo.event) {
    lines.push(`$EVENT:${record.gameInfo.event}`);
  }
  
  if (record.gameInfo.site) {
    lines.push(`$SITE:${record.gameInfo.site}`);
  }
  
  if (record.gameInfo.timeLimit) {
    lines.push(`$TIME_LIMIT:${String(record.gameInfo.timeLimit.initial).padStart(2, '0')}:00+${record.gameInfo.timeLimit.byoyomi || 0}`);
  }
  
  // Initial position (PI = plain initial position)
  lines.push('PI');
  
  // Starting player
  lines.push('+');
  
  // Get moves - use main line only if variationTree exists
  const movesToExport = record.variationTree ? getMainLineMoves(record.variationTree) : record.moves;
  
  // Export variations if they exist
  if (record.variationTree && hasVariations(record.variationTree)) {
    lines.push("'このCSAファイルには変化手順が含まれています。");
    lines.push("'標準のCSAフォーマットではないため、互換性に注意してください。");
    
    // Export variations as special comments
    exportVariationsAsComments(record.variationTree, lines);
  }
  
  // Moves
  movesToExport.forEach((move) => {
    let moveStr = moveToCsa(move);
    if (move.time !== undefined) {
      moveStr += `,T${move.time}`;
    }
    lines.push(moveStr);
    
    if (move.comment) {
      lines.push(`'${move.comment}`);
    }
  });
  
  // Result
  if (record.gameInfo.result) {
    switch (record.gameInfo.result) {
      case 'sente_win':
      case 'gote_win':
      case 'resign':
        lines.push('%TORYO');
        break;
      case 'sennichite':
        lines.push('%SENNICHITE');
        break;
      case 'time_up':
        lines.push('%TIME_UP');
        break;
      case 'illegal_move':
        lines.push('%ILLEGAL_MOVE');
        break;
      case 'jishogi':
        lines.push('%JISHOGI');
        break;
      case 'draw':
        lines.push('%HIKIWAKE');
        break;
    }
  }
  
  return lines.join('\n');
}

/**
 * Check if variation tree has any variations (not just main line)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasVariations(root: any): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function checkNode(node: any): boolean {
    if (node.children && node.children.length > 1) {
      return true;
    }
    if (node.children && node.children.length === 1) {
      return checkNode(node.children[0]);
    }
    return false;
  }
  return checkNode(root);
}

export function csaFormatToGame(csa: string): { gameInfo: GameInfo; moves: KifuMove[]; variationTree?: VariationNode } {
  const lines = csa.split('\n').filter(line => line.trim());
  const gameInfo: GameInfo = {
    date: '',
    startTime: '',
    sente: '',
    gote: ''
  };
  const moves: KifuMove[] = [];
  
  let lastComment: string | undefined;
  let hasVariationComments = false;
  
  // First pass: check if CSA contains variation comments
  for (const line of lines) {
    if (line.match(/^'VARIATION:\d+:/)) {
      hasVariationComments = true;
      break;
    }
  }
  
  // Parse headers and moves
  for (const line of lines) {
    if (line.startsWith('N+')) {
      gameInfo.sente = line.substring(2);
    } else if (line.startsWith('N-')) {
      gameInfo.gote = line.substring(2);
    } else if (line.startsWith('$START_TIME:')) {
      const [date, time] = line.substring(12).split(' ');
      gameInfo.date = date;
      gameInfo.startTime = time;
    } else if (line.startsWith('$EVENT:')) {
      gameInfo.event = line.substring(7);
    } else if (line.startsWith('$SITE:')) {
      gameInfo.site = line.substring(6);
    } else if (line.startsWith('$TIME_LIMIT:')) {
      const timeMatch = line.match(/(\d+):(\d+)\+(\d+)/);
      if (timeMatch) {
        gameInfo.timeLimit = {
          initial: parseInt(timeMatch[1]),
          byoyomi: parseInt(timeMatch[3])
        };
      }
    } else if (line.startsWith("'")) {
      lastComment = line.substring(1);
    } else if (line.match(/^[+-]\d{4}[A-Z]{2}/)) {
      const [moveStr, timeStr] = line.split(',');
      const move = csaToMove(moveStr);
      
      if (timeStr && timeStr.startsWith('T')) {
        move.time = parseInt(timeStr.substring(1));
      }
      
      if (lastComment) {
        move.comment = lastComment;
        lastComment = undefined;
      }
      
      moves.push(move);
    } else if (line.startsWith('%')) {
      // Handle result
      switch (line) {
        case '%TORYO':
          gameInfo.result = moves.length % 2 === 1 ? 'gote_win' : 'sente_win';
          break;
        case '%SENNICHITE':
          gameInfo.result = 'sennichite';
          break;
        case '%TIME_UP':
          gameInfo.result = 'time_up';
          break;
        case '%ILLEGAL_MOVE':
          gameInfo.result = 'illegal_move';
          break;
        case '%JISHOGI':
          gameInfo.result = 'jishogi';
          break;
        case '%HIKIWAKE':
          gameInfo.result = 'draw';
          break;
      }
    }
  }
  
  // If has variation comments, parse them and build variation tree
  if (hasVariationComments) {
    const variationTree = parseCSAVariations(lines, moves);
    return { gameInfo, moves: getMainLineMoves(variationTree), variationTree };
  }
  
  return { gameInfo, moves };
}

/**
 * Parse CSA variations from comment lines
 */
function parseCSAVariations(lines: string[], mainMoves: KifuMove[]): VariationNode {
  const root = createRootNode();
  const moveNumberToNodes = new Map<number, VariationNode[]>();
  
  // Build main line first
  let currentNode = root;
  for (let i = 0; i < mainMoves.length; i++) {
    const newNode = createVariationNode(mainMoves[i], i + 1, currentNode.id, true);
    currentNode.children.push(newNode);
    
    if (!moveNumberToNodes.has(i + 1)) {
      moveNumberToNodes.set(i + 1, []);
    }
    moveNumberToNodes.get(i + 1)!.push(newNode);
    
    currentNode = newNode;
  }
  
  // Parse variation comments
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check for variation marker
    const variationMatch = line.match(/^'VARIATION:(\d+):(.*)/);
    if (variationMatch) {
      const branchMoveNumber = parseInt(variationMatch[1]);
      const variationName = variationMatch[2] || undefined;
      
      // Find parent node
      const parentNodes = moveNumberToNodes.get(branchMoveNumber - 1);
      if (!parentNodes || parentNodes.length === 0) {
        i++;
        continue;
      }
      
      const parentNode = parentNodes[0];
      let varCurrentNode = parentNode;
      let varMoveNumber = branchMoveNumber - 1;
      let varPlayer = branchMoveNumber % 2 === 1 ? Player.SENTE : Player.GOTE;
      
      // Parse variation moves
      i++;
      while (i < lines.length) {
        const varLine = lines[i];
        
        if (varLine.match(/^'VARIATION:/) || varLine.startsWith('%')) {
          break;
        }
        
        if (varLine.match(/^[+-]\d{4}[A-Z]{2}/)) {
          const [moveStr] = varLine.split(',');
          const move = csaToMove(moveStr);
          varMoveNumber++;
          
          const newNode = createVariationNode(
            move,
            varMoveNumber,
            varCurrentNode.id,
            false
          );
          
          if (variationName && varCurrentNode === parentNode) {
            newNode.comment = variationName;
          }
          
          varCurrentNode.children.push(newNode);
          varCurrentNode = newNode;
          varPlayer = varPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        }
        
        i++;
      }
    } else {
      i++;
    }
  }
  
  return root;
}

/**
 * Export variations as CSA comments
 */
function exportVariationsAsComments(root: VariationNode, lines: string[]) {
  const processedVariations = new Set<string>();
  
  function processNode(node: VariationNode) {
    if (!node.children) return;
    
    // Process variations (non-main line children)
    for (let i = 1; i < node.children.length; i++) {
      const varChild = node.children[i];
      if (!processedVariations.has(varChild.id)) {
        processedVariations.add(varChild.id);
        
        // Add variation marker
        const variationName = varChild.comment || '';
        lines.push(`'VARIATION:${node.moveNumber}:${variationName}`);
        
        // Export variation moves
        exportVariationBranch(varChild, lines);
      }
    }
    
    // Continue with main line
    if (node.children.length > 0) {
      processNode(node.children[0]);
    }
  }
  
  function exportVariationBranch(node: VariationNode, lines: string[]) {
    if (!node.move) return;
    
    let moveStr = moveToCsa(node.move);
    if (node.move.time !== undefined) {
      moveStr += `,T${node.move.time}`;
    }
    lines.push(moveStr);
    
    if (node.move.comment && !node.comment) {
      lines.push(`'${node.move.comment}`);
    }
    
    // Process children recursively
    if (node.children.length > 0) {
      // Process additional variations first
      for (let i = 1; i < node.children.length; i++) {
        const varChild = node.children[i];
        if (!processedVariations.has(varChild.id)) {
          processedVariations.add(varChild.id);
          lines.push(`'VARIATION:${node.moveNumber}:${varChild.comment || ''}`);
          exportVariationBranch(varChild, lines);
        }
      }
      
      // Continue with first child
      exportVariationBranch(node.children[0], lines);
    }
  }
  
  // Start from root's children
  if (root.children.length > 0) {
    processNode(root.children[0]);
  }
}