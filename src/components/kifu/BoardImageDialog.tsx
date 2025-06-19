'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BoardState } from '@/types/shogi';
import { generateBoardImage, downloadBoardImage, ImageGeneratorOptions } from '@/utils/shogi/boardImageGenerator';

interface BoardImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardState: BoardState;
  title?: string;
}

const resolutionPresets = [
  { name: '小 (600x660)', width: 600, height: 660 },
  { name: '中 (900x990)', width: 900, height: 990 },
  { name: '大 (1200x1320)', width: 1200, height: 1320 },
  { name: '特大 (1800x1980)', width: 1800, height: 1980 },
];

export default function BoardImageDialog({ isOpen, onClose, boardState, title = 'board' }: BoardImageDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#f5deb3');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !previewRef.current) return;
    
    const preset = resolutionPresets[selectedPreset];
    const options: Partial<ImageGeneratorOptions> = {
      width: preset.width,
      height: preset.height,
      showCoordinates,
      backgroundColor,
    };
    
    const canvas = generateBoardImage(boardState, options);
    canvasRef.current = canvas;
    
    // Display preview
    const previewCanvas = canvas.cloneNode(true) as HTMLCanvasElement;
    const ctx = previewCanvas.getContext('2d');
    if (ctx) {
      const scale = Math.min(400 / canvas.width, 400 / canvas.height);
      previewCanvas.width = canvas.width * scale;
      previewCanvas.height = canvas.height * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(canvas, 0, 0);
    }
    
    // Remove all child nodes safely
    while (previewRef.current.firstChild) {
      previewRef.current.removeChild(previewRef.current.firstChild);
    }
    previewRef.current.appendChild(previewCanvas);
  }, [isOpen, boardState, selectedPreset, showCoordinates, backgroundColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const fileName = `${title}_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${format}`;
    downloadBoardImage(canvasRef.current, fileName, format);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">局面画像を生成</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">プレビュー</h3>
            <div
              ref={previewRef}
              className="border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center justify-center"
              style={{ minHeight: '400px' }}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                解像度
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {resolutionPresets.map((preset, index) => (
                  <option key={index} value={index}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像形式
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="png"
                    checked={format === 'png'}
                    onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                    className="mr-2"
                  />
                  <span>PNG (透過対応)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="jpeg"
                    checked={format === 'jpeg'}
                    onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                    className="mr-2"
                  />
                  <span>JPEG</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景色
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-20"
                />
                <span className="text-sm text-gray-600">{backgroundColor}</span>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showCoordinates}
                  onChange={(e) => setShowCoordinates(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  座標を表示
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ダウンロード
          </button>
        </div>
      </div>
    </div>
  );
}