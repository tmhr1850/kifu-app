'use client';

import React from 'react';

export default function ShogiBoard() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">将棋盤</h2>
      <div className="bg-amber-100 p-4 border-2 border-amber-800 rounded">
        <div className="grid grid-cols-9 gap-1 w-96 h-96">
          {Array.from({ length: 81 }, (_, i) => (
            <div
              key={i}
              className="bg-amber-50 border border-amber-800 aspect-square flex items-center justify-center text-xs"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}