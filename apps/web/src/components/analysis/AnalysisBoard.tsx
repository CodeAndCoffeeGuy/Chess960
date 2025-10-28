'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import Chessground from 'react-chessground';
import { SkipBack, ChevronLeft, ChevronRight, SkipForward, RotateCcw } from 'lucide-react';
import { EvaluationBar } from './EvaluationBar';

type Square = string;

interface GameState {
  id: string;
  color: 'white' | 'black';
  moves: string[];
  toMove: 'white' | 'black';
  ended: boolean;
}

interface MoveAnalysis {
  ply: number;
  move: string;
  san: string;
  evaluation: {
    cp?: number;
    mate?: number;
    depth: number;
    bestMove?: string;
  };
  accuracy?: {
    accuracy: number;
    classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'missed-win';
    winPercent: number;
    winPercentLoss: number;
  };
  isBook: boolean;
}

interface AnalysisBoardProps {
  game: GameState;
  onMove: (gameId: string, move: string, moveTime?: number) => void;
  initialFen?: string;
  onPositionChange?: (fen: string) => void;
  showEvaluation?: boolean;
  className?: string;
  moveAnalysis?: MoveAnalysis[];
}

interface MoveEvaluation {
  fen: string;
  eval: number;
  mate?: number;
  bestMove?: string;
  depth?: number;
}

