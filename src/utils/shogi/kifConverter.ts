import { KifuMove, GameInfo, KifuRecord, KifHeader } from '@/types/kifu';
import { Player } from '@/types/shogi';

const colToKanji = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];
const rowToKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function positionToKif(row: number, col: number): string {
  return `${colToKanji[8 - col]}${rowToKanji[row]}`;
}

export function kifToPosition(kif: string): { row: number; col: number } {
  const col = 8 - colToKanji.indexOf(kif[0]);
  const row = rowToKanji.indexOf(kif[1]);
  return { row, col };
}

export function moveToKif(move: KifuMove, moveNumber: number): string {
  const to = positionToKif(move.to.row, move.to.col);
  const piece = move.piece;
  const promote = move.promote ? '成' : '';
  
  let notation: string;
  if (move.from) {
    const from = `(${9 - move.from.col}${move.from.row + 1})`;
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
  const moveMatch = kifMove.match(/^\s*\d+\s+([１-９])([一-九])([^\s(]+)(\(.+\))?/);
  if (!moveMatch) {
    throw new Error(`Invalid KIF move format: ${kifMove}`);
  }
  
  const [, col, row, pieceInfo, fromInfo] = moveMatch;
  const to = kifToPosition(col + row);
  
  const isDrop = pieceInfo.includes('打');
  const isPromotion = pieceInfo.includes('成') && !pieceInfo.includes('成香') && !pieceInfo.includes('成桂') && !pieceInfo.includes('成銀');
  const piece = pieceInfo.replace(/[打成]/g, '');
  
  const move: KifuMove = {
    to,
    piece,
    player
  };
  
  if (!isDrop && fromInfo) {
    const fromMatch = fromInfo.match(/\((\d)(\d)\)/);
    if (fromMatch) {
      move.from = {
        col: 9 - parseInt(fromMatch[1]),
        row: parseInt(fromMatch[2]) - 1
      };
    }
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
  
  record.moves.forEach((move, index) => {
    lines.push(moveToKif(move, index + 1));
    if (move.comment) {
      lines.push(`*${move.comment}`);
    }
  });
  
  const result = record.gameInfo.result;
  if (result) {
    const resultText = getResultText(result);
    lines.push(`まで${record.moves.length}手で${resultText}`);
  }
  
  return lines.join('\n');
}

export function kifFormatToGame(kif: string): { gameInfo: GameInfo; moves: KifuMove[] } {
  const lines = kif.split('\n').filter(line => line.trim());
  const gameInfo: GameInfo = {
    date: '',
    startTime: '',
    sente: '',
    gote: ''
  };
  const moves: KifuMove[] = [];
  
  let currentPlayer: Player = 'sente';
  let lastComment: string | undefined;
  
  for (const line of lines) {
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
    } else if (line.startsWith('*')) {
      lastComment = line.substring(1);
    } else if (line.match(/^\s*\d+\s+/)) {
      const move = kifToMove(line, currentPlayer);
      if (lastComment) {
        move.comment = lastComment;
        lastComment = undefined;
      }
      moves.push(move);
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