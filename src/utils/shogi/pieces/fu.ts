import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 歩兵の移動ルール
export class FuMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: 0, dy: this.adjustDirection(1), repeat: false }, // 前に1マス
    ];
  }
}