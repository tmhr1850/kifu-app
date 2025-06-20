import { KifuRecord } from '@/types/kifu';
import { parseKifuFile } from './kifuFormatDetector';
import { validateFileSize, validateFileExtension, validateKifuContent, sanitizeFilename } from '@/utils/security';

export interface ImportResult {
  success: boolean;
  fileName: string;
  record?: KifuRecord;
  error?: string;
}

export async function importKifuFile(file: File): Promise<ImportResult> {
  try {
    // Validate file before processing
    const validation = validateKifuFile(file);
    if (!validation.valid) {
      return {
        success: false,
        fileName: file.name,
        error: validation.reason
      };
    }
    
    const content = await file.text();
    
    // Validate content for malicious patterns
    const contentValidation = validateKifuContent(content);
    if (!contentValidation.valid) {
      return {
        success: false,
        fileName: file.name,
        error: contentValidation.reason
      };
    }
    
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

function validateKifuFile(file: File): { valid: boolean; reason?: string } {
  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name);
  
  // Check file extension
  if (!validateFileExtension(sanitizedName, ['kif', 'ki2', 'csa', 'txt'])) {
    return { valid: false, reason: 'Invalid file extension. Only .kif, .ki2, .csa, and .txt files are allowed.' };
  }
  
  // Check file size (max 1MB for security)
  if (!validateFileSize(file, 1)) {
    return { valid: false, reason: 'File too large (maximum 1MB)' };
  }
  
  // Check MIME type if available
  const allowedMimeTypes = ['text/plain', 'application/octet-stream', ''];
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return { valid: false, reason: 'Invalid file type' };
  }
  
  return { valid: true };
}

export function validateKifuFiles(files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];
  
  for (const file of files) {
    const validation = validateKifuFile(file);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, reason: validation.reason || 'Unknown error' });
    }
  }
  
  return { valid, invalid };
}