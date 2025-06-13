import { Board, Position, Player, ValidMoves, MovePattern } from '@/types/shogi';
import { isValidPosition, getPieceAt } from '../board';

// 駒の移動ルールの基底クラス
export abstract class PieceMovement {
  protected board: Board;
  protected position: Position;
  protected player: Player;

  constructor(board: Board, position: Position, player: Player) {
    this.board = board;
    this.position = position;
    this.player = player;
  }

  // 各駒の移動パターンを定義
  abstract getMovePatterns(): MovePattern[];

  // 移動可能な位置を取得
  getValidMoves(): ValidMoves {
    const validMoves: ValidMoves = [];
    const patterns = this.getMovePatterns();

    for (const pattern of patterns) {
      if (pattern.repeat) {
        // 何マスでも移動可能な駒（飛車・角など）
        this.addRepeatMoves(validMoves, pattern.dx, pattern.dy);
      } else {
        // 1マスだけ移動する駒
        this.addSingleMove(validMoves, pattern.dx, pattern.dy);
      }
    }

    return validMoves;
  }

  // 1マスの移動を追加
  protected addSingleMove(validMoves: ValidMoves, dx: number, dy: number): void {
    const newPos: Position = {
      row: this.position.row + dy,
      col: this.position.col + dx,
    };

    if (this.canMoveTo(newPos)) {
      validMoves.push(newPos);
    }
  }

  // 連続移動を追加（飛車・角など）
  protected addRepeatMoves(validMoves: ValidMoves, dx: number, dy: number): void {
    const currentPos = { ...this.position };

    while (true) {
      currentPos.row += dy;
      currentPos.col += dx;

      if (!isValidPosition(currentPos)) break;

      const piece = getPieceAt(this.board, currentPos);
      
      if (piece === null) {
        // 空きマスなら移動可能
        validMoves.push({ ...currentPos });
      } else if (piece.player !== this.player) {
        // 相手の駒なら取れる
        validMoves.push({ ...currentPos });
        break;
      } else {
        // 自分の駒があるので進めない
        break;
      }
    }
  }

  // その位置に移動可能かチェック
  protected canMoveTo(pos: Position): boolean {
    if (!isValidPosition(pos)) return false;

    const piece = getPieceAt(this.board, pos);
    
    // 空きマスか相手の駒なら移動可能
    return piece === null || piece.player !== this.player;
  }

  // プレイヤーに応じて移動方向を調整（先手と後手で上下が逆）
  protected adjustDirection(dy: number): number {
    return this.player === Player.SENTE ? -dy : dy;
  }
}