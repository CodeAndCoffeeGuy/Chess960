'use client';

import { Book } from 'lucide-react';

interface OpeningDisplayProps {
  opening?: {
    name: string;
    eco: string;
  };
  chess960Position?: number;
  compact?: boolean;
}

export function OpeningDisplay({ opening, chess960Position, compact = false }: OpeningDisplayProps) {
  if (!opening && !chess960Position) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {opening && (
          <div className="flex items-center gap-1.5 text-[#c1b9ad]">
            <Book className="h-4 w-4 text-orange-400" />
            <span className="font-semibold">{opening.eco}</span>
            <span className="text-[#6b6460]">•</span>
            <span>{opening.name}</span>
          </div>
        )}
        {chess960Position && (
          <div className="flex items-center gap-1.5 text-[#c1b9ad]">
            <span className="text-[#6b6460]">•</span>
            <span className="font-mono text-orange-400">#{chess960Position}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#35322e] border border-[#474239] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-lg">
          <Book className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1">
          {opening && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                  {opening.eco}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">
                {opening.name}
              </h3>
            </div>
          )}

          {chess960Position && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b6460] uppercase tracking-wide">
                Chess960 Position
              </span>
              <span className="text-sm font-mono font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                #{chess960Position}
              </span>
            </div>
          )}

          {!opening && chess960Position && (
            <p className="text-sm text-[#a0958a] mt-1">
              Fischer Random Chess starting position
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
