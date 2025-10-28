'use client';

import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MoveAnalysis {
  move: string;
  evaluation: number;
  bestMove: string;
  accuracy?: number;
  classification?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

interface GameAnalysisData {
  moves: MoveAnalysis[];
  averageAccuracy: {
    white: number;
    black: number;
  };
  gameResult: string;
  openingName?: string;
}

interface GameAnalysisPanelProps {
  pgn?: string;
  moves?: string[];
  onAnalysisComplete?: (analysis: GameAnalysisData) => void;
  className?: string;
}

export const GameAnalysisPanel: React.FC<GameAnalysisPanelProps> = ({
  pgn,
  moves,
  onAnalysisComplete,
  className
}) => {
  const [analysis, setAnalysis] = useState<GameAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const analyzeGame = async () => {
    if (!pgn && !moves) {
      setError('No game data provided');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analysis/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pgn,
          moves,
          depth: 12
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Analysis failed');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Game analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationIcon = (classification?: string) => {
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
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getClassificationColor = (classification?: string) => {
    switch (classification) {
      case 'excellent':
      case 'good':
        return 'text-green-400';
      case 'inaccuracy':
        return 'text-yellow-400';
      case 'mistake':
        return 'text-orange-400';
      case 'blunder':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-400';
    if (accuracy >= 85) return 'text-blue-400';
    if (accuracy >= 70) return 'text-yellow-400';
    if (accuracy >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`game-analysis-panel ${className || ''}`}>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Game Analysis</h3>
          <button
            onClick={analyzeGame}
            disabled={loading || (!pgn && !moves)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Game'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-gray-400">Analyzing game...</span>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Game Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">White Accuracy</h4>
                <div className={`text-2xl font-bold ${getAccuracyColor(analysis.averageAccuracy.white)}`}>
                  {analysis.averageAccuracy.white.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Black Accuracy</h4>
                <div className={`text-2xl font-bold ${getAccuracyColor(analysis.averageAccuracy.black)}`}>
                  {analysis.averageAccuracy.black.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Game Result</h4>
                <div className="text-2xl font-bold text-white">
                  {analysis.gameResult}
                </div>
              </div>
            </div>

            {analysis.openingName && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Opening</h4>
                <div className="text-lg text-white">{analysis.openingName}</div>
              </div>
            )}

            {/* Move List */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-lg font-medium text-white mb-4">Move Analysis</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analysis.moves.map((move, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm font-mono w-8">
                        {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                      </span>
                      <span className={`font-medium ${getClassificationColor(move.classification)}`}>{move.move}</span>
                      {getClassificationIcon(move.classification)}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {move.accuracy && (
                        <span className={`text-sm font-medium ${getAccuracyColor(move.accuracy)}`}>
                          {move.accuracy.toFixed(1)}%
                        </span>
                      )}
                      <span className="text-sm text-gray-400">
                        Best: {move.bestMove}
                      </span>
                      <span className={`text-sm ${move.evaluation > 0 ? 'text-green-400' : move.evaluation < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                        {move.evaluation > 0 ? '+' : ''}{move.evaluation.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};