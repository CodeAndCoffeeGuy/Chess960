'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, BookOpen, Award, AlertTriangle } from 'lucide-react';
import { Chess } from 'chess.js';
import { PostGameBrowserAnalyzer, type PostGameAnalysis, type AnalysisProgress } from '@chess960/stockfish/browser';
import AnalysisBoard from './AnalysisBoard';

interface PostGameMove {
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

interface LocalPostGameAnalysis {
  moves: PostGameMove[];
  accuracy: {
    white: number;
    black: number;
    overall: number;
  };
  classifications: {
    white: {
      excellent: number;
      good: number;
      inaccuracy: number;
      mistake: number;
      blunder: number;
    };
    black: {
      excellent: number;
      good: number;
      inaccuracy: number;
      mistake: number;
      blunder: number;
    };
  };
  opening: {
    name: string;
    eco?: string;
    ply: number;
  };
  result: string;
  criticalMoments: PostGameMove[];
}

interface PostGameReportProps {
  gameId?: string;
  pgn?: string;
  playerWhite: {
    name: string;
    rating: number;
  };
  playerBlack: {
    name: string;
    rating: number;
  };
  timeControl: string;
  initialFen?: string; // Chess960 starting position
  onAnalysisComplete?: (analysis: PostGameAnalysis) => void;
  className?: string;
}

export const PostGameReport: React.FC<PostGameReportProps> = ({
  gameId,
  pgn,
  playerWhite: _playerWhite,
  playerBlack: _playerBlack,
  timeControl: _timeControl,
  initialFen,
  onAnalysisComplete,
  className
}) => {
  const [analysis, setAnalysis] = useState<LocalPostGameAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const analyzerRef = useRef<PostGameBrowserAnalyzer | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'opening' | 'middlegame' | 'endgame'>('all');

  // Convert PGN to UCI moves
  const gameMoves = React.useMemo(() => {
    if (!pgn) {
      console.log('[PostGameReport] No PGN provided');
      return [];
    }

    try {
      const tempChess = new Chess();
      tempChess.loadPgn(pgn);
      const moves = tempChess.history({ verbose: true }).map(m => m.from + m.to + (m.promotion || ''));
      console.log('[PostGameReport] Loaded moves:', moves);
      return moves;
    } catch (error) {
      console.error('[PostGameReport] Failed to load PGN:', error);
      return [];
    }
  }, [pgn]);

  // Cleanup analyzer on unmount
  useEffect(() => {
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
        analyzerRef.current = null;
      }
    };
  }, []);

  // Remove auto-start - let user click button when ready

  const startAnalysis = async () => {
    if (!pgn || !gameId) {
      setError('No game data available');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(null);

    try {
      // Check cache first
      console.log('[PostGameReport] Checking cache for gameId:', gameId);
      const cacheResponse = await fetch(`/api/analysis/cache/${gameId}`);

      if (cacheResponse.ok) {
        const cached = await cacheResponse.json();
        if (cached.analysis) {
          console.log('[PostGameReport] Using cached analysis!');
          setAnalysis(cached.analysis);
          onAnalysisComplete?.(cached.analysis);
          setLoading(false);
          return;
        }
      }

      console.log('[PostGameReport] No cache found, running fresh analysis...');

      // Create analyzer with progress callback
      analyzerRef.current = new PostGameBrowserAnalyzer((prog) => {
        setProgress(prog);
      });

      // Run analysis in browser
      const result = await analyzerRef.current.analyzeGame(pgn, {
        depth: 12,
        includeBook: false,
        skipOpeningMoves: 6,
        initialFen
      });

      console.log('[PostGameReport] Analysis completed!');
      console.log('[PostGameReport] Total moves analyzed:', result.moves?.length);
      console.log('[PostGameReport] Sample move data:', result.moves?.[0]);
      console.log('[PostGameReport] Accuracy:', result.accuracy);

      // Save to cache
      console.log('[PostGameReport] Saving analysis to cache...');
      await fetch('/api/analysis/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, analysis: result }),
      }).catch(err => console.error('[PostGameReport] Failed to cache analysis:', err));

      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (error) {
      setError('Analysis failed. Please try again.');
      console.error('Post-game analysis error:', error);
    } finally {
      setLoading(false);
      setProgress(null);

      // Cleanup analyzer
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
        analyzerRef.current = null;
      }
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'excellent':
      case 'good':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'inaccuracy':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      case 'mistake':
        return <TrendingDown className="w-4 h-4 text-orange-400" />;
      case 'blunder':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-400';
    if (accuracy >= 85) return 'text-blue-400';
    if (accuracy >= 75) return 'text-yellow-400';
    if (accuracy >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAccuracyBarWidth = (accuracy: number) => {
    return Math.min(100, Math.max(0, accuracy));
  };

  const ClassificationBadge: React.FC<{ classification: string; count: number }> = ({ classification, count }) => {
    const colors = {
      excellent: 'bg-green-500/20 text-green-300 border-green-500/30',
      good: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      inaccuracy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      mistake: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      blunder: 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    const symbols = {
      excellent: '',
      good: '',
      inaccuracy: '?!',
      mistake: '?',
      blunder: '??'
    };

    if (count === 0) return null;

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${colors[classification as keyof typeof colors]}`}>
        <span className="font-bold mr-1">{symbols[classification as keyof typeof symbols]}</span>
        {count}
      </div>
    );
  };

  return (
    <div className={`post-game-report ${className || ''}`}>
      <div className="bg-[#2a2825] rounded-xl overflow-hidden border-2 border-[#3a3632] shadow-xl">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center text-red-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Chess Board - Always visible */}
        <div className="p-6 border-b border-[#474239]">
          <div className="max-w-5xl mx-auto">
            {(() => {
              console.log('[PostGameReport] Rendering AnalysisBoard');
              console.log('[PostGameReport] analysis exists:', !!analysis);
              console.log('[PostGameReport] showEvaluation:', !!analysis);
              console.log('[PostGameReport] moveAnalysis length:', analysis?.moves?.length || 0);
              return (
                <AnalysisBoard
                  game={{
                    id: gameId || 'analysis',
                    color: 'white',
                    moves: gameMoves,
                    toMove: 'white',
                    ended: true
                  }}
                  onMove={() => {}}
                  showEvaluation={!!analysis}
                  className="w-full"
                  moveAnalysis={analysis?.moves || []}
                />
              );
            })()}

            {/* Start Analysis Button */}
            {!loading && !analysis && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={startAnalysis}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-lg font-medium text-lg"
                >
                  Start Analysis
                </button>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="p-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
              <div className="text-center">
                <div className="text-lg font-medium text-white mb-2">Analyzing Game</div>
                {progress ? (
                  <div className="space-y-2">
                    <div className="text-sm text-[#a0958a]">
                      Move {progress.current} of {progress.total}: {progress.currentMove}
                    </div>
                    <div className="w-64 bg-[#474239] rounded-full h-2 mx-auto">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[#a0958a]">
                    Initializing Stockfish engine...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="p-6 space-y-6">
            {/* Accuracy Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#c1b9ad]">White Accuracy</h3>
                  <Award className="w-4 h-4 text-[#a0958a]" />
                </div>
                <div className={`text-2xl font-bold mb-2 ${getAccuracyColor(analysis.accuracy.white)}`}>
                  {analysis.accuracy.white.toFixed(1)}%
                </div>
                <div className="w-full bg-[#474239] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getAccuracyBarWidth(analysis.accuracy.white)}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#c1b9ad]">Black Accuracy</h3>
                  <Award className="w-4 h-4 text-[#a0958a]" />
                </div>
                <div className={`text-2xl font-bold mb-2 ${getAccuracyColor(analysis.accuracy.black)}`}>
                  {analysis.accuracy.black.toFixed(1)}%
                </div>
                <div className="w-full bg-[#474239] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getAccuracyBarWidth(analysis.accuracy.black)}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#c1b9ad]">Opening</h3>
                  <BookOpen className="w-4 h-4 text-[#a0958a]" />
                </div>
                <div className="text-lg font-medium text-white mb-1">
                  {analysis.opening.name}
                </div>
                <div className="text-sm text-[#a0958a]">
                  {analysis.opening.ply} moves
                </div>
              </div>
            </div>

            {/* Phase Selector */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Filter by Game Phase</h3>
              <div className="flex space-x-2">
                {(['all', 'opening', 'middlegame', 'endgame'] as const).map((phase) => (
                  <button
                    key={phase}
                    onClick={() => setSelectedPhase(phase)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPhase === phase
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#35322e] text-[#c1b9ad] hover:bg-[#3a3733]'
                    }`}
                  >
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Move Classifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 shadow-lg">
                <h3 className="text-lg font-medium text-white mb-4">White Classifications</h3>
                <div className="space-y-2">
                  {Object.entries(analysis.classifications.white).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getClassificationIcon(type)}
                        <span className="capitalize text-[#c1b9ad]">{type}</span>
                      </div>
                      <ClassificationBadge classification={type} count={count} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 shadow-lg">
                <h3 className="text-lg font-medium text-white mb-4">Black Classifications</h3>
                <div className="space-y-2">
                  {Object.entries(analysis.classifications.black).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getClassificationIcon(type)}
                        <span className="capitalize text-[#c1b9ad]">{type}</span>
                      </div>
                      <ClassificationBadge classification={type} count={count} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical Moments */}
            {analysis.criticalMoments.length > 0 && (
              <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 shadow-lg">
                <div className="flex items-center mb-4">
                  <Target className="w-5 h-5 text-red-400 mr-2" />
                  <h3 className="text-lg font-medium text-white">Critical Moments</h3>
                </div>
                <div className="space-y-3">
                  {analysis.criticalMoments.map((move, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#2a2723]/50 border border-[#474239] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-[#a0958a] font-mono">
                          {Math.floor((move.ply + 1) / 2)}{move.ply % 2 === 1 ? '.' : '...'}
                        </span>
                        <span className="text-white font-medium">{move.san}</span>
                        {getClassificationIcon(move.accuracy?.classification || '')}
                      </div>
                      <div className="flex items-center space-x-2">
                        {move.accuracy && (
                          <span className={`text-sm font-medium ${getAccuracyColor(move.accuracy.accuracy)}`}>
                            {move.accuracy.accuracy.toFixed(1)}%
                          </span>
                        )}
                        <span className="text-sm text-[#a0958a]">
                          {move.evaluation.cp !== undefined ?
                            `${move.evaluation.cp > 0 ? '+' : ''}${(move.evaluation.cp / 100).toFixed(2)}` :
                            move.evaluation.mate ? `M${move.evaluation.mate}` : '0.00'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Footer */}
            <div className="text-center text-sm text-[#8a8276] pt-4 border-t border-[#474239]">
              Analysis completed with Stockfish 17
            </div>
          </div>
        )}
      </div>
    </div>
  );
};