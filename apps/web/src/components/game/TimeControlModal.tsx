'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TimeControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSpeed?: 'bullet' | 'blitz' | 'rapid' | 'classical';
  userRating?: number;
  onLobbyCreated?: () => void;
  onError?: (error: string) => void;
}

type Speed = 'bullet' | 'blitz' | 'rapid' | 'classical';

// Default time controls for each speed category
const DEFAULT_TIME_CONTROLS = {
  bullet: { minutes: 1, increment: 0 },
  blitz: { minutes: 3, increment: 0 },
  rapid: { minutes: 10, increment: 0 },
  classical: { minutes: 30, increment: 0 },
};

export function TimeControlModal({ isOpen, onClose, defaultSpeed = 'bullet', userRating = 1500, onLobbyCreated, onError }: TimeControlModalProps) {
  const router = useRouter();
  const [minutes, setMinutes] = useState<number>(DEFAULT_TIME_CONTROLS[defaultSpeed].minutes);
  const [increment, setIncrement] = useState<number>(DEFAULT_TIME_CONTROLS[defaultSpeed].increment);
  const [isRated, setIsRated] = useState(true);
  const [ratingRange, setRatingRange] = useState(200);

  // Update time controls when modal opens or defaultSpeed changes
  useEffect(() => {
    if (isOpen) {
      setMinutes(DEFAULT_TIME_CONTROLS[defaultSpeed].minutes);
      setIncrement(DEFAULT_TIME_CONTROLS[defaultSpeed].increment);
    }
  }, [isOpen, defaultSpeed]);

  if (!isOpen) return null;

  // Convert minutes to seconds
  const totalSeconds = Math.round(minutes * 60);
  const displayMinutes = totalSeconds >= 60 ? Math.floor(totalSeconds / 60) : 0;
  const displaySeconds = totalSeconds % 60;

  // Format time control string
  const timeControl = totalSeconds >= 60
    ? `${displayMinutes}+${increment}`
    : `${totalSeconds}s+${increment}`;

  // Calculate actual speed category using formula
  const estimatedTime = totalSeconds + (increment * 40);
  let actualSpeed: Speed;
  if (estimatedTime < 180) actualSpeed = 'bullet';
  else if (estimatedTime < 480) actualSpeed = 'blitz';
  else if (estimatedTime < 1500) actualSpeed = 'rapid';
  else actualSpeed = 'classical';

  const speedColors = {
    bullet: 'text-yellow-500',
    blitz: 'text-orange-300',
    rapid: 'text-green-500',
    classical: 'text-blue-500',
  };

  const handleQuickPlay = () => {
    const params = new URLSearchParams({
      tc: timeControl,
      rated: isRated.toString(),
      autoJoin: 'true',
    });
    router.push(`/play?${params.toString()}`);
    onClose();
  };

  const handleCreateLobby = async () => {
    try {
      const response = await fetch('/api/lobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeControl,
          rated: isRated,
          minRating: Math.max(0, userRating - ratingRange),
          maxRating: userRating + ratingRange,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create lobby:', error);
        // Let the parent component handle the error display
        if (onError) {
          onError(error.error || 'Failed to create lobby');
        }
        return;
      }

      const data = await response.json();
      console.log('Lobby created:', data);

      // Notify parent component
      if (onLobbyCreated) {
        onLobbyCreated();
      } else {
        // Fallback: redirect to lobby page
        router.push('/lobby');
        onClose();
      }
    } catch (error) {
      console.error('Error creating lobby:', error);
      if (onError) {
        onError('Failed to create lobby');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#2a2723] light:bg-white border-2 border-[#474239] light:border-[#d4caba] rounded-2xl shadow-2xl max-w-lg w-full p-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white light:text-black">
            Game Setup
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#a0958a] light:text-[#5a5449] hover:text-white light:hover:text-black hover:bg-[#35322e] light:hover:bg-[#f0ebe0] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Control Display */}
        <div className="mb-4 bg-[#35322e] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg p-3 text-center">
          <div className="text-xs text-[#a0958a] light:text-[#5a5449] mb-1">Time Control</div>
          <div className="font-mono text-3xl font-bold text-white light:text-black">{timeControl}</div>
          <div className={`text-sm font-semibold capitalize mt-1 ${speedColors[actualSpeed]}`}>
            {actualSpeed}
          </div>
          {displaySeconds > 0 && (
            <div className="text-xs text-[#a0958a] light:text-[#5a5449] mt-1">
              {displayMinutes > 0 && `${displayMinutes}m `}{displaySeconds}s + {increment}s increment
            </div>
          )}
        </div>

        {/* Minutes Slider */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#a0958a] light:text-[#5a5449] mb-2">
            Time: {minutes < 1 ? `${totalSeconds} sec` : `${Math.round(minutes)} min`}
          </label>
          <input
            type="range"
            min="0.25"
            max="60"
            step="0.25"
            value={minutes}
            onChange={(e) => {
              const val = Number(e.target.value);
              // Only allow fractional values under 1 minute
              setMinutes(val >= 1 ? Math.round(val) : val);
            }}
            className="w-full h-2 bg-[#474239] light:bg-[#d4caba] rounded-lg appearance-none cursor-pointer accent-orange-300"
          />
        </div>

        {/* Increment Slider */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#a0958a] light:text-[#5a5449] mb-2">
            Increment: {increment} sec
          </label>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={increment}
            onChange={(e) => setIncrement(Number(e.target.value))}
            className="w-full h-2 bg-[#474239] light:bg-[#d4caba] rounded-lg appearance-none cursor-pointer accent-orange-300"
          />
        </div>

        {/* Rated Toggle */}
        <div className="mb-4 bg-[#35322e] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg p-3">
          <button
            onClick={() => setIsRated(!isRated)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isRated}
                onChange={() => setIsRated(!isRated)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-orange-300 bg-[#2b2824] light:bg-white border-[#4a453e] light:border-[#d4caba] rounded focus:ring-orange-300 light:focus:ring-[#ffa366] focus:ring-2 accent-orange-300 light:accent-[#ffa366]"
              />
              <span className="font-semibold text-white light:text-black">Rated</span>
            </div>
            <span className="text-sm text-[#a0958a] light:text-[#5a5449]">
              {isRated ? 'Affects rating' : 'Casual play'}
            </span>
          </button>
        </div>

        {/* Rating Range */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#a0958a] light:text-[#5a5449] mb-2">
            Rating Range: ±{ratingRange}
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="50"
            value={ratingRange}
            onChange={(e) => setRatingRange(Number(e.target.value))}
            className="w-full h-2 bg-[#474239] light:bg-[#d4caba] rounded-lg appearance-none cursor-pointer accent-orange-300"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleQuickPlay}
            className="flex-1 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] hover:scale-105"
          >
            Play
          </button>
          <button
            onClick={handleCreateLobby}
            className="flex-1 bg-[#35322e] light:bg-[#faf7f2] border-2 border-[#474239] light:border-[#d4caba] text-white light:text-black font-bold py-3 rounded-lg transition-all duration-200 hover:border-orange-300"
          >
            Create Lobby
          </button>
        </div>

        {/* Lobby Link */}
        <div className="mt-3 text-center">
          <button
            onClick={() => {
              router.push('/lobby');
              onClose();
            }}
            className="text-sm text-orange-300 hover:text-orange-200 underline"
          >
            View all lobbies
          </button>
        </div>
      </div>
    </div>
  );
}
