'use client';

import { HandHeart, Flag, RotateCcw } from 'lucide-react';

interface GameControlsProps {
  game: {
    id: string;
    moves: string[];
    drawOffer?: 'white' | 'black';
    color: 'white' | 'black';
    ended: boolean;
    result?: string;
  };
  onDrawOffer: (gameId: string) => void;
  onDrawAccept: (gameId: string) => void;
  onDrawDecline: (gameId: string) => void;
  onResign: (gameId: string) => void;
  onAbort: (gameId: string) => void;
}

export function GameControls({ 
  game, 
  onDrawOffer, 
  onDrawAccept, 
  onDrawDecline, 
  onResign, 
  onAbort 
}: GameControlsProps) {
  const opponentColor = game.color === 'white' ? 'black' : 'white';
  const hasDrawOffer = !!game.drawOffer;
  const isDrawOfferedByOpponent = game.drawOffer === opponentColor;
  const isDrawOfferedByMe = game.drawOffer === game.color;
  const canAbort = game.moves.length < 2; // Can only abort before both players have moved
  const canOfferDraw = game.moves.length >= 2 && !hasDrawOffer && !game.ended;
  
  if (game.ended) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-600 text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-3">Game Over</h3>
          <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent mb-3">
            {formatGameResult(game.result, game.color)}
          </div>
          <div className="text-gray-400">
            {formatResultDescription(game.result)}
          </div>
        </div>
        
        <div className="space-y-3 flex-1">
          <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 rounded-lg font-semibold transition-all duration-200">
            Play Again
          </button>
          <button className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 py-3 rounded-lg font-semibold border border-gray-600 transition-all duration-200">
            Analyze Game
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      {/* Draw Offer Section */}
      {hasDrawOffer && (
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-600">
          <div className="text-center mb-4">
            <HandHeart className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white">
              {isDrawOfferedByOpponent ? 'Draw Offered' : 'Draw Offer Sent'}
            </h3>
            <p className="text-sm text-gray-400">
              {isDrawOfferedByOpponent 
                ? 'Your opponent is offering a draw' 
                : 'Waiting for opponent response'
              }
            </p>
          </div>
          
          {isDrawOfferedByOpponent && (
            <div className="flex space-x-3">
              <button
                onClick={() => onDrawAccept(game.id)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onDrawDecline(game.id)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Decline
              </button>
            </div>
          )}
          
          {isDrawOfferedByMe && (
            <div className="text-center text-sm text-gray-400">
              You can continue playing while waiting for a response
            </div>
          )}
        </div>
      )}
      
      {/* Game Actions */}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4">Game Actions</h3>
        
        <div className="space-y-3">
          {/* Draw Offer Button */}
          {canOfferDraw && (
            <button
              onClick={() => {
                console.log('🤝 Draw offer button clicked, gameId:', game.id);
                onDrawOffer(game.id);
              }}
              className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/50 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <HandHeart className="h-4 w-4" />
              <span>Offer Draw</span>
            </button>
          )}
          
          {/* Abort Button */}
          {canAbort && (
            <button
              onClick={() => {
                console.log('Abort button clicked, gameId:', game.id);
                onAbort(game.id);
              }}
              className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/50 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Abort Game</span>
            </button>
          )}
          
          {/* Resign Button */}
          <button
            onClick={() => {
              console.log('Resign button clicked, gameId:', game.id);
              onResign(game.id);
            }}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Flag className="h-4 w-4" />
            <span>Resign</span>
          </button>
        </div>
      </div>
      
      {/* Game Info */}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-600 flex-1">
        <h3 className="text-lg font-semibold text-white mb-4">Game Info</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Moves played:</span>
            <span className="text-white font-semibold">{game.moves.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Playing as:</span>
            <span className="text-white font-semibold capitalize flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                game.color === 'white' ? 'bg-white' : 'bg-gray-800 border border-gray-500'
              }`}></div>
              {game.color}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Game ID:</span>
            <span className="text-white font-mono text-xs">{game.id.slice(0, 8)}...</span>
          </div>
        </div>
        
        {/* Keyboard Shortcuts */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-white mb-3">Shortcuts</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">D</span>
              <span className="text-gray-300">Offer draw</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">R</span>
              <span className="text-gray-300">Resign</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Esc</span>
              <span className="text-gray-300">Clear</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">F</span>
              <span className="text-gray-300">Flip board</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatGameResult(result: string | undefined, playerColor: 'white' | 'black'): string {
  if (!result) return '';
  
  switch (result) {
    case '1-0':
      return playerColor === 'white' ? 'You Won!' : 'You Lost';
    case '0-1':
      return playerColor === 'black' ? 'You Won!' : 'You Lost';
    case '1/2-1/2':
      return 'Draw';
    case 'abort':
      return 'Game Aborted';
    case 'flag-white':
      return playerColor === 'white' ? 'You Lost on Time' : 'You Won on Time';
    case 'flag-black':
      return playerColor === 'black' ? 'You Lost on Time' : 'You Won on Time';
    case 'resign-white':
      return playerColor === 'white' ? 'You Resigned' : 'Opponent Resigned';
    case 'resign-black':
      return playerColor === 'black' ? 'You Resigned' : 'Opponent Resigned';
    default:
      return result;
  }
}

function formatResultDescription(result: string | undefined): string {
  if (!result) return '';
  
  switch (result) {
    case '1-0':
    case '0-1':
      return 'Checkmate';
    case '1/2-1/2':
      return 'Draw by agreement';
    case 'abort':
      return 'Game was aborted';
    case 'flag-white':
    case 'flag-black':
      return 'Time forfeit';
    case 'resign-white':
    case 'resign-black':
      return 'Resignation';
    default:
      return '';
  }
}