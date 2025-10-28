'use client';

import { Trash2, Info } from 'lucide-react';
import { useState } from 'react';

interface ArrowsControlProps {
  onClearArrows: () => void;
  arrowCount: number;
}

export function ArrowsControl({ onClearArrows, arrowCount }: ArrowsControlProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Arrow count and clear button */}
      {arrowCount > 0 && (
        <button
          onClick={onClearArrows}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#35322e] hover:bg-[#3a3632] border border-[#474239] rounded-lg text-xs font-semibold text-[#c1b9ad] hover:text-white transition-all"
          title="Clear all arrows (Ctrl+Shift+X)"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear {arrowCount} arrow{arrowCount !== 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Help toggle */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className={`p-1.5 rounded transition-all ${
          showHelp
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-[#35322e] hover:bg-[#3a3632] border border-[#474239] text-[#6b6460] hover:text-[#c1b9ad]'
        }`}
        title="Arrow drawing help"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {/* Help popup */}
      {showHelp && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-[#2a2723] border-2 border-[#474239] rounded-xl shadow-2xl p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Arrow Drawing</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-[#6b6460] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs text-[#c1b9ad]">
            <div>
              <div className="font-semibold text-white mb-1">Draw arrows:</div>
              <p>Right-click and drag from one square to another</p>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">Arrow colors:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Primary (right-click)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Secondary (Shift + right-click)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Tertiary (Ctrl + right-click)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">Highlight squares:</div>
              <p>Right-click a square (without dragging)</p>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">Remove:</div>
              <p>Right-click the same arrow/square again</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
