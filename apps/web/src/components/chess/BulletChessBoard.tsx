'use client';

import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
type Square = string;

type Color = 'white' | 'black';

interface GameState {
  id: string;
  color: Color;
  opponent: {
    handle: string;
    rating: number;
    rd: number;
  };
  moves: string[];
  timeLeft: {
    w: number;
    b: number;
  };
  increment: number;
  toMove: Color;
  drawOffer?: Color;
  result?: string;
  ended: boolean;
}

interface BulletChessBoardProps {
  game: GameState;
  onMove: (gameId: string, move: string, moveTime?: number) => void;
}

export function BulletChessBoard({ game, onMove }: BulletChessBoardProps) {
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(chess.fen());

  const isMyTurn = game.toMove === game.color;

  // Apply moves from game to chess instance
  useEffect(() => {
    // Reset chess to starting position
    chess.reset();

    // Apply all moves
    for (const moveUci of game.moves) {
      try {
        chess.move({
          from: moveUci.slice(0, 2),
          to: moveUci.slice(2, 4),
          promotion: moveUci.length > 4 ? moveUci[4] : undefined
        } as any);
      } catch (e) {
        console.warn('Invalid move:', moveUci, e);
      }
    }

    setPosition(chess.fen());
  }, [game.moves, chess]);

  // Validate square coordinates
  const isValidSquare = (square: Square): boolean => {
    return /^[a-h][1-8]$/.test(square);
  };

  // Handle piece drop
  const handleDrop = ({ piece, sourceSquare, targetSquare }: any): boolean => {
    // Validate square coordinates
    if (!isValidSquare(sourceSquare) || !isValidSquare(targetSquare)) {
      return false;
    }
    // Only allow moves on player's turn
    if (!isMyTurn) return false;

    try {
      // Check if it's a pawn promotion
      const isPawnPromotion =
        piece[1].toLowerCase() === 'p' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
         (piece[0] === 'b' && targetSquare[1] === '1'));

      const moveResult = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPawnPromotion ? 'q' : undefined // Auto-queen for now
      } as any);

      if (moveResult) {
        const moveUci = sourceSquare + targetSquare + (moveResult.promotion || '');
        setPosition(chess.fen());
        onMove(game.id, moveUci, Date.now());
        return true;
      }
    } catch (e) {
      console.warn('Invalid move attempt:', e);
    }

    return false;
  };

  const chessboardOptions = {
    position: position,
    onPieceDrop: handleDrop,
    boardOrientation: game.color,
    arePiecesDraggable: isMyTurn && !game.ended,
    customBoardStyle: {
      borderRadius: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    customDarkSquareStyle: { backgroundColor: '#b58863' },
    customLightSquareStyle: { backgroundColor: '#f0d9b5' },
  };

  return (
    <div className="relative">
      <Chessboard
        options={chessboardOptions}
      />
      <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-sm z-10">
        {chess.turn() === 'w' ? 'White' : 'Black'} to move
        {chess.inCheck() && ' - Check!'}
        {chess.isCheckmate() && ' - Checkmate!'}
        {chess.isDraw() && ' - Draw!'}
      </div>
    </div>
  );
}
