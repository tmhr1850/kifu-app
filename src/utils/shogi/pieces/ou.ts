import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 王将（玉将）の移動ルール
export class OuMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: 0, dy: -1, repeat: false },  // 上
      { dx: 1, dy: -1, repeat: false },  // 右上
      { dx: 1, dy: 0, repeat: false },   // 右
      { dx: 1, dy: 1, repeat: false },   // 右下
      { dx: 0, dy: 1, repeat: false },   // 下
      { dx: -1, dy: 1, repeat: false },  // 左下
      { dx: -1, dy: 0, repeat: false },  // 左
      { dx: -1, dy: -1, repeat: false }, // 左上
    ];
  }
}