'use client';

import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmButtonClass = 'bg-red-600 text-white hover:bg-red-700'
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // フォーカスをキャンセルボタンに設定
      cancelButtonRef.current?.focus();
      
      // Escapeキーのハンドラー
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      
      // フォーカストラップ
      const handleFocusTrap = (e: FocusEvent) => {
        if (!dialogRef.current?.contains(e.target as Node)) {
          cancelButtonRef.current?.focus();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('focus', handleFocusTrap, true);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('focus', handleFocusTrap, true);
      };
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div ref={dialogRef} className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <h3 id="confirm-dialog-title" className="text-lg font-semibold mb-4">{title}</h3>
        <p id="confirm-dialog-message" className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-4">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${confirmButtonClass}`}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};