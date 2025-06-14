import { KifuRecord, KifuMetadata } from '@/types/kifu';
import { gameToKifFormat, kifFormatToGame } from './kifConverter';

const STORAGE_KEY = 'kifu_records';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

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