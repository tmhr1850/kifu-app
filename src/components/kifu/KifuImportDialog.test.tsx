import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KifuImportDialog from './KifuImportDialog';
import { importMultipleKifuFiles } from '@/utils/shogi/fileImporter';

jest.mock('@/utils/shogi/fileImporter', () => ({
  importMultipleKifuFiles: jest.fn(),
  validateKifuFiles: jest.fn((files) => ({
    valid: files,
    invalid: []
  }))
}));

describe('KifuImportDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(
      <KifuImportDialog
        isOpen={false}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );

    expect(screen.queryByText('棋譜をインポート')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <KifuImportDialog
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );

    expect(screen.getByText('棋譜をインポート')).toBeInTheDocument();
    expect(screen.getByText('対応形式: KIF, KI2, CSA (最大10MB)')).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const mockFile = new File(['test content'], 'test.kif', { type: 'text/plain' });
    const mockImportResult = {
      success: true,
      fileName: 'test.kif',
      record: {
        id: 'test-id',
        gameInfo: { sente: 'Player1', gote: 'Player2', date: '2024/01/01', startTime: '10:00' },
        moves: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    };

    (importMultipleKifuFiles as jest.Mock).mockResolvedValue([mockImportResult]);

    render(
      <KifuImportDialog
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(importMultipleKifuFiles).toHaveBeenCalledWith([mockFile]);
      expect(mockOnImport).toHaveBeenCalledWith([mockImportResult.record]);
    });
  });

  it('should handle drag and drop', async () => {
    render(
      <KifuImportDialog
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );

    const dropZone = screen.getByText('ファイルをドラッグ&ドロップ、または').parentElement!;

    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('border-blue-500');

    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('border-blue-500');
  });

  it('should close dialog when close button is clicked', () => {
    render(
      <KifuImportDialog
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );

    fireEvent.click(screen.getByText('閉じる'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});