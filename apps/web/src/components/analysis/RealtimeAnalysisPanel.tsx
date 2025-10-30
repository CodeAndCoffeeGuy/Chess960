'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StockfishBrowser } from '@chess960/stockfish/browser';
import { ChevronDown, ChevronUp, Brain, Sparkles, AlertCircle } from 'lucide-react';
import { Chess } from 'chess.js';
import type { PositionAnalysis } from '@chess960/stockfish';

interface RealtimeAnalysisPanelProps {
  fen: string;
  playerColor: 'white' | 'black';
  enabled?: boolean;
  depth?: number;
  className?: string;
}

export const RealtimeAnalysisPanel: React.FC<RealtimeAnalysisPanelProps> = ({
  fen,
  playerColor,
  enabled = true,
  depth = 15,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<PositionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [depthReached, setDepthReached] = useState(0);
  
  const engineRef = useRef<StockfishBrowser | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentFenRef = useRef<string>(fen);

  // Initialize engine
  useEffect(() => {
    if (!enabled) return;

    const initEngine = async () => {
      try {
        if (!engineRef.current) {
          engineRef.current = new StockfishBrowser();
          // Give engine time to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error('Failed to initialize Stockfish:', err);
        setError('Failed to initialize analysis engine');
      }
    };

    initEngine();

    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch (e) {
          console.error('Error destroying engine:', e);
        }
        engineRef.current = null;
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [enabled]);

  // Analyze position when FEN changes
  useEffect(() => {
    if (!enabled || !engineRef.current || fen === currentFenRef.current) {
      return;
    }

    currentFenRef.current = fen;
    
    // Debounce analysis to avoid too many requests
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    setLoading(true);
    setError('');
    setDepthReached(0);

    analysisTimeoutRef.current = setTimeout(async () => {
      try {
        if (!engineRef.current) return;

        const result = await engineRef.current.getPositionEvaluation(fen, depth);
        
        // Adjust evaluation based on player color
        const adjustedEval = playerColor === 'black' ? -result.evaluation : result.evaluation;
        
        setAnalysis({
          ...result,
          evaluation: adjustedEval
        });
        setDepthReached(result.depth);
      } catch (err) {
        console.error('Analysis error:', err);
        setError('Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [fen, enabled, depth, playerColor]);

  const formatEvaluation = useCallback((evaluation: number, mate?: number): string => {
    if (mate !== undefined) {
      return `M${Math.abs(mate)}`;
    }
    if (evaluation > 0) {
      return `+${(evaluation / 100).toFixed(1)}`;
    }
    return (evaluation / 100).toFixed(1);
  }, []);

  const formatMove = useCallback((uci: string): string => {
    try {
      const chess = new Chess(currentFenRef.current);
      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      const promotion = uci.length === 5 ? uci[4] : undefined;
      
      const move = chess.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined
      });
      
      return move ? move.san : uci;
    } catch {
      return uci;
    }
  }, []);

  const getEvaluationColor = (eval: number): string => {
    if (eval > 100) return 'text-green-400';
    if (eval > 50) return 'text-green-300';
    if (eval > -50) return 'text-gray-300';
    if (eval > -100) return 'text-red-300';
    return 'text-red-400';
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className={`bg-[#2a2825] border border-[#3a3632] rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#3a3632] transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-white">Engine Analysis</span>
          {loading && (
            <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {depthReached > 0 && !loading && (
            <span className="text-xs text-gray-400">Depth: {depthReached}</span>
          )}
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 border-t border-[#3a3632]">
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm mb-3 p-2 bg-red-500/10 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {loading && !analysis && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
              <span className="text-sm text-gray-400">Analyzing position...</span>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Evaluation */}
              <div className="bg-[#1f1d1a] rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Evaluation</div>
                <div className={`text-2xl font-bold ${getEvaluationColor(analysis.evaluation)}`}>
                  {formatEvaluation(analysis.evaluation, analysis.mate)}
                </div>
                {analysis.mate && (
                  <div className="text-xs text-orange-400 mt-1">
                    {analysis.mate > 0 ? 'White' : 'Black'} is winning
                  </div>
                )}
              </div>

              {/* Best Move */}
              {analysis.bestMove && (
                <div className="bg-[#1f1d1a] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Best Move</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-mono text-white font-semibold">
                      {formatMove(analysis.bestMove)}
                    </span>
                    {analysis.pv && analysis.pv.length > 0 && (
                      <span className="text-sm text-gray-400">
                        {analysis.pv.slice(0, 5).map((move, i) => (
                          <span key={i} className="font-mono">
                            {i > 0 ? ' ' : ''}{formatMove(move)}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Principal Variation */}
              {analysis.pv && analysis.pv.length > 1 && (
                <div className="bg-[#1f1d1a] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Line</div>
                  <div className="text-sm text-gray-300 font-mono">
                    {analysis.pv.slice(1, 8).map((move, i) => (
                      <span key={i}>
                        {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}
                        {formatMove(move)}{i < analysis.pv!.length - 2 ? ' ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
