'use client';

import React from 'react';
import { AnalysisSettings, AnalysisMode } from '@/types/analysis';

interface AnalysisModePanelProps {
  mode: AnalysisMode;
  settings: AnalysisSettings;
  onModeChange: (mode: AnalysisMode) => void;
  onSettingsChange: (settings: AnalysisSettings) => void;
  isAnalyzing: boolean;
  className?: string;
}

export const AnalysisModePanel: React.FC<AnalysisModePanelProps> = ({
  mode,
  settings,
  onModeChange,
  onSettingsChange,
  isAnalyzing,
  className = ''
}) => {
  const handleToggleAnalysis = () => {
    if (mode === 'off') {
      onModeChange('analyzing');
    } else {
      onModeChange('off');
    }
  };

  const handleDepthChange = (depth: number) => {
    onSettingsChange({ ...settings, depth });
  };

  const handleMultiPVChange = (multiPV: number) => {
    onSettingsChange({ ...settings, multiPV });
  };

  const handleAutoAnalyzeToggle = () => {
    onSettingsChange({ ...settings, autoAnalyze: !settings.autoAnalyze });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">分析設定</h3>
        <button
          onClick={handleToggleAnalysis}
          disabled={isAnalyzing && mode === 'analyzing'}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode !== 'off'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {mode !== 'off' ? (
            isAnalyzing ? '分析中...' : '分析停止'
          ) : '分析開始'}
        </button>
      </div>

      <div className="space-y-4">
        {/* 探索深度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            探索深度
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="10"
              value={settings.depth}
              onChange={(e) => handleDepthChange(Number(e.target.value))}
              className="flex-1"
              disabled={mode !== 'off'}
            />
            <span className="w-12 text-center font-medium">
              {settings.depth}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            深いほど正確ですが時間がかかります
          </p>
        </div>

        {/* 候補手の数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            候補手の数
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="5"
              value={settings.multiPV}
              onChange={(e) => handleMultiPVChange(Number(e.target.value))}
              className="flex-1"
              disabled={mode !== 'off'}
            />
            <span className="w-12 text-center font-medium">
              {settings.multiPV}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            複数の候補手を表示します
          </p>
        </div>

        {/* 自動分析 */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              自動分析
            </label>
            <p className="text-xs text-gray-500 mt-1">
              指し手ごとに自動で分析
            </p>
          </div>
          <button
            onClick={handleAutoAnalyzeToggle}
            disabled={mode !== 'off'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoAnalyze ? 'bg-blue-500' : 'bg-gray-300'
            } ${mode !== 'off' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoAnalyze ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ステータス表示 */}
      {mode === 'analyzing' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600">分析中...</span>
          </div>
        </div>
      )}
    </div>
  );
};