'use client';

import { useEffect } from 'react';

interface PromotionDialogProps {
  isOpen: boolean;
  playerColor: 'white' | 'black';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

export function PromotionDialog({
  isOpen,
  playerColor,
  onSelect,
  onCancel
}: PromotionDialogProps) {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      switch (e.key.toLowerCase()) {
        case 'q':
          onSelect('q');
          break;
        case 'r':
          onSelect('r');
          break;
        case 'b':
          onSelect('b');
          break;
        case 'n':
        case 'k': // k for knight (since n is not intuitive)
          onSelect('n');
          break;
        case 'escape':
          onCancel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSelect, onCancel]);

  if (!isOpen) return null;

  const pieces = [
    { type: 'q' as const, name: 'Queen', icon: '♕', key: 'Q' },
    { type: 'r' as const, name: 'Rook', icon: '♖', key: 'R' },
    { type: 'b' as const, name: 'Bishop', icon: '♗', key: 'B' },
    { type: 'n' as const, name: 'Knight', icon: '♘', key: 'N' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn"
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          className="bg-gradient-to-br from-[#2a2825] to-[#1f1d1a] border-2 border-[#474239] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Choose Promotion
            </h3>
            <p className="text-sm text-[#a0958a]">
              Select a piece to promote your pawn
            </p>
          </div>

          {/* Piece Selection Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {pieces.map((piece) => (
              <button
                key={piece.type}
                onClick={() => onSelect(piece.type)}
                className="group relative bg-[#35322e] hover:bg-[#3a3632] border-2 border-[#474239] hover:border-orange-500 rounded-xl p-6 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {/* Piece Icon */}
                <div className="text-center mb-3">
                  <span
                    className={`text-6xl ${
                      playerColor === 'white' ? 'text-white' : 'text-[#1a1a1a]'
                    } drop-shadow-lg`}
                    style={{
                      filter: playerColor === 'white'
                        ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        : 'drop-shadow(0 2px 4px rgba(255,255,255,0.3))',
                      WebkitTextStroke: playerColor === 'black' ? '1px #666' : 'none'
                    }}
                  >
                    {piece.icon}
                  </span>
                </div>

                {/* Piece Name */}
                <div className="text-center">
                  <div className="text-white font-semibold mb-1">
                    {piece.name}
                  </div>
                  <div className="text-xs text-[#8a8276] group-hover:text-orange-400 transition-colors">
                    Press <kbd className="px-1.5 py-0.5 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">{piece.key}</kbd>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10 transition-all duration-200" />
              </button>
            ))}
          </div>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full bg-[#35322e] hover:bg-[#3a3632] border border-[#474239] text-[#c1b9ad] hover:text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
          >
            Cancel <span className="text-xs text-[#6b6460]">(Esc)</span>
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
