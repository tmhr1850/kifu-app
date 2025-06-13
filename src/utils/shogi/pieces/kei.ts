import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 桂馬の移動ルール
export class KeiMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: -1, dy: this.adjustDirection(2), repeat: false }, // 左前
      { dx: 1, dy: this.adjustDirection(2), repeat: false },  // 右前
    ];
  }
}