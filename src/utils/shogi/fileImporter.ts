import { KifuRecord } from '@/types/kifu';
import { parseKifuFile } from './kifuFormatDetector';

export interface ImportResult {
  success: boolean;
  fileName: string;
  record?: KifuRecord;
  error?: string;
}

export async function importKifuFile(file: File): Promise<ImportResult> {
  try {
    const content = await file.text();
    const { gameInfo, moves } = parseKifuFile(content);
    
    const record: KifuRecord = {
      id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gameInfo,
      moves,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      fileName: file.name,
      record
    };
  } catch (error) {
    return {
      success: false,
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function importMultipleKifuFiles(files: File[]): Promise<ImportResult[]> {
  const results = await Promise.all(files.map(file => importKifuFile(file)));
  return results;
}

export function validateKifuFiles(files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];
  
  for (const file of files) {
    // Check file extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !['kif', 'ki2', 'csa', 'txt'].includes(ext)) {
      invalid.push({ file, reason: 'Invalid file extension' });
      continue;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      invalid.push({ file, reason: 'File too large (max 10MB)' });
      continue;
    }
    
    valid.push(file);
  }
  
  return { valid, invalid };
}