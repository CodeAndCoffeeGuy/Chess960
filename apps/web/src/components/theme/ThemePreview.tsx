'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPieceImagePath } from '@/lib/board-themes';

interface ThemePreviewProps {
  className?: string;
}

export function ThemePreview({ className = '' }: ThemePreviewProps) {
  const { boardTheme, pieceSet } = useTheme();

  // Sample chess position for preview
  const samplePosition = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#c1b9ad] light:text-[#5a5449] mb-2">
          Theme Preview
        </h3>
        <p className="text-sm text-[#a0958a] light:text-[#8a7f6f]">
          {boardTheme.name} board • {pieceSet.name} pieces
        </p>
      </div>

      {/* Chess Board Preview */}
      <div className="flex justify-center">
        <div 
          className="grid grid-cols-8 gap-0 border-2 border-[#3a372f] rounded-lg overflow-hidden shadow-lg"
          style={{ width: '320px', height: '320px' }}
        >
          {samplePosition.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const squareColor = isLight ? boardTheme.light : boardTheme.dark;
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative flex items-center justify-center"
                  style={{
                    backgroundColor: squareColor,
                    width: '40px',
                    height: '40px'
                  }}
                >
                  {piece && (
                    <img
                      src={getPieceImagePath(piece, pieceSet.id)}
                      alt={piece}
                      className="w-8 h-8"
                      style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}
                    />
                  )}
                  
                  {/* Coordinates */}
                  {(rowIndex === 7 || colIndex === 0) && (
                    <div 
                      className="absolute text-xs font-bold pointer-events-none"
                      style={{
                        color: isLight ? boardTheme.coordinates?.light : boardTheme.coordinates?.dark,
                        fontSize: '8px',
                        ...(rowIndex === 7 ? { bottom: '2px', right: '2px' } : { top: '2px', left: '2px' })
                      }}
                    >
                      {rowIndex === 7 ? String.fromCharCode(97 + colIndex) : 8 - rowIndex}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Theme Info */}
      <div className="bg-[#2a2720] light:bg-[#f5f1ea] rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[#c1b9ad] light:text-[#5a5449] font-medium mb-1">Board Colors</div>
            <div className="flex space-x-2">
              <div 
                className="w-6 h-6 rounded border border-[#474239] light:border-[#d4caba]"
                style={{ backgroundColor: boardTheme.light }}
                title="Light squares"
              ></div>
              <div 
                className="w-6 h-6 rounded border border-[#474239] light:border-[#d4caba]"
                style={{ backgroundColor: boardTheme.dark }}
                title="Dark squares"
              ></div>
            </div>
          </div>
          
          <div>
            <div className="text-[#c1b9ad] light:text-[#5a5449] font-medium mb-1">Piece Set</div>
            <div className="flex space-x-1">
              <img
                src={getPieceImagePath('wK', pieceSet.id)}
                alt="White King"
                className="w-4 h-4"
              />
              <img
                src={getPieceImagePath('bK', pieceSet.id)}
                alt="Black King"
                className="w-4 h-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
