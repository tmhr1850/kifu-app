import { 
  Player, 
  ClockState, 
  TimeControlSettings, 
  TimeControlType,
  PlayerTime,
  GameState 
} from '@/types/shogi';

// 初期時計状態を作成
export function createInitialClockState(settings: TimeControlSettings): ClockState {
  const initialPlayerTime: PlayerTime = {
    remainingTime: settings.mainTime,
    inByoyomi: false,
    byoyomiPeriods: settings.type === TimeControlType.BYOYOMI ? settings.periods : undefined,
  };

  return {
    [Player.SENTE]: { ...initialPlayerTime },
    [Player.GOTE]: { ...initialPlayerTime },
    isRunning: false,
    lastUpdateTime: Date.now(),
  };
}

// 時計を開始
export function startClock(clockState: ClockState): ClockState {
  return {
    ...clockState,
    isRunning: true,
    lastUpdateTime: Date.now(),
  };
}

// 時計を停止
export function stopClock(clockState: ClockState): ClockState {
  if (!clockState.isRunning) {
    return clockState;
  }

  const currentTime = Date.now();
  const elapsed = (currentTime - clockState.lastUpdateTime) / 1000;
  const currentPlayer = getCurrentPlayerFromClock(clockState);
  
  if (!currentPlayer) {
    return {
      ...clockState,
      isRunning: false,
    };
  }

  return {
    ...clockState,
    [currentPlayer]: {
      ...clockState[currentPlayer],
      remainingTime: Math.max(0, clockState[currentPlayer].remainingTime - elapsed),
    },
    isRunning: false,
    lastUpdateTime: currentTime,
  };
}

// 手番切り替え時の時計更新
export function switchPlayerClock(
  clockState: ClockState,
  currentPlayer: Player,
  settings: TimeControlSettings
): ClockState {
  const currentTime = Date.now();
  const elapsed = clockState.isRunning ? (currentTime - clockState.lastUpdateTime) / 1000 : 0;
  
  // 現在のプレイヤーの時間を更新
  let updatedPlayerTime = {
    ...clockState[currentPlayer],
    remainingTime: Math.max(0, clockState[currentPlayer].remainingTime - elapsed),
  };

  // 時間制御に応じた処理
  switch (settings.type) {
    case TimeControlType.BYOYOMI:
      // 秒読みモードのチェック
      if (updatedPlayerTime.remainingTime === 0 && !updatedPlayerTime.inByoyomi) {
        updatedPlayerTime = {
          ...updatedPlayerTime,
          remainingTime: settings.byoyomi || 30,
          inByoyomi: true,
        };
      } else if (updatedPlayerTime.inByoyomi && updatedPlayerTime.remainingTime === 0) {
        // 秒読み時間も切れた場合、回数を減らす
        if ((updatedPlayerTime.byoyomiPeriods || 0) > 1) {
          updatedPlayerTime = {
            ...updatedPlayerTime,
            remainingTime: settings.byoyomi || 30,
            byoyomiPeriods: (updatedPlayerTime.byoyomiPeriods || 0) - 1,
          };
        }
      }
      break;

    case TimeControlType.FISCHER:
      // フィッシャー方式：時間を追加
      if (!updatedPlayerTime.inByoyomi) {
        updatedPlayerTime = {
          ...updatedPlayerTime,
          remainingTime: updatedPlayerTime.remainingTime + (settings.increment || 0),
        };
      }
      break;
  }

  return {
    ...clockState,
    [currentPlayer]: updatedPlayerTime,
    lastUpdateTime: currentTime,
  };
}

// 時間切れチェック
export function checkTimeUp(
  clockState: ClockState,
  player: Player,
  settings: TimeControlSettings
): boolean {
  const playerTime = clockState[player];
  
  if (playerTime.remainingTime > 0) {
    return false;
  }

  // 秒読みモードの場合
  if (settings.type === TimeControlType.BYOYOMI && playerTime.inByoyomi) {
    return (playerTime.byoyomiPeriods || 0) === 0;
  }

  return true;
}

// 時計から現在のプレイヤーを推定（どちらの時計が動いているか）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCurrentPlayerFromClock(_clockState: ClockState): Player | null {
  // この関数は実際にはGameStateから取得すべきだが、
  // 緊急時の推定用として実装
  return null;
}

// ゲーム状態に時間管理を追加
export function addTimeControlToGame(
  gameState: GameState,
  timeControl: TimeControlSettings
): GameState {
  return {
    ...gameState,
    timeControl,
    clockState: createInitialClockState(timeControl),
  };
}

// 移動後の時計更新を含むゲーム状態更新
export function updateGameStateWithClock(
  gameState: GameState,
  newGameState: GameState
): GameState {
  if (!gameState.clockState || !gameState.timeControl) {
    return newGameState;
  }

  // 手番が変わった場合、時計を更新
  if (gameState.currentPlayer !== newGameState.currentPlayer) {
    const updatedClockState = switchPlayerClock(
      gameState.clockState,
      gameState.currentPlayer,
      gameState.timeControl
    );

    return {
      ...newGameState,
      timeControl: gameState.timeControl,
      clockState: updatedClockState,
    };
  }

  return {
    ...newGameState,
    timeControl: gameState.timeControl,
    clockState: gameState.clockState,
  };
}