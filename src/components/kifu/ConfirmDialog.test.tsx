import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('開いているときに表示される', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="テストタイトル"
        message="テストメッセージ"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
  });

  it('閉じているときは表示されない', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="テストタイトル"
        message="テストメッセージ"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('テストタイトル')).not.toBeInTheDocument();
  });

  it('確認ボタンクリック時にonConfirmが呼ばれる', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="テストタイトル"
        message="テストメッセージ"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmText="削除"
      />
    );

    fireEvent.click(screen.getByText('削除'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('キャンセルボタンクリック時にonCancelが呼ばれる', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="テストタイトル"
        message="テストメッセージ"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        cancelText="キャンセル"
      />
    );

    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('カスタムボタンテキストが表示される', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="テストタイトル"
        message="テストメッセージ"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmText="OK"
        cancelText="いいえ"
      />
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('いいえ')).toBeInTheDocument();
  });

  it('カスタムボタンクラスが適用される', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="テストタイトル"
        message="テストメッセージ"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmButtonClass="bg-green-600 text-white"
      />
    );

    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toHaveClass('bg-green-600', 'text-white');
  });
});