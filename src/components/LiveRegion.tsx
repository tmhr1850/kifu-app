'use client';

import React, { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  mode?: 'polite' | 'assertive';
  clearAfter?: number; // ミリ秒後にクリア
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  mode = 'polite',
  clearAfter = 5000
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
};