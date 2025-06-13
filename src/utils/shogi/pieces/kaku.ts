import { MovePattern } from '@/types/shogi';
import { PieceMovement } from './base';

// 角行の移動ルール
export class KakuMovement extends PieceMovement {
  getMovePatterns(): MovePattern[] {
    return [
      { dx: -1, dy: -1, repeat: true }, // 左上
      { dx: 1, dy: -1, repeat: true },  // 右上
      { dx: -1, dy: 1, repeat: true },  // 左下
      { dx: 1, dy: 1, repeat: true },   // 右下
    ];
  }
}