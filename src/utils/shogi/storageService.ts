import { KifuRecord, KifuMetadata } from '@/types/kifu';
import { GameState } from '@/types/shogi';
import { gameToKifFormat, kifFormatToGame } from './kifConverter';

const STORAGE_KEY = 'kifu_records';
const PAUSED_GAMES_KEY = 'paused_games';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

export interface PausedGame {
  id: string;
  gameState: GameState;
  kifuRecord: KifuRecord;
  pausedAt: string;
  gameMode: 'local' | 'ai' | 'online';
  metadata?: {
    aiDifficulty?: string;
    playerColor?: string;
    roomId?: string;
  };
}

function generateId(): string {
  return `kifu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveKifuRecord(record: KifuRecord): void {
  try {
    const records = getAllRecords();
    
    // Update if exists, otherwise add
    const existingIndex = records.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...record,
        updatedAt: new Date().toISOString()
      };
    } else {
      records.push(record);
    }
    
    // Check storage size
    const dataSize = new Blob([JSON.stringify(records)]).size;
    if (dataSize > MAX_STORAGE_SIZE) {
      throw new Error('Storage limit exceeded. Please delete some old records.');
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Storage limit')) {
      throw error;
    }
    throw new Error('Failed to save kifu record');
  }
}

export function loadKifuRecord(id: string): KifuRecord | null {
  const records = getAllRecords();
  return records.find(r => r.id === id) || null;
}

export function listKifuRecords(): KifuMetadata[] {
  const records = getAllRecords();
  return records.map(record => ({
    id: record.id,
    gameInfo: record.gameInfo,
    moveCount: record.moves.length,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function deleteKifuRecord(id: string): boolean {
  const records = getAllRecords();
  const filteredRecords = records.filter(r => r.id !== id);
  
  if (filteredRecords.length === records.length) {
    return false;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
  return true;
}

export function importKifFromText(kifText: string): KifuRecord {
  const { gameInfo, moves } = kifFormatToGame(kifText);
  const now = new Date().toISOString();
  
  const record: KifuRecord = {
    id: generateId(),
    gameInfo,
    moves,
    createdAt: now,
    updatedAt: now
  };
  
  saveKifuRecord(record);
  return record;
}

export function exportKifToText(id: string): string | null {
  const record = loadKifuRecord(id);
  if (!record) {
    return null;
  }
  
  return gameToKifFormat(record);
}

export function createNewKifuRecord(gameInfo: Partial<KifuRecord['gameInfo']> = {}): KifuRecord {
  const now = new Date();
  const defaultGameInfo = {
    date: now.toISOString().split('T')[0].replace(/-/g, '/'),
    startTime: now.toTimeString().split(' ')[0],
    sente: 'Player 1',
    gote: 'Player 2',
    ...gameInfo
  };
  
  return {
    id: generateId(),
    gameInfo: defaultGameInfo,
    moves: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

export function getStorageInfo(): { used: number; limit: number; percentage: number } {
  const records = getAllRecords();
  const used = new Blob([JSON.stringify(records)]).size;
  
  return {
    used,
    limit: MAX_STORAGE_SIZE,
    percentage: Math.round((used / MAX_STORAGE_SIZE) * 100)
  };
}

function getAllRecords(): KifuRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 中断されたゲームの保存
export function savePausedGame(pausedGame: PausedGame): void {
  try {
    const pausedGames = getAllPausedGames();
    
    // 既存の同じIDのゲームがあれば更新、なければ追加
    const existingIndex = pausedGames.findIndex(g => g.id === pausedGame.id);
    if (existingIndex >= 0) {
      pausedGames[existingIndex] = pausedGame;
    } else {
      pausedGames.push(pausedGame);
    }
    
    localStorage.setItem(PAUSED_GAMES_KEY, JSON.stringify(pausedGames));
  } catch {
    throw new Error('Failed to save paused game');
  }
}

// 中断されたゲームの読み込み
export function loadPausedGame(id: string): PausedGame | null {
  const pausedGames = getAllPausedGames();
  return pausedGames.find(g => g.id === id) || null;
}

// 中断されたゲームの一覧取得
export function listPausedGames(): PausedGame[] {
  return getAllPausedGames().sort((a, b) => 
    new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime()
  );
}

// 中断されたゲームの削除
export function deletePausedGame(id: string): boolean {
  const pausedGames = getAllPausedGames();
  const filteredGames = pausedGames.filter(g => g.id !== id);
  
  if (filteredGames.length === pausedGames.length) {
    return false;
  }
  
  localStorage.setItem(PAUSED_GAMES_KEY, JSON.stringify(filteredGames));
  return true;
}

function getAllPausedGames(): PausedGame[] {
  try {
    const data = localStorage.getItem(PAUSED_GAMES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Alias for backward compatibility
export const getStoredKifuRecords = listKifuRecords;