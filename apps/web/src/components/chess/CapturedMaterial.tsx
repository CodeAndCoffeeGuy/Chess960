'use client';

import { useMemo } from 'react';
import { Chess } from 'chess.js';

interface CapturedMaterialProps {
  moves: string[];
  playerColor: 'white' | 'black';
  position: 'top' | 'bottom';
}

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_SYMBOLS = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
};

export function CapturedMaterial({ moves, playerColor, position }: CapturedMaterialProps) {
  const { capturedByWhite, capturedByBlack, materialAdvantage } = useMemo(() => {
    const chess = new Chess();
    const capturedWhite: Array<{ type: string; color: string }> = [];
    const capturedBlack: Array<{ type: string; color: string }> = [];

    // Play through all moves to track captures
    for (const move of moves) {
      try {
        const result = chess.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move.length > 4 ? move[4] : undefined,
        });

        // If a piece was captured, record it
        if (result && result.captured) {
          const capturedPiece = {
            type: result.captured,
            color: result.color === 'w' ? 'b' : 'w', // Opposite color of the mover
          };

          if (result.color === 'w') {
            capturedWhite.push(capturedPiece);
          } else {
            capturedBlack.push(capturedPiece);
          }
        }
      } catch (error) {
        console.error('Error processing move for captured material:', move, error);
        break;
      }
    }

    // Calculate material values
    const whiteValue = capturedWhite.reduce(
      (sum, piece) => sum + PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES],
      0
    );
    const blackValue = capturedBlack.reduce(
      (sum, piece) => sum + PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES],
      0
    );

    const advantage = whiteValue - blackValue;

    return {
      capturedByWhite: capturedWhite,
      capturedByBlack: capturedBlack,
      materialAdvantage: advantage,
    };
  }, [moves]);

  // Determine which pieces to show based on position
  const isOpponentTop = position === 'top';
  const showingColor = isOpponentTop
    ? playerColor === 'white'
      ? 'black'
      : 'white'
    : playerColor;

  const capturedPieces =
    showingColor === 'white' ? capturedByWhite : capturedByBlack;

  // Calculate advantage for this side
  const advantage =
    showingColor === 'white' ? materialAdvantage : -materialAdvantage;

  // Sort pieces by value (descending)
  const sortedPieces = [...capturedPieces].sort((a, b) => {
    const valueA = PIECE_VALUES[a.type as keyof typeof PIECE_VALUES];
    const valueB = PIECE_VALUES[b.type as keyof typeof PIECE_VALUES];
    return valueB - valueA;
  });

  if (sortedPieces.length === 0 && advantage <= 0) {
    return null; // Don't show if no pieces captured and no advantage
  }

  return (
    <div className="flex items-center gap-1 text-sm min-h-[20px]">
      {/* Captured pieces */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {sortedPieces.map((piece, index) => (
          <span
            key={index}
            className={`inline-block ${
              piece.color === 'white'
                ? 'text-white'
                : 'text-gray-800'
            }`}
            style={{
              fontSize: '16px',
              lineHeight: '16px',
              textShadow:
                piece.color === 'white'
                  ? '0 0 2px rgba(0,0,0,0.8)'
                  : '0 0 2px rgba(255,255,255,0.8)',
            }}
          >
            {PIECE_SYMBOLS[piece.type as keyof typeof PIECE_SYMBOLS]}
          </span>
        ))}
      </div>

      {/* Material advantage indicator */}
      {advantage > 0 && (
        <span className="text-xs font-bold text-green-400 ml-1">
          +{advantage}
        </span>
      )}
    </div>
  );
}
