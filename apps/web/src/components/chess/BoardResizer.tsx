'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';

interface BoardResizerProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  storageKey?: string;
}

export function BoardResizer({
  children,
  minScale = 0.5,
  maxScale = 1.5,
  storageKey = 'chess-board-zoom',
}: BoardResizerProps) {
  const [scale, setScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; scale: number } | null>(null);

  // Load persisted zoom preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedScale = parseFloat(stored);
        if (!isNaN(parsedScale) && parsedScale >= minScale && parsedScale <= maxScale) {
          setScale(parsedScale);
        }
      }
    } catch (error) {
      console.error('Failed to load board zoom preference:', error);
    }
  }, [storageKey, minScale, maxScale]);

  // Save zoom preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, scale.toString());
    } catch (error) {
      console.error('Failed to save board zoom preference:', error);
    }
  }, [scale, storageKey]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scale: scale,
    };
  }, [scale]);

  // Handle drag move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    // Calculate distance moved (primarily use horizontal movement)
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Use diagonal distance for scaling (positive = larger, negative = smaller)
    const distance = (deltaX - deltaY) / 2;

    // Calculate new scale (1 pixel = 0.003 scale units)
    const scaleDelta = distance * 0.003;
    const newScale = Math.max(minScale, Math.min(maxScale, dragStartRef.current.scale + scaleDelta));

    setScale(newScale);
  }, [isDragging, minScale, maxScale]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Set up global mouse event listeners during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Scaled board container */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        className={`absolute -bottom-1 -right-1 w-6 h-6 cursor-nwse-resize z-10 ${
          isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        } transition-opacity`}
        onMouseDown={handleMouseDown}
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(249, 115, 22, 0.8) 40%, rgba(249, 115, 22, 0.8) 60%, transparent 60%)',
        }}
      >
        {/* Visual indicator lines */}
        <div className="absolute bottom-0 right-0 w-full h-full pointer-events-none">
          <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-80">
            <line x1="20" y1="4" x2="4" y2="20" stroke="rgba(249, 115, 22, 1)" strokeWidth="2" />
            <line x1="24" y1="8" x2="8" y2="24" stroke="rgba(249, 115, 22, 1)" strokeWidth="2" />
            <line x1="16" y1="0" x2="0" y2="16" stroke="rgba(249, 115, 22, 1)" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Scale indicator - shows current zoom percentage */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}
