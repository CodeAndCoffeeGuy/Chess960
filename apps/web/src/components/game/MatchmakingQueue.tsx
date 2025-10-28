'use client';

import { useEffect, useState } from 'react';
import { Clock, Users, X } from 'lucide-react';
import type { TimeControl } from '@chess960/proto';

interface QueueState {
  timeControl: TimeControl;
  rated: boolean;
  estimatedWait: number;
  joinedAt: number;
}

interface MatchmakingQueueProps {
  queueState: QueueState | null;
  timeControl: TimeControl;
  isRated: boolean;
  onLeave: () => void;
}

export function MatchmakingQueue({ queueState, timeControl, isRated, onLeave }: MatchmakingQueueProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentWaitEstimate, setCurrentWaitEstimate] = useState(0);
  
  useEffect(() => {
    if (!queueState) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - queueState.joinedAt) / 1000);
      setElapsedTime(elapsed);
      
      // Update wait estimate (decreases as time passes, but has a minimum)
      const remaining = Math.max(1, queueState.estimatedWait - elapsed);
      setCurrentWaitEstimate(remaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [queueState]);
  
  if (!queueState) {
    return null;
  }
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getQueueMessage = (): string => {
    if (elapsedTime < 5) {
      return 'Looking for an opponent...';
    } else if (elapsedTime < 15) {
      return 'Searching for a suitable match...';
    } else if (elapsedTime < 30) {
      return 'Expanding search parameters...';
    } else {
      return 'Still searching for an opponent...';
    }
  };
  
  const getProgressPercentage = (): number => {
    if (queueState.estimatedWait === 0) return 0;
    const progress = (elapsedTime / queueState.estimatedWait) * 100;
    return Math.min(progress, 95); // Cap at 95% to avoid showing 100% without match
  };
  
  return (
    <div className="relative min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black overflow-hidden flex items-center justify-center p-4">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle grid */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          {/* Dark mode grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] light:hidden" />
          {/* Light mode grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:40px_40px] hidden light:block" />
        </div>
      </div>

      <div className="relative max-w-md w-full bg-[#2a2723]/70 light:bg-white/70 backdrop-blur-xl rounded-3xl border border-[#3e3a33] light:border-[#d4caba] shadow-2xl p-8 text-center">
        {/* Status */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-6">Finding Match</h2>
        <p className="text-[#b6aea2] light:text-[#5a5449] mb-6 text-base">{getQueueMessage()}</p>

        {/* Queue Info */}
        <div className="bg-[#35322e] light:bg-[#faf7f2] rounded-xl p-4 mb-6 border border-[#474239] light:border-[#d4caba]">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-[#a0958a] light:text-[#5a5449] text-xs mb-1">Time Control</div>
              <div className="font-bold text-xl text-orange-400">{timeControl}</div>
            </div>
            <div className="text-center">
              <div className="text-[#a0958a] light:text-[#5a5449] text-xs mb-1">Type</div>
              <div className="font-bold text-xl text-white light:text-black">{isRated ? 'Rated' : 'Casual'}</div>
            </div>
          </div>
        </div>

        {/* Timing Info */}
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center bg-[#35322e]/50 light:bg-[#faf7f2]/50 rounded-lg p-3 border border-[#474239] light:border-[#d4caba]">
            <Clock className="h-5 w-5 text-orange-400 mx-auto mb-1" />
            <div className="text-xs text-[#a0958a] light:text-[#5a5449] mb-1">Waiting</div>
            <div className="font-mono font-bold text-lg text-white light:text-black">
              {formatTime(elapsedTime)}
            </div>
          </div>

          <div className="text-center bg-[#35322e]/50 light:bg-[#faf7f2]/50 rounded-lg p-3 border border-[#474239] light:border-[#d4caba]">
            <Users className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <div className="text-xs text-[#a0958a] light:text-[#5a5449] mb-1">ETA</div>
            <div className="font-mono font-bold text-lg text-purple-400">
              {formatTime(currentWaitEstimate)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 px-4">
          <div className="bg-[#35322e]/50 light:bg-[#faf7f2]/50 rounded-lg p-3 border border-[#474239] light:border-[#d4caba]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#a0958a] light:text-[#5a5449]">Search Progress</span>
              <span className="text-xs text-[#a0958a] light:text-[#5a5449] font-mono">
                {Math.round(getProgressPercentage())}%
              </span>
            </div>
            <div className="w-full bg-[#474239] light:bg-[#d4caba] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onLeave}
          className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-lg"
        >
          <X className="h-4 w-4" />
          <span>Cancel Search</span>
        </button>

        {/* Long wait message */}
        {elapsedTime > 60 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="text-xs text-yellow-400">
              <strong>Taking longer than usual?</strong><br />
              <span className="text-[#b6aea2] light:text-[#5a5449]">Try switching to casual mode or different time control.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}