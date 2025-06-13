import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 香車の移動ルール
export class KyoMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: 0, dy: this.adjustDirection(1), repeat: true }, // 前に何マスでも
    ];
  }
}