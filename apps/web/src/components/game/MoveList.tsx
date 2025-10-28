'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

interface MoveListProps {
  moves: string[]; // UCI format moves
  currentMoveIndex?: number | null; // For highlighting current viewing position
  onMoveClick?: (index: number) => void;
  initialFen?: string;
}

interface ParsedMove {
  uci: string;
  san: string;
  moveNumber: number;
  isWhite: boolean;
}

export function MoveList({ moves, currentMoveIndex, onMoveClick, initialFen }: MoveListProps) {
  const [parsedMoves, setParsedMoves] = useState<ParsedMove[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chess = new Chess(initialFen);
    const parsed: ParsedMove[] = [];

    moves.forEach((uci, index) => {
      try {
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhite = index % 2 === 0;

        // Make the move to get SAN notation
        const move = chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length === 5 ? uci[4] : undefined,
        });

        if (move) {
          parsed.push({
            uci,
            san: move.san,
            moveNumber,
            isWhite,
          });
        }
      } catch (error) {
        console.error('Failed to parse move:', uci, error);
      }
    });

    setParsedMoves(parsed);
  }, [moves, initialFen]);

  // Auto-scroll to current move
  useEffect(() => {
    if (currentMoveIndex !== null && currentMoveIndex !== undefined && scrollRef.current) {
      const moveElement = scrollRef.current.querySelector(`[data-move-index="${currentMoveIndex}"]`);
      if (moveElement) {
        moveElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentMoveIndex]);

  if (parsedMoves.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#6b6460] text-sm">
        No moves yet
      </div>
    );
  }

  // Group moves by pairs (white + black)
  const movePairs: Array<{ white: ParsedMove; black?: ParsedMove; moveNumber: number }> = [];
  for (let i = 0; i < parsedMoves.length; i += 2) {
    movePairs.push({
      white: parsedMoves[i],
      black: parsedMoves[i + 1],
      moveNumber: parsedMoves[i].moveNumber,
    });
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overflow-x-hidden pr-2 space-y-1 text-sm font-mono"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#474239 #2a2723',
      }}
    >
      {movePairs.map((pair, pairIndex) => (
        <div key={pairIndex} className="flex items-center gap-2">
          {/* Move number */}
          <div className="text-[#6b6460] font-semibold min-w-[2.5rem] text-right">
            {pair.moveNumber}.
          </div>

          {/* White's move */}
          <button
            data-move-index={pairIndex * 2}
            onClick={() => onMoveClick?.(pairIndex * 2)}
            className={`flex-1 px-2 py-1 rounded text-left transition-colors ${
              currentMoveIndex === pairIndex * 2
                ? 'bg-orange-500 text-white font-semibold'
                : 'text-[#c1b9ad] hover:bg-[#35322e] hover:text-white'
            }`}
          >
            {pair.white.san}
          </button>

          {/* Black's move */}
          {pair.black ? (
            <button
              data-move-index={pairIndex * 2 + 1}
              onClick={() => onMoveClick?.(pairIndex * 2 + 1)}
              className={`flex-1 px-2 py-1 rounded text-left transition-colors ${
                currentMoveIndex === pairIndex * 2 + 1
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-[#c1b9ad] hover:bg-[#35322e] hover:text-white'
              }`}
            >
              {pair.black.san}
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      ))}
    </div>
  );
}
