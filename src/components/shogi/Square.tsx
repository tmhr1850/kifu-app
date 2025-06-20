'use client';

import React from 'react';

export interface SquareProps {
  className?: string;
  children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = ({ className = '', children }) => {
  return (
    <div className={`border border-gray-400 bg-amber-50 h-12 w-12 flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
};