import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 飛車の移動ルール
export class HiMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: 0, dy: -1, repeat: true },  // 上
      { dx: 0, dy: 1, repeat: true },   // 下
      { dx: -1, dy: 0, repeat: true },  // 左
      { dx: 1, dy: 0, repeat: true },   // 右
    ];
  }
}