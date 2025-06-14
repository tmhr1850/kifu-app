import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameBoard } from './GameBoard';

// Mock the storage service to avoid localStorage issues in tests
jest.mock('@/utils/shogi/storageService', () => ({
  saveKifuRecord: jest.fn(),
  loadKifuRecord: jest.fn(),
  createNewKifuRecord: jest.fn((gameInfo) => ({
    id: 'test-id',
    gameInfo,
    moves: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  exportKifToText: jest.fn(),
  getNextKifuId: jest.fn(() => 'test-id')
}));

describe('GameBoard', () => {
  it('should render board and controller', () => {
    render(<GameBoard />);
    
    // Check that board is rendered
    expect(screen.getAllByText('歩')).toHaveLength(18); // 18 pawns on initial board
    
    // Check that controller is rendered
    expect(screen.getByText('手数:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Initial move count
    expect(screen.getByText('投了')).toBeInTheDocument();
    expect(screen.getByText('待った')).toBeInTheDocument();
  });

  it('should display player names', () => {
    render(<GameBoard />);
    
    expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
    expect(screen.getByText('プレイヤー2')).toBeInTheDocument();
  });

  it('should update move count when pieces are moved', async () => {
    render(<GameBoard />);
    
    // Initial move count
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Find and click a sente pawn
    const cells = document.querySelectorAll('.board-cell');
    const pawnCell = cells[60]; // A sente pawn position
    
    fireEvent.click(pawnCell);
    
    // Find a highlighted cell and click it
    const highlightedCells = Array.from(cells).filter(cell => 
      cell.classList.contains('bg-green-300')
    );
    
    if (highlightedCells[0]) {
      fireEvent.click(highlightedCells[0]);
      
      // Wait for move count to update
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    }
  });

  it('should enable undo button after making a move', async () => {
    render(<GameBoard />);
    
    const undoButton = screen.getByText('待った');
    
    // Initially disabled
    expect(undoButton).toBeDisabled();
    
    // Make a move
    const cells = document.querySelectorAll('.board-cell');
    const pawnCell = cells[60];
    
    fireEvent.click(pawnCell);
    
    const highlightedCells = Array.from(cells).filter(cell => 
      cell.classList.contains('bg-green-300')
    );
    
    if (highlightedCells[0]) {
      fireEvent.click(highlightedCells[0]);
      
      // Wait for undo button to be enabled
      await waitFor(() => {
        expect(undoButton).not.toBeDisabled();
      });
    }
  });

  it('should highlight last move on the board', async () => {
    render(<GameBoard />);
    
    // Make a move
    const cells = document.querySelectorAll('.board-cell');
    const pawnCell = cells[60];
    
    fireEvent.click(pawnCell);
    
    const highlightedCells = Array.from(cells).filter(cell => 
      cell.classList.contains('bg-green-300')
    );
    
    if (highlightedCells[0]) {
      fireEvent.click(highlightedCells[0]);
      
      // Wait for last move highlighting
      await waitFor(() => {
        const lastMoveHighlighted = Array.from(cells).filter(cell => 
          cell.classList.contains('ring-2') && cell.classList.contains('ring-blue-500')
        );
        expect(lastMoveHighlighted.length).toBe(2); // From and to squares
      });
    }
  });

  it('should show resign confirmation dialog', () => {
    render(<GameBoard />);
    
    const resignButton = screen.getByText('投了');
    fireEvent.click(resignButton);
    
    expect(screen.getByText('投了確認')).toBeInTheDocument();
    expect(screen.getByText('本当に投了しますか？')).toBeInTheDocument();
  });

  it('should cancel resignation', () => {
    render(<GameBoard />);
    
    const resignButton = screen.getByText('投了');
    fireEvent.click(resignButton);
    
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('投了確認')).not.toBeInTheDocument();
  });
});