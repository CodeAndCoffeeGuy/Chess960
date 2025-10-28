'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { ChessboardOptions } from 'react-chessboard';
import { useHaptic } from '@/hooks/useHaptic';
import { useChessSounds } from '@/hooks/useChessSounds';
import { useTheme } from '@/contexts/ThemeContext';
import { PromotionDialog } from './PromotionDialog';
type Square = string;
type Color = 'white' | 'black';

interface GameState {
  id: string;
  color: 'white' | 'black';
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
  toMove: 'white' | 'black';
  drawOffer?: 'white' | 'black';
  result?: string;
  ended: boolean;
  initialFen?: string; // Chess960 starting position FEN
  chess960Position?: number; // Position number (1-960)
}

interface ReactChessBoardProps {
  game: GameState;
  onMove: (gameId: string, move: string, moveTime?: number) => void;
  flipped?: boolean;
  onArrowsUpdate?: (count: number, clearFn: () => void) => void;
}

export function ReactChessBoard({ game, onMove, flipped = false, onArrowsUpdate }: ReactChessBoardProps) {
  // Defensive check: ensure game object is properly structured
  const [chess] = useState(() => new Chess(game?.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')); // Initialize with Chess960 FEN if provided
  const [gamePosition, setGamePosition] = useState(chess.fen());
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, any>>({});
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [premoves, setPremoves] = useState<Array<{from: Square, to: Square}>>([]);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [boardWidth, setBoardWidth] = useState(480);
  const { boardTheme } = useTheme();
  const [arrows, setArrows] = useState<Array<{ startSquare: string; endSquare: string; color: string }>>([]);
  const [lastMoveCount, setLastMoveCount] = useState(0);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square; isDuringGame: boolean } | null>(null);

  // Mobile haptic feedback
  const haptic = useHaptic();

  // Chess sounds
  const { playMoveSound } = useChessSounds({ enabled: true, volume: 0.4 });

  // Theme context handles all theme management

  // All remaining hooks must be declared before any early returns
  // Sync chess position with game moves
  useEffect(() => {
    if (!game || typeof game !== 'object') return;
    
    // Reset to Chess960 initial position if provided, otherwise standard
    if (game.initialFen) {
      chess.load(game.initialFen);
    } else {
      chess.reset();
    }
    console.log('Game moves:', game.moves, 'toMove:', game.toMove);

    // Defensive check: ensure moves is an array
    const moves = Array.isArray(game.moves) ? game.moves : [];

    try {
      let lastMoveSquares: [Square, Square] | null = null;
      moves.forEach((move: string) => {
        const result = chess.move(move);
        if (result) {
          lastMoveSquares = [result.from, result.to];
        }
      });

      setGamePosition(chess.fen());
      setLastMove(lastMoveSquares);
      setLastMoveCount(moves.length);
    } catch (error) {
      console.error('[Board] Error applying moves:', error);
    }
  }, [game.moves, game.initialFen, chess]);

  // Execute premove chain when opponent makes a move
  useEffect(() => {
    if (!game || typeof game !== 'object') return;
    
    const currentMoveCount = game.moves.length;

    if (currentMoveCount > lastMoveCount && premoves.length > 0) {
      console.log('[Board] Opponent moved, executing premove chain');
      const premove = premoves[0];
      setPremoves(prev => prev.slice(1));
      
      try {
        const result = chess.move(premove);
        if (result) {
              setGamePosition(chess.fen());
          setLastMove([result.from, result.to]);
          setLastMoveCount(currentMoveCount);
          onMove?.(game.id, result.san, Date.now());
        }
      } catch (error) {
        console.error('[Board] Error executing premove:', error);
        setPremoves([]);
      }
    }
  }, [game.moves, lastMoveCount, premoves, chess, onMove]);

  // Handle keyboard shortcuts for clearing arrows, highlights, and premoves
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setArrows([]);
        setRightClickedSquares({});
        setMoveSquares({});
        setOptionSquares({});
          setPremoves([]);
        setMoveFrom(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle responsive board sizing - MOBILE OPTIMIZED
  useEffect(() => {
    const updateBoardSize = () => {
      if (typeof window === 'undefined') return;

      const width = Math.min(window.innerWidth - 40, 480);
      setBoardWidth(width);
    };

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  // Clear arrows function
  const clearArrows = useCallback(() => {
    setArrows([]);
    setRightClickedSquares({});
  }, []);

  // Notify parent about arrow updates
  useEffect(() => {
    onArrowsUpdate?.(arrows.length, clearArrows);
  }, [arrows.length, onArrowsUpdate, clearArrows]);

  // Check if piece can be dragged - professional chess system
  const isDraggablePiece = useCallback(({ isSparePiece, piece, square }: { isSparePiece?: boolean; piece: string; square: string }) => {
    if (!game || typeof game !== 'object') return false;
    
    console.log('[Board] DRAG CHECK - canDragPiece called (v5 API):', {
      isSparePiece,
      piece,
      square,
      gameColor: game.color,
      toMove: game.toMove
    });

    if (isSparePiece) return false;

    const pieceColor = piece.charAt(0) === piece.charAt(0).toUpperCase() ? 'white' : 'black';
    const isPlayerTurn = pieceColor === game.toMove;
    const isPlayerPiece = pieceColor === game.color;

    console.log('[Board] DRAG CHECK result:', {
      pieceColor,
      isPlayerTurn,
      isPlayerPiece,
      canDrag: isPlayerTurn && isPlayerPiece
    });

    return isPlayerTurn && isPlayerPiece;
  }, [game.color, game.toMove]);

  // Combine all square styles with proper priorities
  const customSquareStyles = useMemo(() => {
    if (!game || typeof game !== 'object') return {};
    
    const combined: Record<string, any> = {};
    
    // Priority 1: Move from square (highest priority)
    if (moveFrom) {
      combined[moveFrom] = {
        background: 'rgba(255, 255, 0, 0.4)',
        borderRadius: '50%'
      };
    }

    // Priority 2: Last move squares
    if (lastMove) {
      combined[lastMove[0]] = {
        background: 'rgba(255, 255, 0, 0.4)'
      };
      combined[lastMove[1]] = {
        background: 'rgba(255, 255, 0, 0.4)'
      };
    }

    // Priority 3: Option squares (possible moves)
    Object.assign(combined, optionSquares);

    // Priority 4: Move squares (current selection)
    Object.assign(combined, moveSquares);

    // Priority 5: Right-clicked squares (lowest priority)
    Object.assign(combined, rightClickedSquares);

    return combined;
  }, [moveFrom, lastMove, optionSquares, moveSquares, rightClickedSquares]);

  // Wrap handlers with useCallback to ensure they're stable
  const handlePieceDrop = useCallback(({ piece, sourceSquare, targetSquare }: any) => {
    if (!game || typeof game !== 'object') return false;
    
    console.log('[Board] onPieceDrop called:', { piece, sourceSquare, targetSquare });
    const result = onPieceDrop(sourceSquare, targetSquare, piece);
    return result;
  }, [chess, game.id, game.color, game.toMove, premoves, onMove]);

  const handleSquareClick = useCallback(({ square, piece: _piece, event }: any) => {
    if (!game || typeof game !== 'object') return;
    
    if (event?.shiftKey) {
      const colour = 'rgba(255, 170, 0, 0.5)';
      setArrows(prev => [...prev, { startSquare: square, endSquare: square, color: colour }]);
      return;
    }
    onSquareClick(square);
  }, [chess, moveFrom, game.color, game.toMove, premoves, rightClickedSquares]);

  const handleSquareRightClick = useCallback(({ square }: any) => {
    if (!game || typeof game !== 'object') return;
    
    onSquareRightClick(square);
  }, [premoves, rightClickedSquares]);

  const handleArrowsChange = useCallback((data: { arrows: Array<{ startSquare: string; endSquare: string; color: string }> }) => {
    if (!game || typeof game !== 'object') return;
    
    onArrowsChange(data);
  }, []);

  // Professional chess system - color and orientation handling
  const playerColor: Color = game.color;
  const toMoveColor: Color = game.toMove;

  // Board orientation logic: each player sees their pieces at the bottom by default
  // Can be manually flipped with the flip button
  const boardOrientation: Color = flipped
    ? (playerColor === 'white' ? 'black' : 'white')
    : playerColor;

  // Configure chessboard using new v5 options API
  const chessboardOptions: ChessboardOptions = useMemo(() => ({
    position: gamePosition,
    boardOrientation: boardOrientation,
    onPieceDrop: handlePieceDrop,
    onSquareClick: handleSquareClick,
    onSquareRightClick: handleSquareRightClick,
    onArrowsChange: handleArrowsChange,
    customSquareStyles: customSquareStyles,
    customBoardStyle: {
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
    },
    customDarkSquareStyle: { backgroundColor: boardTheme.dark },
    customLightSquareStyle: { backgroundColor: boardTheme.light },
    isDraggablePiece: isDraggablePiece,
    showPromotionDialog: showPromotionDialog,
    promotionDialogVariant: 'modal',
    promotionToSquare: pendingPromotion?.to,
    promotionPieceOptions: ['q', 'r', 'b', 'n'],
    onPromotionPieceSelect: handlePromotionSelect,
    onPromotionCheck: handlePromotionCheck,
    onPromotionDialogClose: handlePromotionCancel,
    arrows: arrows,
    clearPremovesOnRightClick: true,
    boardWidth: boardWidth,
    animationDuration: 200,
    showBoardNotation: true,
    showCoordinates: true
  }), [
    gamePosition,
    boardOrientation,
    handlePieceDrop,
    handleSquareClick,
    handleSquareRightClick,
    handleArrowsChange,
    customSquareStyles,
    boardTheme,
    isDraggablePiece,
    showPromotionDialog,
    pendingPromotion,
    arrows,
    boardWidth
  ]);

  // Handle promotion piece selection
  const handlePromotionSelect = useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    
    setShowPromotionDialog(false);
    setPendingPromotion(null);
    
    try {
      const result = chess.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece
      });
      
      if (result) {
        setGamePosition(chess.fen());
        setLastMove([result.from, result.to]);
        onMove?.(game.id, result.san, Date.now());
      }
    } catch (error) {
      console.error('[Board] Error promoting piece:', error);
    }
  }, [pendingPromotion, chess, onMove]);

  // Handle promotion cancellation
  const handlePromotionCancel = useCallback(() => {
    setShowPromotionDialog(false);
    setPendingPromotion(null);
  }, []);

  // Early return check after all hooks are declared
  if (!game || typeof game !== 'object') {
    console.error('[Board] ReactChessBoard: Invalid game object', game);
    return <div>Loading game...</div>;
  }

  // Handle piece click with professional chess system logic
  function onSquareClick(square: Square) {
    const isCurrentPlayerTurn = toMoveColor === playerColor;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Board] Square clicked:', square, 'isMyTurn:', isCurrentPlayerTurn, 'moveFrom:', moveFrom, 'playerColor:', playerColor, 'toMove:', toMoveColor);
    }
    setRightClickedSquares({});

    // From square - selecting a piece
    if (!moveFrom) {
      const piece = chess.get(square as any);
      const pieceColor = piece?.color === 'w' ? 'white' : 'black';
      const isMyPiece = piece && pieceColor === playerColor;

      if (!isMyPiece) {
        return;
      }

      // Cancel any existing premoves when selecting a new piece
      if (premoves.length > 0) {
        console.log('[Premove] Canceling premove chain - new piece selected');
        setPremoves([]);
      }

        setMoveFrom(square);
      haptic.pieceSelected();
      return;
    }

    // To square - validate move
    const moves = chess.moves({
        square: moveFrom as any,
        verbose: true,
      } as any);

    const foundMove = (moves as any[]).find(
      (m) => m.from === moveFrom && m.to === square
    );

    if (!foundMove) {
      console.log('[Board] Invalid move from', moveFrom, 'to', square);
      setMoveFrom(null);
      return;
    }

    // Valid move found - make the move
      const move = chess.move({
        from: moveFrom as any,
        to: square as any,
        promotion: 'q',
      } as any);

      if (move === null) {
        console.log('[Board] Move validation failed');
      setMoveFrom(null);
        return;
      }

      setMoveFrom(null);
      setOptionSquares({});

      // Update local board optimistically
      setGamePosition(chess.fen());
      setLastMove([moveFrom, square]);

      // Send move to server
      const moveUci = moveFrom + square + (move.promotion || '');
    onMove?.(game.id, moveUci, Date.now());
  }

  // Handle piece drop with professional chess system logic
  function onPieceDrop(sourceSquare: Square, targetSquare: Square, _piece?: string) {
    const isCurrentPlayerTurn = toMoveColor === playerColor;

    // Only allow moves on current player's turn
    if (!isCurrentPlayerTurn) {
      return false;
    }

    // Validate the piece belongs to current player
    const chessPiece = chess.get(sourceSquare as any);
    const pieceColor = chessPiece?.color === 'w' ? 'white' : 'black';
    const isMyPiece = chessPiece && pieceColor === playerColor;

    if (!isMyPiece) {
      return false;
    }

    // Try the move
    const moveAttempt = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

      if (moveAttempt === null) {
        console.log('[Board] Illegal move:', sourceSquare, 'to', targetSquare);
        return false;
      }

    // Clear selection states
    setMoveFrom(null);
    setOptionSquares({});

      // Update local board optimistically
      setGamePosition(chess.fen());
      setLastMove([sourceSquare, targetSquare]);

      // Play move sound
      playMoveSound({
        captured: !!moveAttempt.captured,
        castle: moveAttempt.flags?.includes('k') || moveAttempt.flags?.includes('q'),
        promotion: !!moveAttempt.promotion,
        check: moveAttempt.san.includes('+'),
        checkmate: moveAttempt.san.includes('#')
      });

      // Send move to server
      const moveUci = sourceSquare + targetSquare + (moveAttempt.promotion || '');
    onMove?.(game.id, moveUci, Date.now());

    return true;
  }

  // Handle right click for square highlighting
  function onSquareRightClick(square: Square) {
    // Cancel premove chain on right click
    if (premoves.length > 0) {
      console.log('[Premove] Cancelling premove chain via right-click');
      setPremoves([]);
      return;
    }

    // Toggle square highlight
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square] &&
        rightClickedSquares[square].backgroundColor === colour
          ? undefined
          : { backgroundColor: colour },
    });
  }

  // Handle arrow drawing (right-click drag)
  function onArrowsChange({ arrows: newArrows }: { arrows: Array<{ startSquare: string; endSquare: string; color: string }> }) {
    console.log('[Arrows] Arrows updated:', newArrows);
    setArrows(newArrows);
  }

  // Handle promotion check
  function handlePromotionCheck(sourceSquare: Square, targetSquare: Square) {
    const piece = chess.get(sourceSquare as any);
    const isPawn = piece?.type === 'p';
    const targetRank = targetSquare[1];
    const isPromotionMove = isPawn && (
      (playerColor === 'white' && targetRank === '8') ||
      (playerColor === 'black' && targetRank === '1')
    );
    return isPromotionMove;
  }

  // Force board re-render when color changes with explicit key
  const boardKey = `chessboard-${game.id}-${boardOrientation}-${game.moves?.length || 0}`;

  console.log('[Board] ReactChessBoard Render - BOARD ORIENTATION DEBUG:', {
    'game.id': game.id,
    'game.color (raw)': game.color,
    'playerColor (assigned)': playerColor,
    'toMoveColor': toMoveColor,
    'typeof game.color': typeof game.color,
    'game object': game
  });

  console.log('[Board] Orientation:', {
    playerColor,
    flipped,
    boardOrientation,
    description: flipped ? 'manually flipped' : 'normal (player perspective)'
  });








  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* Chess Board - PROFESSIONAL STYLING */}
      <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#2a2825] via-[#252220] to-[#1f1d1a] border-2 border-[#3a3632] shadow-2xl">
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"></div>

        <div style={{ width: `${boardWidth}px`, height: `${boardWidth}px` }} className="relative z-10">
          <Chessboard
            key={boardKey}
            options={chessboardOptions}
          />
        </div>
      </div>

      {/* Promotion Dialog */}
      <PromotionDialog
        isOpen={showPromotionDialog}
        playerColor={playerColor}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
}