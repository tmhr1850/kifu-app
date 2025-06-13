import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 銀将の移動ルール
export class GinMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: 0, dy: this.adjustDirection(1), repeat: false },   // 前
      { dx: -1, dy: this.adjustDirection(1), repeat: false },  // 左前
      { dx: 1, dy: this.adjustDirection(1), repeat: false },   // 右前
      { dx: -1, dy: this.adjustDirection(-1), repeat: false }, // 左後ろ
      { dx: 1, dy: this.adjustDirection(-1), repeat: false },  // 右後ろ
    ];
  }
}