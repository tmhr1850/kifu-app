'use client';

import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ message, politeness = 'polite' }) => {
  const messageRef = useRef<string>('');

  useEffect(() => {
    // Only announce if message has actually changed
    if (message && message !== messageRef.current) {
      messageRef.current = message;
    }
  }, [message]);

  return (
    <div 
      className="sr-only" 
      aria-live={politeness} 
      aria-atomic="true"
      role="status"
    >
      {message}
    </div>
  );
};