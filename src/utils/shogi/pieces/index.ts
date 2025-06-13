import { Board, Position, Player, PieceType, ValidMoves } from '@/types/shogi';
import { PieceMovement } from './base';
import { FuMovement } from './fu';
import { KyoMovement } from './kyo';
import { KeiMovement } from './kei';
import { GinMovement } from './gin';
import { KinMovement } from './kin';
import { KakuMovement } from './kaku';
import { HiMovement } from './hi';
import { OuMovement } from './ou';
import {
  ToMovement,
  NkyoMovement,
  NkeiMovement,
  NginMovement,
  UmaMovement,
  RyuMovement
} from './promoted';

// 駒の種類に応じた移動クラスを返すファクトリ
export function createPieceMovement(
  pieceType: PieceType,
  board: Board,
  position: Position,
  player: Player
): PieceMovement {
  switch (pieceType) {
    case PieceType.FU:
      return new FuMovement(board, position, player);
    case PieceType.KYO:
      return new KyoMovement(board, position, player);
    case PieceType.KEI:
      return new KeiMovement(board, position, player);
    case PieceType.GIN:
      return new GinMovement(board, position, player);
    case PieceType.KIN:
      return new KinMovement(board, position, player);
    case PieceType.KAKU:
      return new KakuMovement(board, position, player);
    case PieceType.HI:
      return new HiMovement(board, position, player);
    case PieceType.OU:
      return new OuMovement(board, position, player);
    case PieceType.TO:
      return new ToMovement(board, position, player);
    case PieceType.NKYO:
      return new NkyoMovement(board, position, player);
    case PieceType.NKEI:
      return new NkeiMovement(board, position, player);
    case PieceType.NGIN:
      return new NginMovement(board, position, player);
    case PieceType.UMA:
      return new UmaMovement(board, position, player);
    case PieceType.RYU:
      return new RyuMovement(board, position, player);
    default:
      throw new Error(`Unknown piece type: ${pieceType}`);
  }
}

// 駒の移動可能な位置を取得
export function getPieceValidMoves(
  pieceType: PieceType,
  board: Board,
  position: Position,
  player: Player
): ValidMoves {
  const movement = createPieceMovement(pieceType, board, position, player);
  return movement.getValidMoves();
}