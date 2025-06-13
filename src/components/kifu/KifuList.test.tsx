import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KifuList } from './KifuList';
import * as storageService from '@/utils/shogi/storageService';

jest.mock('@/utils/shogi/storageService');

describe('KifuList', () => {
  const mockKifuList = [
    {
      id: 'kifu-1',
      gameInfo: {
        date: '2024/01/15',
        startTime: '10:00:00',
        sente: 'Tanaka',
        gote: 'Suzuki',
        result: 'sente_win' as const
      },
      moveCount: 85,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T11:30:00Z'
    },
    {
      id: 'kifu-2',
      gameInfo: {
        date: '2024/01/16',
        startTime: '14:00:00',
        sente: 'Yamada',
        gote: 'Sato'
      },
      moveCount: 120,
      createdAt: '2024-01-16T14:00:00Z',
      updatedAt: '2024-01-16T16:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.listKifuRecords as jest.Mock).mockReturnValue(mockKifuList);
  });

  it('renders kifu list correctly', async () => {
    const onSelect = jest.fn();
    render(<KifuList onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Tanaka vs Suzuki')).toBeInTheDocument();
      expect(screen.getByText('Yamada vs Sato')).toBeInTheDocument();
    });

    expect(screen.getByText('85手')).toBeInTheDocument();
    expect(screen.getByText('120手')).toBeInTheDocument();
    expect(screen.getByText('先手勝ち')).toBeInTheDocument();
  });

  it('shows empty state when no kifu records', async () => {
    (storageService.listKifuRecords as jest.Mock).mockReturnValue([]);
    
    const onSelect = jest.fn();
    render(<KifuList onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('保存された棋譜がありません')).toBeInTheDocument();
    });
  });

  it('calls onSelect when kifu is clicked', async () => {
    const onSelect = jest.fn();
    render(<KifuList onSelect={onSelect} />);

    await waitFor(() => {
      const kifuItem = screen.getByText('Tanaka vs Suzuki').closest('div[class*="hover:bg-gray-50"]');
      expect(kifuItem).toBeInTheDocument();
      fireEvent.click(kifuItem!);
    });

    expect(onSelect).toHaveBeenCalledWith('kifu-1');
  });

  it('highlights selected kifu', async () => {
    const onSelect = jest.fn();
    render(<KifuList onSelect={onSelect} selectedId="kifu-2" />);

    await waitFor(() => {
      const selectedItem = screen.getByText('Yamada vs Sato').closest('div[class*="hover:bg-gray-50"]');
      expect(selectedItem).toHaveClass('bg-blue-50');
    });
  });

  it('handles delete with confirmation', async () => {
    const onSelect = jest.fn();
    const onDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(true);
    (storageService.deleteKifuRecord as jest.Mock).mockReturnValue(true);

    render(<KifuList onSelect={onSelect} onDelete={onDelete} />);

    await waitFor(() => {
      const deleteButton = screen.getAllByText('削除')[0];
      fireEvent.click(deleteButton);
    });

    expect(window.confirm).toHaveBeenCalledWith('この棋譜を削除しますか？');
    expect(storageService.deleteKifuRecord).toHaveBeenCalledWith('kifu-1');
    expect(onDelete).toHaveBeenCalledWith('kifu-1');
  });

  it('cancels delete when not confirmed', async () => {
    const onSelect = jest.fn();
    const onDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(false);

    render(<KifuList onSelect={onSelect} onDelete={onDelete} />);

    await waitFor(() => {
      const deleteButton = screen.getAllByText('削除')[0];
      fireEvent.click(deleteButton);
    });

    expect(storageService.deleteKifuRecord).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});