import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KifuCard } from './KifuCard';
import { KifuMetadata } from '@/types/kifu';

jest.mock('@/utils/shogi/storageService', () => ({
  loadKifuRecord: jest.fn()
}));

describe('KifuCard', () => {
  const mockKifu: KifuMetadata = {
    id: 'test-id',
    gameInfo: {
      sente: 'テスト先手',
      gote: 'テスト後手',
      date: '2024-01-01',
      startTime: '10:00',
      result: 'sente_win'
    },
    moveCount: 50,
    savedAt: new Date().toISOString()
  };

  const mockOnSelect = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対局情報が正しく表示される', () => {
    render(
      <KifuCard
        kifu={mockKifu}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('テスト先手 vs テスト後手')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01 10:00')).toBeInTheDocument();
    expect(screen.getByText('50手')).toBeInTheDocument();
    expect(screen.getByText('先手勝ち')).toBeInTheDocument();
  });

  it('カードクリック時にonSelectが呼ばれる', () => {
    render(
      <KifuCard
        kifu={mockKifu}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    const card = screen.getByText('テスト先手 vs テスト後手').closest('div.bg-white');
    fireEvent.click(card!);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('削除ボタンクリック時にonDeleteが呼ばれる', () => {
    render(
      <KifuCard
        kifu={mockKifu}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('削除');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('選択状態の時にスタイルが適用される', () => {
    render(
      <KifuCard
        kifu={mockKifu}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
        isSelected={true}
      />
    );

    const card = screen.getByText('テスト先手 vs テスト後手').closest('div.bg-white');
    expect(card).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('結果が表示されない場合でも正常に動作する', () => {
    const kifuWithoutResult = {
      ...mockKifu,
      gameInfo: {
        ...mockKifu.gameInfo,
        result: undefined
      }
    };

    render(
      <KifuCard
        kifu={kifuWithoutResult}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('50手')).toBeInTheDocument();
    expect(screen.queryByText('先手勝ち')).not.toBeInTheDocument();
  });
});