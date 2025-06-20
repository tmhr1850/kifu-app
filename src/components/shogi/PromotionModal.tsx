'use client';

import React, { useEffect, useRef } from 'react';

interface PromotionModalProps {
  isOpen: boolean;
  onPromote: () => void;
  onCancel: () => void;
  pieceName: string;
  canCancel: boolean; // 成らないを選択できるか（強制成りでない場合）
}

function PromotionModal({
  isOpen,
  onPromote,
  onCancel,
  pieceName,
  canCancel
}: PromotionModalProps) {
  const promoteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // フォーカスを最初のボタンに設定
      if (canCancel && cancelButtonRef.current) {
        cancelButtonRef.current.focus();
      } else if (promoteButtonRef.current) {
        promoteButtonRef.current.focus();
      }

      // Escキーでモーダルを閉じる
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && canCancel) {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, canCancel, onCancel]);

  // フォーカストラップの実装
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not([disabled])'
      ) as NodeListOf<HTMLElement>;

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-title"
    >
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h2 
          id="promotion-title"
          className="text-xl font-bold text-center mb-4"
        >
          {canCancel ? '成りますか？' : '成らなければなりません'}
        </h2>
        
        <p className="text-center mb-6 text-gray-700">
          {pieceName}
        </p>

        <div className="flex gap-3 justify-center">
          {canCancel && (
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="px-4 sm:px-6 py-3 text-sm sm:text-base bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 touch-manipulation"
              aria-label="成らない"
            >
              成らない
            </button>
          )}
          <button
            ref={promoteButtonRef}
            onClick={onPromote}
            className="px-4 sm:px-6 py-3 text-sm sm:text-base bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 touch-manipulation"
            aria-label="成る"
            autoFocus={!canCancel}
          >
            成る
          </button>
        </div>
      </div>
    </div>
  );
}

export { PromotionModal };
export default PromotionModal;