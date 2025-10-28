'use client';

import { Trophy, TrendingUp, TrendingDown, Minus, Download, Share2, Copy } from 'lucide-react';
import { useState } from 'react';
import { generatePGN, downloadPGN, generateGameLink, copyToClipboard, getCurrentFEN } from '@/utils/gameExport';

interface GameResultModalProps {
  result: string | undefined;
  playerColor: 'white' | 'black';
  playerRatingBefore: number;
  playerRatingAfter: number;
  opponentHandle: string;
  opponentRatingBefore: number;
  onPlayAgain: () => void;
  onAnalyze: () => void;
  onClose: () => void;
  // Export data
  gameId?: string;
  moves?: string[];
  timeControl?: string;
  rated?: boolean;
  whiteHandle?: string;
  blackHandle?: string;
  opening?: {
    name: string;
    eco: string;
  };
  // Rematch handlers
  onOfferRematch?: () => void;
  onAcceptRematch?: () => void;
  onDeclineRematch?: () => void;
  rematchOffered?: boolean;
  rematchOfferFrom?: 'me' | 'opponent' | null;
}

export function GameResultModal({
  result,
  playerColor,
  playerRatingBefore,
  playerRatingAfter,
  opponentHandle,
  opponentRatingBefore,
  onPlayAgain,
  onAnalyze,
  onClose,
  gameId,
  moves = [],
  timeControl,
  rated = true,
  whiteHandle,
  blackHandle,
  opening,
  onOfferRematch,
  onAcceptRematch,
  onDeclineRematch,
  rematchOffered = false,
  rematchOfferFrom = null
}: GameResultModalProps) {
  console.log('GameResultModal rendered with:', { result, playerColor, playerRatingBefore, playerRatingAfter });
  console.log('GameResultModal rematch props:', {
    onOfferRematch: !!onOfferRematch,
    onAcceptRematch: !!onAcceptRematch,
    onDeclineRematch: !!onDeclineRematch,
    rematchOffered,
    rematchOfferFrom
  });

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!result) {
    console.log('No result, modal not showing');
    return null;
  }

  // Export handlers
  const handleDownloadPGN = () => {
    if (!moves || moves.length === 0) return;

    const pgn = generatePGN({
      moves,
      whitePlayer: whiteHandle || (playerColor === 'white' ? 'You' : opponentHandle),
      blackPlayer: blackHandle || (playerColor === 'black' ? 'You' : opponentHandle),
      result: result,
      timeControl,
      rated,
      opening
    });

    downloadPGN(pgn, `game-${gameId || Date.now()}.pgn`);
    showCopyFeedback('PGN downloaded');
  };

  const handleCopyLink = async () => {
    if (!gameId) return;
    const link = generateGameLink(gameId);
    const success = await copyToClipboard(link);
    showCopyFeedback(success ? 'Link copied' : 'Failed to copy');
  };

  const handleCopyFEN = async () => {
    if (!moves || moves.length === 0) return;
    const fen = getCurrentFEN(moves);
    const success = await copyToClipboard(fen);
    showCopyFeedback(success ? 'FEN copied' : 'Failed to copy');
  };

  const showCopyFeedback = (message: string) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Check if player won
  const didWin =
    (result === '1-0' && playerColor === 'white') ||
    (result === '0-1' && playerColor === 'black') ||
    (result?.includes('flag') && (
      (result === 'flag-white' && playerColor === 'black') ||
      (result === 'flag-black' && playerColor === 'white')
    )) ||
    (result?.includes('resign') && (
      (result === 'resign-white' && playerColor === 'black') ||
      (result === 'resign-black' && playerColor === 'white')
    )) ||
    result?.toLowerCase().includes('win');

  const isDraw = result === '1/2-1/2' || result === 'draw';

  const ratingChange = playerRatingAfter - playerRatingBefore;
  const ratingChangeAbs = Math.abs(ratingChange);

  const getResultTitle = () => {
    if (isDraw) return 'Draw';
    return didWin ? 'Victory!' : 'Defeat';
  };

  const getResultColor = () => {
    if (isDraw) return 'text-yellow-400';
    return didWin ? 'text-green-400' : 'text-red-400';
  };

  const getResultDescription = () => {
    switch (result) {
      case '1-0':
        return playerColor === 'white' ? 'You delivered checkmate' : 'Checkmate - you were mated';
      case '0-1':
        return playerColor === 'black' ? 'You delivered checkmate' : 'Checkmate - you were mated';
      case 'flag-white':
        return playerColor === 'black' ? 'White flagged - time ran out' : 'You ran out of time';
      case 'flag-black':
        return playerColor === 'white' ? 'Black flagged - time ran out' : 'You ran out of time';
      case 'resign-white':
        return playerColor === 'black' ? 'White resigned' : 'You resigned';
      case 'resign-black':
        return playerColor === 'white' ? 'Black resigned' : 'You resigned';
      case '1/2-1/2':
      case 'draw':
        return 'Draw by mutual agreement';
      case 'draw-threefold':
        return 'Draw by threefold repetition';
      case 'draw-fifty':
        return 'Draw by fifty-move rule';
      case 'draw-stalemate':
        return 'Draw by stalemate';
      case 'draw-insufficient':
        return 'Draw by insufficient material';
      case 'abort':
        return 'Game aborted - too few moves';
      default:
        return result || 'Game ended';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#2a2723] border-2 border-[#474239] rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        {/* Result Header */}
        <div className="text-center mb-6">
          <h2 className={`text-3xl font-bold ${getResultColor()} mb-2`}>
            {getResultTitle()}
          </h2>
          <p className="text-[#a0958a] text-sm">{getResultDescription()}</p>
        </div>

        {/* Rating Change */}
        <div className="bg-[#35322e] border border-[#474239] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#a0958a]">Rating Change</span>
            <div className="flex items-center space-x-2">
              {ratingChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : ratingChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-lg font-bold ${
                ratingChange > 0 ? 'text-green-400' :
                ratingChange < 0 ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {ratingChange > 0 ? '+' : ''}{ratingChange}
              </span>
              {ratingChangeAbs > 0 && (
                <span className="text-xs text-[#a0958a] ml-2">
                  ({ratingChangeAbs} points)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white font-semibold">You</span>
              <span className="text-xs text-[#a0958a]">({playerRatingBefore})</span>
            </div>
            <div className="text-xl font-bold text-white">
              {playerRatingAfter}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#474239]">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white font-semibold">{opponentHandle}</span>
              <span className="text-xs text-[#a0958a]">({opponentRatingBefore})</span>
            </div>
          </div>
        </div>

        {/* Rematch Offer UI */}
        {rematchOffered && rematchOfferFrom === 'opponent' && (
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-500/50 rounded-xl p-4 mb-4 shadow-xl">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-orange-300 mb-1">Rematch Offered</div>
              <div className="text-xs text-orange-200">{opponentHandle} wants a rematch</div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('[GameResultModal] Accept rematch button clicked! Calling onAcceptRematch...');
                  onAcceptRematch?.();
                }}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all duration-200"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  console.log('[GameResultModal] Decline rematch button clicked! Calling onDeclineRematch...');
                  onDeclineRematch?.();
                }}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-3 rounded-lg font-bold transition-all duration-200"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {rematchOffered && rematchOfferFrom === 'me' && (
          <div className="bg-blue-600/20 border border-blue-500/40 rounded-xl p-3 mb-4 text-center">
            <div className="text-sm text-blue-300">Rematch offer sent - waiting for {opponentHandle}</div>
          </div>
        )}

        {/* Export Buttons */}
        {moves && moves.length > 0 && (
          <div className="bg-[#35322e] border border-[#474239] rounded-xl p-3 mb-4">
            <div className="text-xs font-semibold text-[#a0958a] mb-2">Export Game</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDownloadPGN}
                className="bg-[#474239] hover:bg-[#524d43] text-white py-2 px-3 rounded-lg text-xs font-semibold border border-[#5a554a] transition-all duration-200 flex items-center justify-center space-x-1"
                title="Download game as PGN file"
              >
                <Download className="w-3 h-3" />
                <span>PGN</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="bg-[#474239] hover:bg-[#524d43] text-white py-2 px-3 rounded-lg text-xs font-semibold border border-[#5a554a] transition-all duration-200 flex items-center justify-center space-x-1"
                title="Copy shareable game link"
              >
                <Share2 className="w-3 h-3" />
                <span>Link</span>
              </button>
              <button
                onClick={handleCopyFEN}
                className="bg-[#474239] hover:bg-[#524d43] text-white py-2 px-3 rounded-lg text-xs font-semibold border border-[#5a554a] transition-all duration-200 flex items-center justify-center space-x-1"
                title="Copy position as FEN"
              >
                <Copy className="w-3 h-3" />
                <span>FEN</span>
              </button>
            </div>
            {/* Copy Feedback */}
            {copyFeedback && (
              <div className="mt-2 text-xs text-center text-green-400 font-semibold animate-in fade-in duration-200">
                {copyFeedback}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Show Rematch button if handler provided and no offer sent yet */}
          {onOfferRematch && !rematchOffered && (
            <button
              onClick={() => {
                console.log('[GameResultModal] Rematch button clicked! Calling onOfferRematch...');
                onOfferRematch();
              }}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>Offer Rematch</span>
            </button>
          )}

          {/* Show Play Again (queue) button if no rematch handler or offer already sent */}
          {(!onOfferRematch || rematchOffered) && (
            <button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>New Game</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAnalyze}
              className="bg-[#35322e] hover:bg-[#3e3a33] text-white py-3 rounded-lg font-semibold border border-[#474239] transition-all duration-200"
            >
              Analyze
            </button>
            <button
              onClick={onClose}
              className="bg-[#35322e] hover:bg-[#3e3a33] text-white py-3 rounded-lg font-semibold border border-[#474239] transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
