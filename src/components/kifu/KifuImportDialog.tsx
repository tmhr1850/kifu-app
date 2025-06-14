'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ImportResult, importMultipleKifuFiles, validateKifuFiles } from '@/utils/shogi/fileImporter';
import { KifuRecord } from '@/types/kifu';

interface KifuImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: KifuRecord[]) => void;
}

export default function KifuImportDialog({ isOpen, onClose, onImport }: KifuImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const { valid, invalid } = validateKifuFiles(fileArray);
    
    if (invalid.length > 0) {
      const invalidResults: ImportResult[] = invalid.map(({ file, reason }) => ({
        success: false,
        fileName: file.name,
        error: reason
      }));
      setResults(prev => [...prev, ...invalidResults]);
    }
    
    if (valid.length > 0) {
      setImporting(true);
      const importResults = await importMultipleKifuFiles(valid);
      setResults(prev => [...prev, ...importResults]);
      setImporting(false);
      
      const successfulRecords = importResults
        .filter(r => r.success && r.record)
        .map(r => r.record!);
      
      if (successfulRecords.length > 0) {
        onImport(successfulRecords);
      }
    }
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleClose = useCallback(() => {
    setResults([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">棋譜をインポート</h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <p className="mt-2 text-sm text-gray-600">
            ファイルをドラッグ&ドロップ、または
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 font-medium"
              onClick={() => fileInputRef.current?.click()}
            >
              ファイルを選択
            </button>
          </p>
          
          <p className="text-xs text-gray-500 mt-1">
            対応形式: KIF, KI2, CSA (最大10MB)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".kif,.ki2,.csa,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {importing && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-600">インポート中...</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">インポート結果:</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.success ? '✓' : '✗'} {result.fileName}
                  {result.error && <span className="ml-2">({result.error})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}