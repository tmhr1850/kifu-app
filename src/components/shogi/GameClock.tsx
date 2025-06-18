'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Player, ClockState, TimeControlSettings, TimeControlType } from '@/types/shogi';

interface GameClockProps {
  player: Player;
  clockState: ClockState;
  timeControl: TimeControlSettings;
  isCurrentPlayer: boolean;
  onTimeUp: (player: Player) => void;
  onByoyomiWarning?: (player: Player, secondsLeft: number) => void;
}

export default function GameClock({
  player,
  clockState,
  timeControl,
  isCurrentPlayer,
  onTimeUp,
  onByoyomiWarning,
}: GameClockProps) {
  const [displayTime, setDisplayTime] = useState(clockState[player].remainingTime);
  const [isWarning, setIsWarning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastByoyomiRef = useRef<number | null>(null);

  // 時間をフォーマット
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 秒読み音声通知
  const playByoyomiSound = useCallback((seconds: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 秒数に応じて音程を変える
    oscillator.frequency.value = seconds <= 3 ? 880 : 440; // 3秒以下は高音
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);

    // コールバック呼び出し
    if (onByoyomiWarning) {
      onByoyomiWarning(player, seconds);
    }
  }, [player, onByoyomiWarning]);

  // 時計の更新
  useEffect(() => {
    if (!clockState.isRunning || !isCurrentPlayer) {
      setDisplayTime(clockState[player].remainingTime);
      return;
    }

    const updateInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = (currentTime - clockState.lastUpdateTime) / 1000;
      const newTime = Math.max(0, clockState[player].remainingTime - elapsed);

      setDisplayTime(newTime);

      // 時間切れチェック
      if (newTime === 0) {
        onTimeUp(player);
        clearInterval(updateInterval);
        return;
      }

      // 秒読み音声通知
      if (clockState[player].inByoyomi && timeControl.type === TimeControlType.BYOYOMI) {
        const byoyomiSeconds = Math.ceil(newTime % (timeControl.byoyomi || 30));
        if (byoyomiSeconds <= 10 && byoyomiSeconds !== lastByoyomiRef.current) {
          lastByoyomiRef.current = byoyomiSeconds;
          playByoyomiSound(byoyomiSeconds);
        }
      }

      // 警告表示（残り30秒以下）
      setIsWarning(newTime <= 30);
    }, 100); // 100msごとに更新

    return () => clearInterval(updateInterval);
  }, [
    clockState,
    player,
    isCurrentPlayer,
    timeControl,
    onTimeUp,
    playByoyomiSound,
  ]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playerTime = clockState[player];
  const displayClass = `
    px-4 py-2 rounded-lg text-xl font-bold transition-colors
    ${isCurrentPlayer ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
    ${isWarning && isCurrentPlayer ? 'animate-pulse bg-red-500' : ''}
  `;

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium mb-1">
        {player === Player.SENTE ? '先手' : '後手'}
      </div>
      <div className={displayClass}>
        {formatTime(displayTime)}
      </div>
      {playerTime.inByoyomi && timeControl.type === TimeControlType.BYOYOMI && (
        <div className="text-sm mt-1 text-orange-600">
          秒読み {playerTime.byoyomiPeriods || 0}回
        </div>
      )}
    </div>
  );
}