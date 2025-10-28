'use client';

import { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useGameSounds } from '@/hooks/useGameSounds';
import { PromotionDialog } from './PromotionDialog';

interface ChessBoardProps {
  game: {
    id: string;
    color: 'white' | 'black';
    moves: string[];
    toMove: 'white' | 'black';
    ended: boolean;
    initialFen?: string;
  };
  onMove: (gameId: string, uci: string, moveTime?: number) => void;
  soundsEnabled?: boolean;
  showCoordinates?: boolean;
}

type Square = string | null;
type Board = Square[][];

export function ChessBoard({ game, onMove, soundsEnabled = true, showCoordinates = true }: ChessBoardProps) {
  const { playSound, initAudio } = useGameSounds(soundsEnabled);
  const chess = useRef(new Chess(game.initialFen));
  const [board, setBoard] = useState<Board>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [premoves, setPremoves] = useState<string[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: string } | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<string | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ move: string; isMyTurn: boolean } | null>(null);
  const moveSequence = useRef(0);
  const lastMoveCount = useRef(0);
  const lastPlayedSound = useRef<string | null>(null);

  // Initialize audio on first interaction
  useEffect(() => {
    const handleFirstClick = () => {
      initAudio();
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    return () => document.removeEventListener('click', handleFirstClick);
  }, [initAudio]);

  // Initialize and update board
  useEffect(() => {
    // Reset chess instance with initial FEN if provided
    chess.current = new Chess(game.initialFen);

    // Play all moves
    for (const move of game.moves) {
      try {
        chess.current.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move.length === 5 ? move[4] : undefined,
        });
      } catch (error) {
        console.error('Invalid move in game:', move, error);
        break;
      }
    }

    // Update board display
    updateBoard();

    // Update last move
    if (game.moves.length > 0) {
      const lastMoveUci = game.moves[game.moves.length - 1];
      setLastMove({
        from: lastMoveUci.slice(0, 2),
        to: lastMoveUci.slice(2, 4),
      });
    } else {
      setLastMove(null);
    }

    // Cancel premoves if game ended
    if (game.ended && premoves.length > 0) {
      console.log('[Premove] Game ended, canceling premove');
      setPremoves([]);
    }
  }, [game.moves, game.ended]);
  
  const updateBoard = () => {
    const position = chess.current.board();
    const newBoard: Board = position.map(row =>
      row.map(square => square ? `${square.color}${square.type.toUpperCase()}` : null)
    );
    setBoard(newBoard);
  };
  
  const getSquareId = (row: number, col: number): string => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return `${files[col]}${ranks[row]}`;
  };
  
  const parseSquareId = (square: string): { row: number; col: number } => {
    const col = square.charCodeAt(0) - 97; // 'a' = 0
    const row = 8 - parseInt(square[1]); // '8' = 0
    return { row, col };
  };
  
  const handleSquareClick = (row: number, col: number) => {
    if (game.ended) return;

    const square = getSquareId(row, col);
    const piece = board[row][col];
    const isMyPiece = piece && piece[0] === (game.color === 'white' ? 'w' : 'b');
    const isMyTurn = game.toMove === game.color;

    if (selectedSquare) {
      // Try to make a move
      const moveUci = selectedSquare + square;

      // Allow premove validation when it's not our turn
      const allowPremove = !isMyTurn;

      if (isValidMove(moveUci, allowPremove)) {
        // Check for promotion
        const toRow = parseSquareId(square).row;
        const isPawnMove = chess.current.get(selectedSquare as any)?.type === 'p';
        const isPromotionRank = (game.color === 'white' && toRow === 0) ||
                              (game.color === 'black' && toRow === 7);

        if (isPawnMove && isPromotionRank) {
          // Show promotion dialog
          setPendingPromotion({ move: moveUci, isMyTurn });
          setShowPromotionDialog(true);
        } else {
          if (isMyTurn) {
            // Cancel any existing premove
            cancelPremove();
            // Make the move immediately
            makeMove(moveUci);
          } else {
            // Replace existing premove with new one
            addPremove(moveUci);
          }
        }
      } else if (isMyPiece) {
        // Cancel premove when selecting a new piece
        cancelPremove();
        // Select new piece
        selectSquare(square);
      } else {
        // Clear selection and cancel premove
        cancelPremove();
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (isMyPiece) {
      // Cancel premove when starting a new selection
      cancelPremove();
      // Select piece
      selectSquare(square);
    }
  };
  
  const selectSquare = (square: string) => {
    setSelectedSquare(square);

    // Get legal moves for this piece
    // If it's not our turn, temporarily make an opponent move to get our legal moves
    let needsUndo = false;
    if (game.toMove !== game.color) {
      const opponentMoves = chess.current.moves({ verbose: true }) as any[];
      if (opponentMoves.length > 0) {
        chess.current.move(opponentMoves[0]);
        needsUndo = true;
      }
    }

    const moves = chess.current.moves({ square: square as any, verbose: true } as any);
    const moveSquares = (moves as any[]).map(move => (move as any).to as string);
    setLegalMoves(moveSquares);

    if (needsUndo) {
      chess.current.undo();
    }
  };
  
  const isValidMove = (uci: string, allowPremove: boolean = false): boolean => {
    try {
      // If checking for premove, temporarily make an opponent move first
      let needsUndo = false;
      if (allowPremove && game.toMove !== game.color) {
        // Find any legal move for opponent and make it temporarily
        const opponentMoves = chess.current.moves({ verbose: true }) as any[];
        if (opponentMoves.length > 0) {
          chess.current.move(opponentMoves[0]);
          needsUndo = true;
        }
      }

      const move = chess.current.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length === 5 ? uci[4] : undefined,
      });

      if (move) {
        // Undo the move
        chess.current.undo();
        if (needsUndo) {
          chess.current.undo(); // Undo the opponent's temporary move
        }
        return true;
      }

      if (needsUndo) {
        chess.current.undo(); // Undo the opponent's temporary move if our move failed
      }
      return false;
    } catch {
      return false;
    }
  };
  
  const makeMove = (uci: string) => {
    // Increment move sequence
    moveSequence.current += 1;
    
    // Play sound based on move type
    try {
      const tempChess = new Chess(game.initialFen);
      // Replay all existing moves
      for (const m of game.moves) {
        tempChess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m.length === 5 ? m[4] : undefined });
      }

      // Make the new move
      const moveResult = tempChess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length === 5 ? uci[4] : undefined,
      });

      if (moveResult) {
        // Determine sound type
        let soundType: 'move' | 'capture' | 'castle' | 'check' | 'gameStart' | 'gameEnd' | 'lowTime' | 'premove' = 'move';
        if (tempChess.inCheck()) {
          soundType = 'check';
        } else if (moveResult.flags.includes('c')) {
          soundType = 'capture';
        } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
          soundType = 'castle';
        }
        
        // Only play sound if it's different from the last one to avoid duplicates
        if (lastPlayedSound.current !== soundType) {
          playSound(soundType);
          lastPlayedSound.current = soundType;
        }
      }
    } catch {
      // Only play fallback sound if no sound was played yet
      if (lastPlayedSound.current === null) {
        playSound('move' as const);
        lastPlayedSound.current = 'move';
      }
    }

    const moveTime = Date.now();
    onMove(game.id, uci, moveTime);
    setSelectedSquare(null);
    setLegalMoves([]);
  };
  
  const addPremove = (uci: string) => {
    console.log('[Premove] Setting premove:', uci);
    setPremoves([uci]); // Only allow one premove for now
    setSelectedSquare(null);
    setLegalMoves([]);
    playSound('premove' as const);
  };

  const cancelPremove = () => {
    if (premoves.length > 0) {
      console.log('[Premove] Canceling premove');
      setPremoves([]);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, row: number, col: number) => {
    if (game.ended) {
      e.preventDefault();
      return;
    }

    const square = getSquareId(row, col);
    const piece = board[row][col];
    const isMyPiece = piece && piece[0] === (game.color === 'white' ? 'w' : 'b');

    if (!isMyPiece) {
      e.preventDefault();
      return;
    }

    setDraggedPiece({ square, piece });
    selectSquare(square);

    // Set drag image
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    e.dataTransfer.setDragImage(canvas, 30, 30);
  };

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const square = getSquareId(row, col);
    setDragOverSquare(square);
  };

  const handleDragLeave = () => {
    setDragOverSquare(null);
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (!draggedPiece) return;

    const targetSquare = getSquareId(row, col);
    const moveUci = draggedPiece.square + targetSquare;
    const isMyTurn = game.toMove === game.color;

    // Check for promotion
    const toRow = row;
    const isPawnMove = chess.current.get(draggedPiece.square as any)?.type === 'p';
    const isPromotionRank = (game.color === 'white' && toRow === 0) ||
                          (game.color === 'black' && toRow === 7);

    const allowPremove = !isMyTurn;

    if (isPawnMove && isPromotionRank && isValidMove(moveUci + 'q', allowPremove)) {
      // Show promotion dialog
      setPendingPromotion({ move: moveUci, isMyTurn });
      setShowPromotionDialog(true);
    } else if (isValidMove(moveUci, allowPremove)) {
      if (isMyTurn) {
        cancelPremove();
        makeMove(moveUci);
      } else {
        addPremove(moveUci);
      }
    }

    setDraggedPiece(null);
    setDragOverSquare(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setDragOverSquare(null);
  };

  // Execute premoves when opponent makes a move and it becomes our turn
  useEffect(() => {
    const currentMoveCount = game.moves.length;

    // Check if opponent just moved (move count increased and now it's our turn)
    if (currentMoveCount > lastMoveCount.current &&
        game.toMove === game.color &&
        premoves.length > 0 &&
        !game.ended) {

      console.log('[Premove] Opponent moved, attempting to execute premove');

      // Small delay to prevent race conditions (like atomic explosions)
      setTimeout(() => {
        const premove = premoves[0];

        // Validate premove is still legal after opponent's move
        if (isValidMove(premove, false)) {
          console.log('[Premove] Premove is legal, executing:', premove);
          makeMove(premove);
        } else {
          console.log('[Premove] Premove is no longer legal, canceling');
        }

        // Always clear premove after attempting
        setPremoves([]);
      }, 10);
    }

    // Update last move count
    lastMoveCount.current = currentMoveCount;
  }, [game.moves.length, game.toMove, game.color, premoves, game.ended]);
  
  const getSquareClasses = (row: number, col: number): string => {
    const square = getSquareId(row, col);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isLegalMove = legalMoves.includes(square);
    // Remove unused variable warning
    void isLegalMove;
    const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
    const isInCheck = chess.current.inCheck() && 
                     (chess.current.get(square as any)?.type === 'k') &&
                     (chess.current.get(square as any)?.color === chess.current.turn());
    
    let classes = 'chess-square ';
    classes += isLight ? 'light ' : 'dark ';
    
    if (isSelected) classes += 'highlighted ';
    if (isLastMoveSquare) classes += 'last-move ';
    if (isInCheck) classes += 'check ';
    
    return classes;
  };
  
  const renderPiece = (piece: Square, row: number, col: number) => {
    if (!piece) return null;

    const square = getSquareId(row, col);
    const isMyPiece = piece && piece[0] === (game.color === 'white' ? 'w' : 'b');
    const isDragging = draggedPiece?.square === square;

    const pieceClass = `chess-piece piece-${piece} ${isDragging ? 'opacity-50' : ''}`;

    return (
      <div
        className={pieceClass}
        draggable={!!(isMyPiece && !game.ended)}
        onDragStart={(e) => handleDragStart(e, row, col)}
        onDragEnd={handleDragEnd}
        style={{ cursor: isMyPiece && !game.ended ? 'grab' : 'default' }}
      />
    );
  };
  
  const renderLegalMoveIndicator = (row: number, col: number) => {
    const square = getSquareId(row, col);
    if (!legalMoves.includes(square)) return null;
    
    const hasPiece = board[row][col] !== null;
    
    if (hasPiece) {
      // Capture indicator
      return (
        <div className="absolute inset-0 border-4 border-red-500 rounded-full opacity-60" />
      );
    } else {
      // Move indicator
      return (
        <div className="absolute inset-1/2 w-3 h-3 bg-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-60" />
      );
    }
  };
  
  const renderPremoveIndicator = (row: number, col: number) => {
    if (premoves.length === 0) return null;

    const premove = premoves[0];
    const square = getSquareId(row, col);
    const isFromSquare = premove.slice(0, 2) === square;
    const isToSquare = premove.slice(2, 4) === square;

    if (isFromSquare) {
      // From square - pulsing blue border
      return (
        <div className="absolute inset-0 border-2 border-blue-400 bg-blue-500 bg-opacity-20 animate-pulse" />
      );
    }

    if (isToSquare) {
      // To square - pulsing blue border with arrow indicator
      return (
        <>
          <div className="absolute inset-0 border-2 border-blue-400 bg-blue-500 bg-opacity-20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-400 rounded-full opacity-80 shadow-lg" />
          </div>
        </>
      );
    }

    return null;
  };
  
  // Flip board if playing as black
  const displayBoard = game.color === 'black' ? 
    board.slice().reverse().map(row => row.slice().reverse()) : 
    board;
  
  const getDisplaySquare = (displayRow: number, displayCol: number) => {
    if (game.color === 'black') {
      return {
        row: 7 - displayRow,
        col: 7 - displayCol,
      };
    }
    return {
      row: displayRow,
      col: displayCol,
    };
  };
  
  const files = game.color === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = game.color === 'white' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Handle promotion piece selection
  const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;

    const finalMoveUci = pendingPromotion.move + piece;

    if (pendingPromotion.isMyTurn) {
      cancelPremove();
      makeMove(finalMoveUci);
    } else {
      addPremove(finalMoveUci);
    }

    // Reset promotion state
    setShowPromotionDialog(false);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Handle promotion cancellation
  const handlePromotionCancel = () => {
    setShowPromotionDialog(false);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  return (
    <div className="relative inline-block">
      {/* Board with coordinates */}
      <div className="chess-board-wrapper">
        <div className="chess-board">
          {displayBoard.map((row, displayRow) =>
            row.map((piece, displayCol) => {
              const { row: actualRow, col: actualCol } = getDisplaySquare(displayRow, displayCol);
              const square = getSquareId(actualRow, actualCol);
              const isDragOver = dragOverSquare === square;

              return (
                <div
                  key={`${actualRow}-${actualCol}`}
                  className={`${getSquareClasses(actualRow, actualCol)} ${isDragOver ? 'bg-orange-500/30' : ''}`}
                  onClick={() => handleSquareClick(actualRow, actualCol)}
                  onDragOver={(e) => handleDragOver(e, actualRow, actualCol)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, actualRow, actualCol)}
                >
                  {renderPremoveIndicator(actualRow, actualCol)}
                  {renderLegalMoveIndicator(actualRow, actualCol)}
                  {renderPiece(piece, actualRow, actualCol)}

                  {/* Coordinate labels */}
                  {showCoordinates && (
                    <>
                      {/* File labels (a-h) on bottom rank */}
                      {displayRow === 7 && (
                        <div className="absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none select-none"
                             style={{ color: (actualRow + actualCol) % 2 === 0 ? '#6b6460' : '#c1b9ad' }}>
                          {files[displayCol]}
                        </div>
                      )}
                      {/* Rank labels (1-8) on left file */}
                      {displayCol === 0 && (
                        <div className="absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none select-none"
                             style={{ color: (actualRow + actualCol) % 2 === 0 ? '#6b6460' : '#c1b9ad' }}>
                          {ranks[displayRow]}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Promotion Dialog */}
      <PromotionDialog
        isOpen={showPromotionDialog}
        playerColor={game.color}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
}