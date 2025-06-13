import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PromotionModal from './PromotionModal';

describe('PromotionModal', () => {
  const mockOnPromote = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when modal is closed', () => {
    it('should not render anything', () => {
      const { container } = render(
        <PromotionModal
          isOpen={false}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={true}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when modal is open with cancel option', () => {
    it('should render both buttons', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={true}
        />
      );

      expect(screen.getByText('成りますか？')).toBeInTheDocument();
      expect(screen.getByText('歩')).toBeInTheDocument();
      expect(screen.getByLabelText('成る')).toBeInTheDocument();
      expect(screen.getByLabelText('成らない')).toBeInTheDocument();
    });

    it('should call onPromote when promote button is clicked', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={true}
        />
      );

      fireEvent.click(screen.getByLabelText('成る'));
      expect(mockOnPromote).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={true}
        />
      );

      fireEvent.click(screen.getByLabelText('成らない'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnPromote).not.toHaveBeenCalled();
    });

    it('should focus on cancel button by default', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={true}
        />
      );

      expect(document.activeElement).toBe(screen.getByLabelText('成らない'));
    });
  });

  describe('when modal is open without cancel option (forced promotion)', () => {
    it('should only render promote button', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={false}
        />
      );

      expect(screen.getByText('成らなければなりません')).toBeInTheDocument();
      expect(screen.getByText('歩')).toBeInTheDocument();
      expect(screen.getByLabelText('成る')).toBeInTheDocument();
      expect(screen.queryByLabelText('成らない')).not.toBeInTheDocument();
    });

    it('should focus on promote button', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={false}
        />
      );

      expect(document.activeElement).toBe(screen.getByLabelText('成る'));
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <PromotionModal
          isOpen={true}
          onPromote={mockOnPromote}
          onCancel={mockOnCancel}
          pieceName="歩"
          canCancel={true}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'promotion-title');
    });
  });
});