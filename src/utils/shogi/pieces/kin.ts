import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 金将の移動ルール
export class KinMovement extends PieceMovement {
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