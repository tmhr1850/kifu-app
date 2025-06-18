'use client';

import { useState } from 'react';
import { TimeControlSettings, TimeControlType } from '@/types/shogi';

interface TimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: TimeControlSettings) => void;
  initialSettings?: TimeControlSettings;
}

const DEFAULT_SETTINGS: Record<TimeControlType, TimeControlSettings> = {
  [TimeControlType.SUDDEN_DEATH]: {
    type: TimeControlType.SUDDEN_DEATH,
    mainTime: 600, // 10分
  },
  [TimeControlType.BYOYOMI]: {
    type: TimeControlType.BYOYOMI,
    mainTime: 600, // 10分
    byoyomi: 30, // 30秒
    periods: 3, // 3回
  },
  [TimeControlType.FISCHER]: {
    type: TimeControlType.FISCHER,
    mainTime: 300, // 5分
    increment: 10, // 10秒追加
  },
};

export default function TimeSettingsModal({
  isOpen,
  onClose,
  onConfirm,
  initialSettings,
}: TimeSettingsModalProps) {
  const [selectedType, setSelectedType] = useState<TimeControlType>(
    initialSettings?.type || TimeControlType.BYOYOMI
  );
  const [settings, setSettings] = useState<TimeControlSettings>(
    initialSettings || DEFAULT_SETTINGS[TimeControlType.BYOYOMI]
  );

  if (!isOpen) return null;

  const handleTypeChange = (type: TimeControlType) => {
    setSelectedType(type);
    setSettings(DEFAULT_SETTINGS[type]);
  };

  const handleMainTimeChange = (minutes: number) => {
    setSettings({
      ...settings,
      mainTime: minutes * 60,
    });
  };

  const handleByoyomiChange = (seconds: number) => {
    setSettings({
      ...settings,
      byoyomi: seconds,
    });
  };

  const handlePeriodsChange = (periods: number) => {
    setSettings({
      ...settings,
      periods,
    });
  };

  const handleIncrementChange = (seconds: number) => {
    setSettings({
      ...settings,
      increment: seconds,
    });
  };

  const handleConfirm = () => {
    onConfirm(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">持ち時間設定</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">時間制御方式</label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value as TimeControlType)}
            className="w-full p-2 border rounded-md"
          >
            <option value={TimeControlType.SUDDEN_DEATH}>切れ負け</option>
            <option value={TimeControlType.BYOYOMI}>秒読み</option>
            <option value={TimeControlType.FISCHER}>フィッシャー方式</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            持ち時間（分）
          </label>
          <input
            type="number"
            value={Math.floor(settings.mainTime / 60)}
            onChange={(e) => handleMainTimeChange(parseInt(e.target.value) || 0)}
            min="0"
            max="180"
            className="w-full p-2 border rounded-md"
          />
        </div>

        {selectedType === TimeControlType.BYOYOMI && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                秒読み時間（秒）
              </label>
              <input
                type="number"
                value={settings.byoyomi}
                onChange={(e) => handleByoyomiChange(parseInt(e.target.value) || 30)}
                min="10"
                max="60"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                秒読み回数
              </label>
              <input
                type="number"
                value={settings.periods}
                onChange={(e) => handlePeriodsChange(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </>
        )}

        {selectedType === TimeControlType.FISCHER && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              1手ごとの追加時間（秒）
            </label>
            <input
              type="number"
              value={settings.increment}
              onChange={(e) => handleIncrementChange(parseInt(e.target.value) || 0)}
              min="0"
              max="60"
              className="w-full p-2 border rounded-md"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}