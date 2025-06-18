'use client';

import React, { useState } from 'react';
import { EvaluationHistoryEntry, PositionAnalysis } from '@/types/analysis';
import { AnalysisExporter } from '@/utils/ai/analysisExporter';

interface AnalysisExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationHistory: EvaluationHistoryEntry[];
  analyses: Map<number, PositionAnalysis>;
  metadata?: {
    gameDate?: string;
    players?: {
      sente: string;
      gote: string;
    };
    analysisSettings?: {
      depth: number;
      multiPV: number;
    };
  };
}

type ExportFormat = 'json' | 'csv' | 'text';

export const AnalysisExportDialog: React.FC<AnalysisExportDialogProps> = ({
  isOpen,
  onClose,
  evaluationHistory,
  analyses,
  metadata,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');

  if (!isOpen) return null;

  const handleExport = () => {
    let content: string;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (selectedFormat) {
      case 'json':
        content = AnalysisExporter.exportToJSON(evaluationHistory, analyses, metadata);
        filename = `shogi-analysis-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = AnalysisExporter.exportToCSV(evaluationHistory, analyses);
        filename = `shogi-analysis-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
      case 'text':
        content = AnalysisExporter.exportToText(evaluationHistory, analyses, metadata);
        filename = `shogi-analysis-${timestamp}.txt`;
        mimeType = 'text/plain';
        break;
    }

    AnalysisExporter.downloadAsFile(content, filename, mimeType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">分析結果をエクスポート</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            エクスポート形式を選択してください
          </p>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="json"
                checked={selectedFormat === 'json'}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <span className="font-medium">JSON形式</span>
              <span className="text-sm text-gray-500 ml-2">
                （詳細なデータ、プログラムでの処理向け）
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={selectedFormat === 'csv'}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <span className="font-medium">CSV形式</span>
              <span className="text-sm text-gray-500 ml-2">
                （表計算ソフトでの分析向け）
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="text"
                checked={selectedFormat === 'text'}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <span className="font-medium">テキスト形式</span>
              <span className="text-sm text-gray-500 ml-2">
                （読みやすいレポート形式）
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            エクスポート
          </button>
        </div>
      </div>
    </div>
  );
};