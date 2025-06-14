import { KifuRecord } from '@/types/kifu';
import { gameToKifFormat } from './kifConverter';
import { gameToKi2Format } from './ki2Converter';
import { gameToCsaFormat } from './csaConverter';

export type ExportFormat = 'kif' | 'ki2' | 'csa';

export function exportKifuRecord(record: KifuRecord, format: ExportFormat): string {
  switch (format) {
    case 'kif':
      return gameToKifFormat(record);
    case 'ki2':
      return gameToKi2Format(record);
    case 'csa':
      return gameToCsaFormat(record);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export function downloadKifuFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

export async function exportMultipleKifuRecords(
  records: { record: KifuRecord; fileName: string }[],
  format: ExportFormat
): Promise<Blob> {
  // For single file, just return the text blob
  if (records.length === 1) {
    const content = exportKifuRecord(records[0].record, format);
    return new Blob([content], { type: 'text/plain;charset=utf-8' });
  }
  
  // For multiple files, create a ZIP file
  // Note: This requires the JSZip library to be installed
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  records.forEach(({ record, fileName }) => {
    const content = exportKifuRecord(record, format);
    const fileExt = format === 'ki2' ? 'ki2' : format;
    const fullFileName = fileName.endsWith(`.${fileExt}`) ? fileName : `${fileName}.${fileExt}`;
    zip.file(fullFileName, content);
  });
  
  return await zip.generateAsync({ type: 'blob' });
}