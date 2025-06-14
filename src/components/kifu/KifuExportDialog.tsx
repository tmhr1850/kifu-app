'use client';

import React, { useState, useCallback } from 'react';
import { KifuRecord } from '@/types/kifu';
import { ExportFormat, exportKifuRecord, downloadKifuFile, copyToClipboard, exportMultipleKifuRecords } from '@/utils/shogi/fileExporter';

interface KifuExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  records: KifuRecord[];
  selectedRecords?: string[];
}

export default function KifuExportDialog({ isOpen, onClose, records, selectedRecords }: KifuExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('kif');
  const [exporting, setExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const recordsToExport = selectedRecords 
    ? records.filter(r => selectedRecords.includes(r.id))
    : records;

  const handleExport = useCallback(async () => {
    if (recordsToExport.length === 0) return;
    
    setExporting(true);
    
    try {
      if (recordsToExport.length === 1) {
        const content = exportKifuRecord(recordsToExport[0], format);
        const fileName = `kifu_${recordsToExport[0].id}.${format}`;
        downloadKifuFile(content, fileName);
      } else {
        const exportData = recordsToExport.map(record => ({
          record,
          fileName: `kifu_${record.id}`
        }));
        
        const blob = await exportMultipleKifuRecords(exportData, format);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kifu_export_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  }, [recordsToExport, format]);

  const handleCopyToClipboard = useCallback(async () => {
    if (recordsToExport.length !== 1) return;
    
    const content = exportKifuRecord(recordsToExport[0], format);
    const success = await copyToClipboard(content);
    
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [recordsToExport, format]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">棋譜をエクスポート</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            {recordsToExport.length}件の棋譜をエクスポートします
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            エクスポート形式
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="kif"
                checked={format === 'kif'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <span>KIF形式 (Kifu for Windows)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="ki2"
                checked={format === 'ki2'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <span>KI2形式</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="csa"
                checked={format === 'csa'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <span>CSA形式</span>
            </label>
          </div>
        </div>
        
        {recordsToExport.length > 1 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              複数の棋譜はZIPファイルとしてダウンロードされます
            </p>
          </div>
        )}
        
        <div className="flex justify-between">
          <div>
            {recordsToExport.length === 1 && (
              <button
                type="button"
                onClick={handleCopyToClipboard}
                disabled={exporting}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {copySuccess ? '✓ コピーしました' : 'クリップボードにコピー'}
              </button>
            )}
          </div>
          
          <div className="space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || recordsToExport.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting ? 'エクスポート中...' : 'エクスポート'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}