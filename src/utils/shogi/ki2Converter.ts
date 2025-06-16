import { KifuMove, GameInfo, KifuRecord } from '@/types/kifu';
import { Player } from '@/types/shogi';

const colToKanji = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];
const rowToKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function positionToKi2(row: number, col: number): string {
  return `${colToKanji[8 - col]}${rowToKanji[row]}`;
}

function ki2ToPosition(ki2: string): { row: number; col: number } {
  const col = 8 - colToKanji.indexOf(ki2[0]);
  const row = rowToKanji.indexOf(ki2[1]);
  return { row, col };
}

export function moveToKi2(move: KifuMove, prevMove: KifuMove | null): string {
  const playerSymbol = move.player === 'sente' ? '☗' : '☖';
  
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
  
  let prevMove: KifuMove | null = null;
  record.moves.forEach((move) => {
    lines.push(moveToKi2(move, prevMove));
    if (move.comment) {
      lines.push(`※${move.comment}`);
    }
    prevMove = move;
  });
  
  const result = record.gameInfo.result;
  if (result) {
    lines.push('');
    lines.push(`まで${record.moves.length}手で${getResultText(result)}`);
  }
  
  return lines.join('\n');
}

export function ki2FormatToGame(ki2: string): { gameInfo: GameInfo; moves: KifuMove[] } {
  const lines = ki2.split('\n').filter(line => line.trim());
  const gameInfo: GameInfo = {
    date: '',
    startTime: '',
    sente: '',
    gote: ''
  };
  const moves: KifuMove[] = [];
  
  let currentPlayer: Player = 'sente';
  let prevMove: KifuMove | null = null;
  let lastComment: string | undefined;
  
  for (const line of lines) {
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
    } else if (line.startsWith('※')) {
      lastComment = line.substring(1);
    } else if (line.match(/^[☗☖]/)) {
      const move = ki2ToMove(line, currentPlayer, prevMove);
      if (lastComment) {
        move.comment = lastComment;
        lastComment = undefined;
      }
      moves.push(move);
      prevMove = move;
      currentPlayer = currentPlayer === 'sente' ? 'gote' : 'sente';
    }
  }
  
  return { gameInfo, moves };
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