'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Clock, User } from 'lucide-react';

interface GuestRating {
  rating: number;
  rd: number;
  vol: number;
}

interface GuestStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}

interface GuestGame {
  id: string;
  tc: string;
  result: string;
  opponent: string;
  ratingBefore: number;
  ratingAfter?: number;
}

interface GuestData {
  user: {
    id: string;
    handle: string;
    type: string;
  };
  ratings: Record<string, GuestRating>;
  stats: GuestStats;
  games: GuestGame[];
}

export function GuestProfile() {
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGuestData();
  }, []);

  const fetchGuestData = async () => {
    try {
      const response = await fetch('/api/guest/data');
      if (!response.ok) {
        throw new Error('Failed to fetch guest data');
      }
      
      const data = await response.json();
      setGuestData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result: string) => {
    if (result === '1-0' || result === 'checkmate-black') {
      return 'bg-green-500/20 border-green-500/40 text-green-400';
    } else if (result === '0-1' || result === 'checkmate-white') {
      return 'bg-red-500/20 border-red-500/40 text-red-400';
    } else {
      return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
    }
  };

  const getResultText = (result: string) => {
    if (result === '1-0' || result === 'checkmate-black') {
      return 'WIN';
    } else if (result === '0-1' || result === 'checkmate-white') {
      return 'LOSS';
    } else {
      return 'DRAW';
    }
  };

  const formatTimeControl = (tc: string) => {
    const timeMap: Record<string, string> = {
      '1+0': '1+0',
      '2+0': '2+0',
      '2+1': '2+1',
      '3+0': '3+0',
      '3+2': '3+2',
      '5+0': '5+0',
      '5+3': '5+3',
      '10+0': '10+0',
      '10+5': '10+5',
      '15+0': '15+0',
      '15+10': '15+10',
      '30+0': '30+0',
      '30+20': '30+20',
      '60+0': '60+0',
    };
    return timeMap[tc] || tc;
  };

  if (loading) {
    return (
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-[#35322e] light:bg-[#d4caba] rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#35322e] light:bg-[#d4caba] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6 text-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!guestData) {
    return (
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6 text-center">
        <p className="text-[#a0958a] light:text-[#5a5449]">No guest data available</p>
      </div>
    );
  }

  const { user, ratings, stats, games } = guestData;
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Guest User Info */}
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white light:text-black">Guest Session</h2>
        </div>
        <div className="text-[#a0958a] light:text-[#5a5449]">
          <p>Handle: <span className="text-white light:text-black font-semibold">{user.handle}</span></p>
          <p className="text-sm mt-1">Your progress is saved for this session only</p>
        </div>
      </div>

      {/* Current Ratings */}
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="h-6 w-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white light:text-black">Current Ratings</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(ratings).map(([tc, rating]) => (
            <div key={tc} className="bg-[#35322e] light:bg-white rounded-lg p-3 text-center">
              <div className="text-xs text-[#a0958a] light:text-[#5a5449] mb-1">{formatTimeControl(tc)}</div>
              <div className="text-lg font-bold text-white light:text-black">{rating.rating}</div>
              <div className="text-xs text-[#a0958a] light:text-[#5a5449]">±{rating.rd}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="h-6 w-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white light:text-black">Session Statistics</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#35322e] light:bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-[#a0958a] light:text-[#5a5449] mb-1">Games Played</div>
            <div className="text-2xl font-bold text-white light:text-black">{stats.gamesPlayed}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-xs text-green-300 mb-1">Wins</div>
            <div className="text-2xl font-bold text-green-400">{stats.gamesWon}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-xs text-red-300 mb-1">Losses</div>
            <div className="text-2xl font-bold text-red-400">{stats.gamesLost}</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
            <div className="text-xs text-yellow-300 mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-yellow-400">{winRate}%</div>
          </div>
        </div>
      </div>

      {/* Recent Games */}
      {games.length > 0 && (
        <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white light:text-black">Recent Games</h2>
          </div>
          <div className="space-y-2">
            {games.slice(0, 10).map((game) => (
              <div key={game.id} className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getResultColor(game.result)}`}>
                      {getResultText(game.result)}
                    </div>
                    <div className="text-white light:text-black text-sm">
                      vs {game.opponent.startsWith('guest_') ? 'Guest' : game.opponent}
                    </div>
                    <div className="text-[#a0958a] light:text-[#5a5449] text-xs">
                      {formatTimeControl(game.tc)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#a0958a] light:text-[#5a5449]">
                      {game.ratingBefore} → {game.ratingAfter || game.ratingBefore}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