export default function AnalysisBoard({
  game,
  onMove: _onMove,
  initialFen,
  onPositionChange,
  showEvaluation = true,
  className = '',
  moveAnalysis = []
}: AnalysisBoardProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [rightClickedSquares, setRightClickedSquares] = useState<{ [key: string]: { backgroundColor: string } }>({});
  const [optionSquares, setOptionSquares] = useState<{ [key: string]: { background: string; borderRadius?: string } }>({});
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [evaluation, setEvaluation] = useState<MoveEvaluation | null>(null);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [boardKey, setBoardKey] = useState(0);

  // Build move history with proper notation
  const moveHistory = game?.moves || [];

  // Calculate current position based on move index
  const positionFen = useMemo(() => {
    const chess = new Chess(initialFen);
    for (let i = 0; i < currentMoveIndex; i++) {
      const moveUci = moveHistory[i];
      if (!moveUci) break;

      try {
        const from = moveUci.slice(0, 2) as Square;
        const to = moveUci.slice(2, 4) as Square;
        const promotion = moveUci.length > 4 ? (moveUci[4] as any) : undefined;
        chess.move({ from, to, promotion });
      } catch (error) {
        console.error('[AnalysisBoard] Invalid move:', moveUci, error);
      }
    }
    return chess.fen();
  }, [currentMoveIndex, moveHistory, initialFen]);

  // Get current position evaluation from analysis data
  const currentEvaluation = useMemo(() => {
    console.log('[AnalysisBoard] Computing evaluation - moveAnalysis length:', moveAnalysis?.length, 'currentMoveIndex:', currentMoveIndex);

    if (!moveAnalysis || moveAnalysis.length === 0 || currentMoveIndex === 0) {
      console.log('[AnalysisBoard] No evaluation available - returning default');
      return { eval: 0, mate: undefined };
    }

    // Get the evaluation at the current move index
    const currentMove = moveAnalysis[currentMoveIndex - 1];
    console.log('[AnalysisBoard] Current move data:', currentMove);

    if (currentMove && currentMove.evaluation) {
      const result = {
        eval: currentMove.evaluation.cp || 0,
        mate: currentMove.evaluation.mate
      };
      console.log('[AnalysisBoard] Returning evaluation:', result);
      return result;
    }

    console.log('[AnalysisBoard] No evaluation in current move - returning default');
    return { eval: 0, mate: undefined };
  }, [moveAnalysis, currentMoveIndex]);

  // Update position when move index changes
  useEffect(() => {
    console.log('[AnalysisBoard] Move index changed to:', currentMoveIndex, 'Total moves:', moveHistory.length);
    console.log('[AnalysisBoard] New position FEN:', positionFen);

    // Force board remount by incrementing key
    setBoardKey(prev => prev + 1);

    // Calculate last move for highlighting
    let lastMoveSquares: [Square, Square] | null = null;
    if (currentMoveIndex > 0) {
      const lastMoveUci = moveHistory[currentMoveIndex - 1];
      if (lastMoveUci && lastMoveUci.length >= 4) {
        lastMoveSquares = [
          lastMoveUci.slice(0, 2) as Square,
          lastMoveUci.slice(2, 4) as Square
        ];
      }
    }
    setLastMove(lastMoveSquares);

    if (onPositionChange) {
      onPositionChange(positionFen);
    }

    // Update evaluation from analysis data instead of API
    console.log('[AnalysisBoard] Update evaluation check - showEvaluation:', showEvaluation, 'currentEvaluation:', currentEvaluation);

    if (showEvaluation && currentEvaluation) {
      const newEval = {
        fen: positionFen,
        eval: currentEvaluation.eval / 100, // Convert centipawns to pawns
        mate: currentEvaluation.mate,
        depth: moveAnalysis[currentMoveIndex - 1]?.evaluation.depth || 0
      };
      console.log('[AnalysisBoard] Setting evaluation state:', newEval);
      setEvaluation(newEval);
    } else {
      console.log('[AnalysisBoard] Not setting evaluation - conditions not met');
    }
  }, [currentMoveIndex, positionFen, moveHistory, onPositionChange, showEvaluation, currentEvaluation, moveAnalysis]);

  // Evaluate position using Stockfish

  // Navigation functions
  const goToStart = useCallback(() => {
    console.log('[AnalysisBoard] Go to start');
    setCurrentMoveIndex(0);
  }, []);

  const goToPrevious = useCallback(() => {
    console.log('[AnalysisBoard] Go to previous, current:', currentMoveIndex);
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(prev => prev - 1);
    }
  }, [currentMoveIndex]);

  const goToNext = useCallback(() => {
    console.log('[AnalysisBoard] Go to next, current:', currentMoveIndex, 'total:', moveHistory.length);
    if (currentMoveIndex < moveHistory.length) {
      setCurrentMoveIndex(prev => prev + 1);
    }
  }, [currentMoveIndex, moveHistory.length]);

  const goToEnd = useCallback(() => {
    console.log('[AnalysisBoard] Go to end');
    setCurrentMoveIndex(moveHistory.length);
  }, [moveHistory.length]);

  const goToMove = useCallback((index: number) => {
    if (index >= 0 && index <= moveHistory.length) {
      setCurrentMoveIndex(index);
    }
  }, [moveHistory.length]);

  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        goToEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToStart, goToPrevious, goToNext, goToEnd]);

  // Helper function to get move options for a piece
  function getMoveOptions(square: Square) {
    const chess = new Chess(positionFen);
    const moves = chess.moves({
      square: square as any,
      verbose: true,
    }) as Array<{ from: string; to: string; piece: string; captured?: string; promotion?: string }>;

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: { [key: string]: { background: string; borderRadius?: string } } = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          chess.get(move.to as any) && chess.get(move.to as any)!.color !== chess.get(square as any)!.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  // Square click handler for piece selection and move making
  function onSquareClick(square: Square) {
    // Analysis mode - don't allow moves, just navigate
    // Right click cancels
    setRightClickedSquares({});

    // If no piece selected, select the piece
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    const chess = new Chess(positionFen);

    // Try to make a move
    const moves = chess.moves({
      square: moveFrom as any,
      verbose: true,
    }) as Array<{ from: string; to: string; piece: string; captured?: string; promotion?: string }>;

    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      // Invalid move, select new square
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : null);
      return;
    }

    // Check for promotion
    const isPromotion =
      chess.get(moveFrom as any)?.type === 'p' &&
      ((square[1] === '8' && chess.turn() === 'w') || (square[1] === '1' && chess.turn() === 'b'));

    // For now, always promote to queen (you can add a promotion dialog later)
    const promotion = isPromotion ? 'q' : undefined;

    // Make the move
    const move = chess.move({
      from: moveFrom,
      to: square,
      promotion,
    });

    if (move) {
      const _uci = moveFrom + square + (promotion || '');
      setMoveFrom(null);
      setOptionSquares({});

      // In analysis mode, don't actually make the move
      // Just clear selection
      // If you want to allow making moves in analysis, uncomment below:
      // onMove(game.id, _uci, Date.now());
    }
  }

  // Square right click handler for marking squares
  function onSquareRightClick(square: Square) {
    const color = rightClickedSquares[square]?.backgroundColor === 'rgba(255, 0, 0, 0.4)'
      ? 'rgba(0, 0, 255, 0.4)'
      : 'rgba(255, 0, 0, 0.4)';

    setRightClickedSquares({
      ...rightClickedSquares,
      [square]: { backgroundColor: color },
    });
  }

  // Convert UCI moves to SAN notation for display
  const getMoveSAN = (moveIndex: number) => {
    const tempChess = new Chess();
    for (let i = 0; i <= moveIndex; i++) {
      if (i === moveIndex) {
        const moveUci = moveHistory[i];
        try {
          const from = moveUci.slice(0, 2) as Square;
          const to = moveUci.slice(2, 4) as Square;
          const promotion = moveUci.length > 4 ? (moveUci[4] as any) : undefined;
          const move = tempChess.move({ from, to, promotion });
          return move?.san || moveUci;
        } catch {
          return moveUci;
        }
      } else {
        const moveUci = moveHistory[i];
        const from = moveUci.slice(0, 2) as Square;
        const to = moveUci.slice(2, 4) as Square;
        const promotion = moveUci.length > 4 ? (moveUci[4] as any) : undefined;
        tempChess.move({ from, to, promotion });
      }
    }
    return '';
  };

  // Format evaluation for display
  const formatEval = (evaluation?: { cp?: number; mate?: number }) => {
    if (!evaluation) return '';
    if (evaluation.mate !== undefined) {
      return `M${evaluation.mate}`;
    }
    if (evaluation.cp !== undefined) {
      const pawns = (evaluation.cp / 100).toFixed(1);
      return evaluation.cp > 0 ? `+${pawns}` : pawns;
    }
    return '';
  };

  // Custom square styles with last move highlighting
  const customSquareStyles = {
    ...optionSquares,
    ...rightClickedSquares,
    ...(lastMove ? {
      [lastMove[0]]: { backgroundColor: 'rgba(155, 199, 0, 0.4)' },
      [lastMove[1]]: { backgroundColor: 'rgba(155, 199, 0, 0.4)' },
    } : {}),
  };

  if (!game) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#2a2723] rounded-lg">
        <div className="text-white">Loading analysis board...</div>
      </div>
    );
  }

  return (
    <div className={`analysis-board-grid ${className}`}>
      {/* Grid Layout */}
      <style jsx>{`
        .analysis-board-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: auto 1fr auto;
          grid-template-areas:
            "gauge board moves"
            "gauge controls moves";
          max-width: 1400px;
          margin: 0 auto;
        }

        .eval-gauge-area {
          grid-area: gauge;
          width: 12px;
          min-height: 600px;
        }

        .board-area {
          grid-area: board;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .controls-area {
          grid-area: controls;
        }

        .moves-area {
          grid-area: moves;
          width: 320px;
        }

        /* Mobile Layout */
        @media (max-width: 1024px) {
          .analysis-board-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "board"
              "controls"
              "moves";
          }

          .eval-gauge-area {
            display: none;
          }

          .moves-area {
            width: 100%;
          }
        }
      `}</style>

      {/* Evaluation Bar */}
      {showEvaluation && evaluation && (
        <div className="eval-gauge-area">
          {(() => {
            console.log('[AnalysisBoard] Render check - showEvaluation:', showEvaluation, 'evaluation:', evaluation);
            return (
              <EvaluationBar
                evaluation={evaluation.eval}
                mate={evaluation.mate}
                orientation="vertical"
                showLabel={false}
                className="h-full"
              />
            );
          })()}
        </div>
      )}

      {/* Chessboard */}
      <div className="board-area">
        <div className="bg-gradient-to-br from-[#2a2825] via-[#252220] to-[#1f1d1a] p-3 sm:p-4 rounded-2xl border-2 border-[#3a3632] shadow-2xl">
          <div className="relative">
            <div style={{ width: '600px', height: '600px' }}>
              <Chessground
                key={boardKey}
                fen={positionFen}
                orientation={boardOrientation}
                lastMove={lastMove ? [lastMove[0], lastMove[1]] : undefined}
                viewOnly={false}
                onSquareClick={onSquareClick}
                onSquareRightClick={onSquareRightClick}
                squareStyles={customSquareStyles}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="controls-area">
        <div className="bg-[#2a2825]/90 backdrop-blur-sm border-2 border-[#3a3632] rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToStart}
                disabled={currentMoveIndex === 0}
                className="p-2 rounded-lg bg-[#35322e] border border-[#474239] hover:bg-[#3a3733] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm"
                title="Go to start"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={goToPrevious}
                disabled={currentMoveIndex === 0}
                className="p-2 rounded-lg bg-[#35322e] border border-[#474239] hover:bg-[#3a3733] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm"
                title="Previous move"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentMoveIndex >= moveHistory.length}
                className="p-2 rounded-lg bg-[#35322e] border border-[#474239] hover:bg-[#3a3733] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm"
                title="Next move"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToEnd}
                disabled={currentMoveIndex >= moveHistory.length}
                className="p-2 rounded-lg bg-[#35322e] border border-[#474239] hover:bg-[#3a3733] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm"
                title="Go to end"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Move Counter */}
            <div className="text-center px-4 py-2 bg-[#35322e] border border-[#474239] rounded-lg text-white font-mono text-sm shadow-sm">
              {currentMoveIndex}/{moveHistory.length}
            </div>

            {/* Flip Button */}
            <button
              onClick={flipBoard}
              className="p-2 rounded-lg bg-[#35322e] border border-[#474239] hover:bg-[#3a3733] text-white transition-all shadow-sm"
              title="Flip board"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Evaluation Info */}
          {showEvaluation && evaluation && (
            <div className="mt-4 pt-4 border-t border-[#474239]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-1">Evaluation</div>
                  <div className="text-white font-semibold font-mono">
                    {evaluation.mate !== undefined
                      ? `M${evaluation.mate > 0 ? evaluation.mate : Math.abs(evaluation.mate)}`
                      : `${evaluation.eval > 0 ? '+' : ''}${evaluation.eval.toFixed(2)}`
                    }
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Depth</div>
                  <div className="text-white font-semibold">
                    {evaluation.depth || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move List */}
      <div className="moves-area">
        <div className="bg-[#2a2825]/90 backdrop-blur-sm border-2 border-[#3a3632] rounded-xl p-4 shadow-xl h-full">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="flex-1">Moves</span>
            <span className="text-xs text-gray-400 font-normal">
              {currentMoveIndex > 0 && `Move ${currentMoveIndex}`}
            </span>
          </h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#474239] scrollbar-track-transparent pr-2">
            {moveHistory.length === 0 ? (
              <div className="text-[#a0958a] text-sm text-center py-8">
                No moves yet
              </div>
            ) : (
              <div className="space-y-0.5 font-mono">
                {moveHistory.map((_, index) => {
                  if (index % 2 === 1) return null;

                  const whiteMove = getMoveSAN(index);
                  const blackMove = index + 1 < moveHistory.length ? getMoveSAN(index + 1) : null;
                  const moveNumber = Math.floor(index / 2) + 1;

                  // Get analysis data for these moves
                  const whiteMoveAnalysis = moveAnalysis?.find(m => m.ply === index + 1);
                  const blackMoveAnalysis = moveAnalysis?.find(m => m.ply === index + 2);

                  // Get text color based on move quality
                  const getQualityTextColor = (classification?: string) => {
                    if (!classification) return 'text-white';
                    switch (classification) {
                      case 'excellent':
                      case 'good': return 'text-green-400';
                      case 'inaccuracy': return 'text-yellow-400';
                      case 'mistake': return 'text-orange-400';
                      case 'blunder': return 'text-red-400';
                      default: return 'text-white';
                    }
                  };

                  // Get background color for active moves
                  const getQualityBgColor = (classification?: string) => {
                    if (!classification) return 'bg-orange-600/20';
                    switch (classification) {
                      case 'excellent':
                      case 'good': return 'bg-green-500/20';
                      case 'inaccuracy': return 'bg-yellow-500/20';
                      case 'mistake': return 'bg-orange-500/20';
                      case 'blunder': return 'bg-red-500/20';
                      default: return 'bg-orange-600/20';
                    }
                  };

                  return (
                    <div key={index} className="flex items-baseline gap-1.5 text-sm">
                      {/* Move number */}
                      <span className="text-[#8a8276] text-xs w-7 text-right">{moveNumber}.</span>

                      {/* White's move */}
                      <span
                        onClick={() => goToMove(index + 1)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded transition-all font-bold ${
                          currentMoveIndex === index + 1
                            ? `${getQualityBgColor(whiteMoveAnalysis?.accuracy?.classification)} ${getQualityTextColor(whiteMoveAnalysis?.accuracy?.classification)}`
                            : `${getQualityTextColor(whiteMoveAnalysis?.accuracy?.classification)} hover:bg-[#3a3733]`
                        }`}
                      >
                        {whiteMove}
                        {whiteMoveAnalysis && !whiteMoveAnalysis.isBook && (
                          <span className="text-[#8a8276] text-xs ml-1 font-normal">
                            {formatEval(whiteMoveAnalysis.evaluation)}
                          </span>
                        )}
                      </span>

                      {/* Black's move */}
                      {blackMove && (
                        <span
                          onClick={() => goToMove(index + 2)}
                          className={`cursor-pointer px-1.5 py-0.5 rounded transition-all font-bold ${
                            currentMoveIndex === index + 2
                              ? `${getQualityBgColor(blackMoveAnalysis?.accuracy?.classification)} ${getQualityTextColor(blackMoveAnalysis?.accuracy?.classification)}`
                              : `${getQualityTextColor(blackMoveAnalysis?.accuracy?.classification)} hover:bg-[#3a3733]`
                          }`}
                        >
                          {blackMove}
                          {blackMoveAnalysis && !blackMoveAnalysis.isBook && (
                            <span className="text-[#8a8276] text-xs ml-1 font-normal">
                              {formatEval(blackMoveAnalysis.evaluation)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
