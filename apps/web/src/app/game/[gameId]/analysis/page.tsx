'use client';

import React, { useState, useEffect, use } from 'react';
import { Chess } from 'chess.js';
import { PostGameReport } from '@/components/analysis';
// import { ArrowLeft, Download, Share2, Eye } from 'lucide-react';
import Link from 'next/link';

interface GameAnalysisPageProps {
  params: Promise<{
    gameId: string;
  }>;
}

interface GameData {
  id: string;
  tc: string;
  result: string;
  rated: boolean;
  startedAt: string;
  endedAt: string | null;
  whiteId: string;
  blackId: string;
  whiteHandle: string;
  blackHandle: string;
  whiteRatingBefore: number;
  blackRatingBefore: number;
  whiteRatingAfter: number;
  blackRatingAfter: number;
  moves: string[];
  moveCount: number;
  duration: number | null;
  initialFen?: string;
}

export default function GameAnalysisPage({ params }: GameAnalysisPageProps) {
  const { gameId } = use(params);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch(`/api/game/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game data');
        }
        const data = await response.json();
        setGameData(data.game);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#1f1d1a] text-white overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="relative min-h-screen bg-[#1f1d1a] text-white overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-[#a0958a]">{error || 'Game not found'}</p>
          <Link href="/" className="mt-4 inline-block px-6 py-2 bg-orange-400 rounded-lg hover:bg-orange-300">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Convert UCI moves to proper PGN format
  const movesToPgn = (uciMoves: string[], gameData: GameData) => {
    const chess = new Chess(gameData.initialFen);
    const sanMoves: string[] = [];

    // Convert each UCI move to SAN
    for (const uciMove of uciMoves) {
      try {
        const from = uciMove.slice(0, 2);
        const to = uciMove.slice(2, 4);
        const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

        const move = chess.move({
          from,
          to,
          promotion
        });

        if (move) {
          sanMoves.push(move.san);
        }
      } catch (error) {
        console.error('Failed to convert move:', uciMove, error);
      }
    }

    // Convert result to standard PGN format
    const convertResult = (result: string): string => {
      if (result === '1-0' || result === '0-1' || result === '1/2-1/2') {
        return result;
      }
      // Handle various result formats
      if (result.includes('white') || result === 'resign-black' || result === 'flag-black') {
        return '1-0';
      }
      if (result.includes('black') || result === 'resign-white' || result === 'flag-white') {
        return '0-1';
      }
      if (result.includes('draw') || result === 'abort') {
        return '1/2-1/2';
      }
      return '*'; // Unknown or ongoing
    };

    const pgnResult = convertResult(gameData.result);

    // Build proper PGN with headers
    const headers = [
      `[Event "Chess960 Game"]`,
      `[Site "BulletChess.org"]`,
      `[Date "${new Date(gameData.startedAt).toISOString().split('T')[0].replace(/-/g, '.')}"]`,
      `[White "${gameData.whiteHandle}"]`,
      `[Black "${gameData.blackHandle}"]`,
      `[Result "${pgnResult}"]`,
      `[TimeControl "${gameData.tc}"]`,
      `[WhiteElo "${gameData.whiteRatingBefore}"]`,
      `[BlackElo "${gameData.blackRatingBefore}"]`,
      ''
    ].join('\n');

    // Build move text with proper formatting
    const moveText = sanMoves.map((move, i) => {
      if (i % 2 === 0) {
        return `${Math.floor(i / 2) + 1}. ${move}`;
      }
      return move;
    }).join(' ');

    return headers + moveText + ' ' + pgnResult;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // Show notification
    alert('Game link copied to clipboard!');
  };

  const handleDownloadPGN = () => {
    const pgn = movesToPgn(gameData.moves, gameData);
    const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${gameData.id}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatResult = (result: string): string => {
    if (result === '1-0') return 'White wins';
    if (result === '0-1') return 'Black wins';
    if (result === '1/2-1/2') return 'Draw';
    if (result.includes('white') || result === 'resign-black' || result === 'flag-black') return 'White wins';
    if (result.includes('black') || result === 'resign-white' || result === 'flag-white') return 'Black wins';
    if (result.includes('draw')) return 'Draw';
    if (result === 'abort') return 'Aborted';
    return 'In Progress';
  };

  return (
    <div className="relative min-h-screen bg-[#1f1d1a] text-white overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.35), rgba(234,88,12,0.15) 45%, transparent 60%)' }} />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      </div>
      <div className="relative container mx-auto px-4 py-4 max-w-7xl">
        {/* Game Header with Actions */}
        <div className="mb-6 bg-[#2a2825] border border-[#3a3632] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Game Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Game Analysis</h1>
              <div className="flex items-center gap-4 text-sm text-[#a0958a]">
                <span>
                  <span className="font-semibold text-white">{gameData.whiteHandle}</span> vs{' '}
                  <span className="font-semibold text-white">{gameData.blackHandle}</span>
                </span>
                <span>•</span>
                <span>{formatResult(gameData.result)}</span>
                <span>•</span>
                <span>{gameData.tc}</span>
                {gameData.rated && <span className="px-2 py-0.5 bg-orange-600/20 text-orange-400 rounded text-xs">Rated</span>}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="bg-[#3a3632] hover:bg-[#474239] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Share game link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={handleDownloadPGN}
                className="bg-[#3a3632] hover:bg-[#474239] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Download PGN file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PGN
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Analysis Report - includes board and analysis */}
          <PostGameReport
            gameId={gameId}
            pgn={movesToPgn(gameData.moves, gameData)}
            playerWhite={{ name: gameData.whiteHandle, rating: gameData.whiteRatingBefore }}
            playerBlack={{ name: gameData.blackHandle, rating: gameData.blackRatingBefore }}
            timeControl={gameData.tc}
            initialFen={gameData.initialFen}
            onAnalysisComplete={() => {}}
          />
        </div>
      </div>
    </div>
  );
}