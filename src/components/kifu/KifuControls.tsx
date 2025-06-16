'use client';

import React, { useState, useRef } from 'react';
import { GameStateWithKifu } from '@/utils/shogi/gameWithKifu';
import { saveCurrentGame, exportGameAsKif } from '@/utils/shogi/gameWithKifu';
import { importKifFromText, getStorageInfo } from '@/utils/shogi/storageService';

interface KifuControlsProps {
  gameWithKifu: GameStateWithKifu | null;
  onImport: (kifuId: string) => void;
}

export const KifuControls: React.FC<KifuControlsProps> = ({
  gameWithKifu,
  onImport
}) => {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!gameWithKifu) return;
    
    try {
      saveCurrentGame(gameWithKifu);
      alert('棋譜を保存しました');
    } catch (error) {
      alert('保存に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExport = () => {
    if (!gameWithKifu) return;
    
    const kifText = exportGameAsKif(gameWithKifu);
    const blob = new Blob([kifText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kifu_${new Date().toISOString().slice(0, 10)}.kif`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleImportText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImportText = (text: string) => {
    try {
      const record = importKifFromText(text);
      onImport(record.id);
      setShowImport(false);
      setImportText('');
      alert('棋譜を読み込みました');
    } catch (error) {
      alert('読み込みに失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleSave}
          disabled={!gameWithKifu}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          保存
        </button>
        
        <button
          onClick={handleExport}
          disabled={!gameWithKifu}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          KIF形式で出力
        </button>
        
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          棋譜を読み込む
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          ファイルから読み込む
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".kif,.txt"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      <div className="text-sm text-gray-600">
        ストレージ使用量: {(storageInfo.used / 1024).toFixed(1)}KB / {(storageInfo.limit / 1024 / 1024).toFixed(0)}MB 
        ({storageInfo.percentage}%)
      </div>

      {showImport && (
        <div className="mt-4">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="KIF形式の棋譜をペーストしてください"
            className="w-full h-48 p-2 border border-gray-300 rounded-md"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleImportText(importText)}
              disabled={!importText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              読み込む
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setImportText('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};