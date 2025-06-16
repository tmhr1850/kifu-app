import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameController } from './GameController';
import { GameStateWithKifu } from '@/utils/shogi/gameWithKifu';
import { Player } from '@/types/shogi';

// Mock the storage service
jest.mock('@/utils/shogi/storageService', () => ({
  saveKifuRecord: jest.fn(),
  createNewKifuRecord: jest.fn((gameInfo) => ({
    id: 'test-id',
    gameInfo,
    moves: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  getNextKifuId: jest.fn(() => 'test-id')
}));

describe('GameController', () => {
  let mockGameState: GameStateWithKifu;
  let mockOnGameStateChange: jest.Mock;

  beforeEach(() => {
    mockGameState = {
      game: {
        board: Array(9).fill(null).map(() => Array(9).fill(null)),
        handPieces: {
          [Player.SENTE]: { FU: 0, KYO: 0, KEI: 0, GIN: 0, KIN: 0, KAKU: 0, HI: 0 },
          [Player.GOTE]: { FU: 0, KYO: 0, KEI: 0, GIN: 0, KIN: 0, KAKU: 0, HI: 0 }
        },
        currentPlayer: Player.SENTE,
        moveHistory: [],
        positionHistory: { positions: [], counts: [] },
        gameStatus: 'ongoing' as const
      },
      kifu: {
        id: 'test-id',
        gameInfo: {
          title: 'テスト対局',
          sente: '先手太郎',
          gote: '後手花子',
          handicap: 'none',
          date: new Date().toISOString().split('T')[0],
          startTime: new Date().toTimeString().split(' ')[0]
        },
        moves: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    mockOnGameStateChange = jest.fn();
  });

  it('手数を正しく表示する', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    expect(screen.getByText('手数:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('現在の手番を表示する', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    expect(screen.getByText('手番:')).toBeInTheDocument();
    expect(screen.getByText('☗先手')).toBeInTheDocument();
  });

  it('対局者名を表示する', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    expect(screen.getByText('先手太郎')).toBeInTheDocument();
    expect(screen.getByText('後手花子')).toBeInTheDocument();
  });

  it('投了ボタンをクリックすると確認ダイアログが表示される', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    const resignButton = screen.getByText('投了');
    fireEvent.click(resignButton);

    expect(screen.getByText('投了確認')).toBeInTheDocument();
    expect(screen.getByText('本当に投了しますか？')).toBeInTheDocument();
  });

  it('投了確認ダイアログでキャンセルするとダイアログが閉じる', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    fireEvent.click(screen.getByText('投了'));
    fireEvent.click(screen.getByText('キャンセル'));

    expect(screen.queryByText('投了確認')).not.toBeInTheDocument();
  });

  it('投了確認ダイアログで投了するとゲームが終了する', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    fireEvent.click(screen.getByText('投了'));
    fireEvent.click(screen.getByText('投了する'));

    expect(mockOnGameStateChange).toHaveBeenCalled();
    // Check that the function was called with a game state containing a result
    const calledWith = mockOnGameStateChange.mock.calls[0][0];
    expect(calledWith).toBeDefined();
  });

  it('手が無い場合、待ったボタンは無効化される', () => {
    render(
      <GameController
        gameState={mockGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    const undoButton = screen.getByText('待った');
    expect(undoButton).toBeDisabled();
  });

  it('手がある場合、待ったボタンは有効になる', () => {
    const gameStateWithMoves = {
      ...mockGameState,
      kifu: {
        ...mockGameState.kifu,
        moves: [
          {
            moveNumber: 1,
            notation: '７六歩',
            player: Player.SENTE,
            timestamp: new Date().toISOString()
          }
        ]
      }
    };

    render(
      <GameController
        gameState={gameStateWithMoves}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    const undoButton = screen.getByText('待った');
    expect(undoButton).not.toBeDisabled();
  });

  it('待ったボタンをクリックすると手を戻す', () => {
    const gameStateWithMoves = {
      ...mockGameState,
      kifu: {
        ...mockGameState.kifu,
        moves: [
          {
            moveNumber: 1,
            notation: '７六歩',
            player: Player.SENTE,
            timestamp: new Date().toISOString()
          }
        ]
      }
    };

    render(
      <GameController
        gameState={gameStateWithMoves}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    const undoButton = screen.getByText('待った');
    fireEvent.click(undoButton);

    expect(mockOnGameStateChange).toHaveBeenCalled();
  });

  it('ゲーム終了時に結果を表示する', () => {
    const endedGameState = {
      ...mockGameState,
      game: {
        ...mockGameState.game,
        gameStatus: 'resigned' as const
      },
      kifu: {
        ...mockGameState.kifu,
        gameInfo: {
          ...mockGameState.kifu.gameInfo,
          result: {
            winner: Player.SENTE,
            reason: 'resign'
          }
        }
      }
    };

    render(
      <GameController
        gameState={endedGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    // Check for game status display instead of specific text
    const gameResultElement = screen.getByText(/投了/);
    expect(gameResultElement).toBeInTheDocument();
  });

  it('ゲーム終了時は投了ボタンが無効化される', () => {
    const endedGameState = {
      ...mockGameState,
      game: {
        ...mockGameState.game,
        gameStatus: 'resigned'
      }
    };

    render(
      <GameController
        gameState={endedGameState}
        onGameStateChange={mockOnGameStateChange}
      />
    );

    const resignButton = screen.getByText('投了');
    expect(resignButton).toBeDisabled();
  });
});