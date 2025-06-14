export type KifuFormat = 'kif' | 'ki2' | 'csa' | 'unknown';

export function detectKifuFormat(content: string): KifuFormat {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check for CSA format
  if (lines.some(line => line.startsWith('V2.2') || line.match(/^[+-]\d{4}[A-Z]{2}/))) {
    return 'csa';
  }
  
  // Check for KIF format
  if (lines.some(line => line.includes('---- Kifu for Windows ----') || line.match(/^\s*\d+\s+[１-９][一-九].+\(\d{2}\)/))) {
    return 'kif';
  }
  
  // Check for KI2 format
  if (lines.some(line => line.match(/^[☗☖]?(同|[１-９][一-九])/))) {
    return 'ki2';
  }
  
  return 'unknown';
}

import { GameInfo, KifuMove } from '@/types/kifu';
import { kifFormatToGame } from './kifConverter';
import { ki2FormatToGame } from './ki2Converter';
import { csaFormatToGame } from './csaConverter';

export function parseKifuFile(content: string): { format: KifuFormat; gameInfo: GameInfo; moves: KifuMove[] } {
  const format = detectKifuFormat(content);
  
  switch (format) {
    case 'kif':
      return { format, ...kifFormatToGame(content) };
    case 'ki2':
      return { format, ...ki2FormatToGame(content) };
    case 'csa':
      return { format, ...csaFormatToGame(content) };
    default:
      throw new Error('Unknown kifu format');
  }
}