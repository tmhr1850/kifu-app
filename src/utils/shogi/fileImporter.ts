import { KifuRecord } from '@/types/kifu';
import { parseKifuFile } from './kifuFormatDetector';
import { validateKifuContent, sanitizeFileName } from '@/utils/security/validation';

export interface ImportResult {
  success: boolean;
  fileName: string;
  record?: KifuRecord;
  error?: string;
}

export async function importKifuFile(file: File): Promise<ImportResult> {
  try {
    const content = await file.text();
    
    // Validate file content for security
    const validation = validateKifuContent(content);
    if (!validation.isValid) {
      return {
        success: false,
        fileName: file.name,
        error: validation.error || '無効なファイル内容です'
      };
    }
    
    const { gameInfo, moves } = parseKifuFile(content);
    
    // Sanitize file name for security
    const sanitizedFileName = sanitizeFileName(file.name);
    
    const record: KifuRecord = {
      id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gameInfo,
      moves,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      fileName: sanitizedFileName,
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
      invalid.push({ file, reason: '無効なファイル形式です (KIF, KI2, CSA, TXTのみ)' });
      continue;
    }
    
    // Check file size (max 1MB for security)
    if (file.size > 1 * 1024 * 1024) {
      invalid.push({ file, reason: 'ファイルサイズが大きすぎます (最大1MB)' });
      continue;
    }
    
    // Check file name for suspicious patterns
    const sanitizedName = sanitizeFileName(file.name);
    if (sanitizedName !== file.name) {
      invalid.push({ file, reason: 'ファイル名に無効な文字が含まれています' });
      continue;
    }
    
    // Check MIME type if available
    if (file.type && !['text/plain', 'application/octet-stream', ''].includes(file.type)) {
      invalid.push({ file, reason: '無効なファイルタイプです' });
      continue;
    }
    
    valid.push(file);
  }
  
  return { valid, invalid };
}