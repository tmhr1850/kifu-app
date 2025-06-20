import { createNewGame, makeMove, undoMove } from '../game';
import { Player, PieceType } from '@/types/shogi';

describe('undoMove', () => {
  it('should return null when there are no moves to undo', () => {
    const gameState = createNewGame();
    const result = undoMove(gameState);
    expect(result).toBeNull();
  });

  it('should undo a single move', () => {
    const gameState = createNewGame();
    
    // Make a move
    const move = {
      from: { row: 6, col: 4 },
      to: { row: 5, col: 4 },
      piece: { type: PieceType.FU, player: Player.SENTE },
      promote: false
    };
    
    const afterMove = makeMove(gameState, move);
    expect(afterMove).not.toBeNull();
    
    // Undo the move
    const afterUndo = undoMove(afterMove!);
    expect(afterUndo).not.toBeNull();
    
    // Check that the board is back to initial state
    expect(afterUndo!.board).toEqual(gameState.board);
    expect(afterUndo!.currentPlayer).toBe(Player.SENTE);
    expect(afterUndo!.moveHistory.length).toBe(0);
  });

  it('should undo multiple moves correctly', () => {
    const gameState = createNewGame();
    
    // Make first move (sente)
    const move1 = {
      from: { row: 6, col: 4 },
      to: { row: 5, col: 4 },
      piece: { type: PieceType.FU, player: Player.SENTE },
      promote: false
    };
    const afterMove1 = makeMove(gameState, move1);
    
    // Make second move (gote)
    const move2 = {
      from: { row: 2, col: 4 },
      to: { row: 3, col: 4 },
      piece: { type: PieceType.FU, player: Player.GOTE },
      promote: false
    };
    const afterMove2 = makeMove(afterMove1!, move2);
    
    // Undo second move
    const afterUndo1 = undoMove(afterMove2!);
    expect(afterUndo1).not.toBeNull();
    expect(afterUndo1!.currentPlayer).toBe(Player.GOTE);
    expect(afterUndo1!.moveHistory.length).toBe(1);
    
    // The board should match after first move
    expect(afterUndo1!.board).toEqual(afterMove1!.board);
    
    // Undo first move
    const afterUndo2 = undoMove(afterUndo1!);
    expect(afterUndo2).not.toBeNull();
    expect(afterUndo2!.currentPlayer).toBe(Player.SENTE);
    expect(afterUndo2!.moveHistory.length).toBe(0);
    expect(afterUndo2!.board).toEqual(gameState.board);
  });

  it('should properly restore captured pieces', () => {
    const gameState = createNewGame();
    
    // Set up a capture scenario
    // Place a gote pawn where sente can capture it
    gameState.board[5][4] = { type: PieceType.FU, player: Player.GOTE };
    
    // Make a capturing move (pawn moves straight forward)
    const captureMove = {
      from: { row: 6, col: 4 },
      to: { row: 5, col: 4 },
      piece: { type: PieceType.FU, player: Player.SENTE },
      promote: false
    };
    
    const afterCapture = makeMove(gameState, captureMove);
    expect(afterCapture).not.toBeNull();
    
    // Check that piece was captured
    expect(afterCapture!.handPieces[Player.SENTE].get(PieceType.FU) || 0).toBe(1);
    
    // Undo the capture
    const afterUndo = undoMove(afterCapture!);
    expect(afterUndo).not.toBeNull();
    
    // Check that captured piece is restored
    expect(afterUndo!.board[5][4]).toEqual({ type: PieceType.FU, player: Player.GOTE });
    expect(afterUndo!.handPieces[Player.SENTE].get(PieceType.FU) || 0).toBe(0);
  });

  it('should handle promotion correctly when undoing', () => {
    const gameState = createNewGame();
    
    // Use a silver instead of pawn to avoid nifu (double-pawn) rule
    // Move silver to just before promotion zone
    gameState.board[3][2] = { type: PieceType.GIN, player: Player.SENTE };
    gameState.board[8][2] = null; // Remove silver from original position
    gameState.board[2][3] = null; // Clear the destination square (remove GOTE pawn)
    
    const promoteMove = {
      from: { row: 3, col: 2 },
      to: { row: 2, col: 3 }, // Silver can move diagonally
      piece: { type: PieceType.GIN, player: Player.SENTE },
      promote: true
    };
    
    const afterPromotion = makeMove(gameState, promoteMove);
    expect(afterPromotion).not.toBeNull();
    expect(afterPromotion!.board[2][3]?.type).toBe(PieceType.NGIN);
    
    // Undo the promotion
    const afterUndo = undoMove(afterPromotion!);
    expect(afterUndo).not.toBeNull();
    
    // Check that the piece is back as unpromoted
    expect(afterUndo!.board[3][2]).toEqual({ type: PieceType.GIN, player: Player.SENTE });
    expect(afterUndo!.board[2][3]).toBeNull();
  });
});