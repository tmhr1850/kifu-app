'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { EvaluationHistoryEntry, GraphSettings } from '@/types/analysis';

// Chart.jsの設定
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EvaluationGraphProps {
  history: EvaluationHistoryEntry[];
  currentMove: number;
  onMoveClick?: (moveNumber: number) => void;
  settings?: Partial<GraphSettings>;
  className?: string;
}

export const EvaluationGraph: React.FC<EvaluationGraphProps> = ({
  history,
  currentMove,
  onMoveClick,
  settings = {},
  className = ''
}) => {
  const chartRef = useRef<ChartJS<'line', number[], string>>(null);

  const defaultSettings: GraphSettings = {
    showGrid: true,
    showLabels: true,
    zoomEnabled: false,
    panEnabled: false,
    height: 300,
    ...settings
  };

  const chartData = useMemo(() => {
    const labels = history.map(entry => `${entry.moveNumber}手目`);
    const scores = history.map(entry => entry.score / 100); // センチポーンから変換

    return {
      labels,
      datasets: [
        {
          label: '評価値',
          data: scores,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, defaultSettings.height);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
            gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
            return gradient;
          },
          fill: true,
          tension: 0.3,
          pointRadius: (context: { dataIndex: number }) => {
            const entry = history[context.dataIndex];
            if (!entry) return 4;
            // 手の品質に応じてポイントサイズを変更
            if (entry.quality === 'brilliant' || entry.quality === 'blunder') return 8;
            if (entry.quality === 'good' || entry.quality === 'mistake') return 6;
            return 4;
          },
          pointHoverRadius: 8,
          pointBackgroundColor: (context: { dataIndex: number }) => {
            const idx = context.dataIndex;
            const entry = history[idx];
            // 現在の手は赤
            if (idx === currentMove) return 'rgb(239, 68, 68)';
            // 手の品質に応じて色を変更
            if (!entry) return 'rgb(59, 130, 246)';
            switch (entry.quality) {
              case 'brilliant': return 'rgb(34, 197, 94)'; // 緑
              case 'good': return 'rgb(59, 130, 246)'; // 青
              case 'mistake': return 'rgb(251, 146, 60)'; // オレンジ
              case 'blunder': return 'rgb(239, 68, 68)'; // 赤
              default: return 'rgb(59, 130, 246)'; // デフォルト青
            }
          },
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    };
  }, [history, currentMove, defaultSettings.height]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y;
            const sign = value >= 0 ? '+' : '';
            const entry = history[context.dataIndex];
            let label = `評価値: ${sign}${value.toFixed(1)}`;
            
            if (entry?.quality) {
              const qualityLabels = {
                brilliant: '素晴らしい手',
                good: '良い手',
                mistake: '悪手',
                blunder: '大悪手',
                normal: ''
              };
              const qualityLabel = qualityLabels[entry.quality];
              if (qualityLabel) {
                label += ` [${qualityLabel}]`;
              }
            }
            
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: defaultSettings.showLabels,
        grid: {
          display: defaultSettings.showGrid,
        },
      },
      y: {
        display: defaultSettings.showLabels,
        grid: {
          display: defaultSettings.showGrid,
        },
        min: -20,
        max: 20,
        ticks: {
          callback: (value) => {
            const numValue = Number(value);
            return numValue > 0 ? `+${numValue}` : `${numValue}`;
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onMoveClick) {
        const index = elements[0].index;
        onMoveClick(index);
      }
    },
  };

  // 現在の手にスクロール
  useEffect(() => {
    if (chartRef.current && currentMove >= 0) {
      const chart = chartRef.current;
      // グラフの現在位置を強調表示
      chart.update();
    }
  }, [currentMove]);

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">形勢推移</h3>
        <div className="text-sm text-gray-500">
          {currentMove + 1} / {history.length} 手目
        </div>
      </div>

      <div style={{ height: `${defaultSettings.height}px` }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span className="text-blue-600 font-semibold">先手優勢 ↑</span>
        <span>互角</span>
        <span className="text-red-600 font-semibold">↓ 後手優勢</span>
      </div>
      
      {/* 凡例 */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
          <span>素晴らしい手</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
          <span>良い手 / 通常</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-orange-400 mr-1"></div>
          <span>悪手</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
          <span>大悪手 / 現在</span>
        </div>
      </div>

      {/* 転換点の表示（将来的に実装） */}
      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">現在の評価値：</span>
            <span className={`ml-2 font-bold ${
              history[currentMove]?.score >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {history[currentMove]?.score >= 0 ? '+' : ''}
              {(history[currentMove]?.score / 100).toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};