import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// と金の移動ルール（金と同じ）
export class ToMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: 0, dy: this.adjustDirection(1), repeat: false },   // 前
      { dx: -1, dy: this.adjustDirection(1), repeat: false },  // 左前
      { dx: 1, dy: this.adjustDirection(1), repeat: false },   // 右前
      { dx: -1, dy: 0, repeat: false },                        // 左
      { dx: 1, dy: 0, repeat: false },                         // 右
      { dx: 0, dy: this.adjustDirection(-1), repeat: false },  // 後ろ
    ];
  }
}

// 成香の移動ルール（金と同じ）
export class NkyoMovement extends ToMovement {}

// 成桂の移動ルール（金と同じ）
export class NkeiMovement extends ToMovement {}

// 成銀の移動ルール（金と同じ）
export class NginMovement extends ToMovement {}

// 龍馬（成角）の移動ルール
export class UmaMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      // 角の動き
      { dx: -1, dy: -1, repeat: true }, // 左上
      { dx: 1, dy: -1, repeat: true },  // 右上
      { dx: -1, dy: 1, repeat: true },  // 左下
      { dx: 1, dy: 1, repeat: true },   // 右下
      // 追加で1マス前後左右
      { dx: 0, dy: -1, repeat: false }, // 上
      { dx: 0, dy: 1, repeat: false },  // 下
      { dx: -1, dy: 0, repeat: false }, // 左
      { dx: 1, dy: 0, repeat: false },  // 右
    ];
  }
}

// 龍王（成飛）の移動ルール
export class RyuMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      // 飛車の動き
      { dx: 0, dy: -1, repeat: true },  // 上
      { dx: 0, dy: 1, repeat: true },   // 下
      { dx: -1, dy: 0, repeat: true },  // 左
      { dx: 1, dy: 0, repeat: true },   // 右
      // 追加で斜め1マス
      { dx: -1, dy: -1, repeat: false }, // 左上
      { dx: 1, dy: -1, repeat: false },  // 右上
      { dx: -1, dy: 1, repeat: false },  // 左下
      { dx: 1, dy: 1, repeat: false },   // 右下
    ];
  }
}