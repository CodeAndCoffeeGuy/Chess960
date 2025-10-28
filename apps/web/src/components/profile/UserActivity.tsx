'use client';

import { useState, useEffect } from 'react';
import { Activity, Eye, Trophy } from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: string;
  whiteId: string;
  blackId: string;
  result: string | null;
  tc: string;
  whiteRatingBefore: number | null;
  whiteRatingAfter: number | null;
  blackRatingBefore: number | null;
  blackRatingAfter: number | null;
  white: {
    id: string;
    handle: string;
    fullName: string | null;
  };
  black: {
    id: string;
    handle: string;
    fullName: string | null;
  };
}

interface DayActivity {
  date: string;
  games: Game[];
  wins: number;
  losses: number;
  draws: number;
  ratingBefore: number | null;
  ratingAfter: number | null;
  tc: string;
}

interface ActiveGame {
  id: string;
  tc: string;
  white: {
    id: string;
    handle: string;
    fullName: string | null;
  };
  black: {
    id: string;
    handle: string;
    fullName: string | null;
  };
}

interface UserActivityProps {
  handle: string;
  userId?: string;
}

export function UserActivity({ handle, userId }: UserActivityProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchActivity();
  }, [handle]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/user/${handle}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActiveGame(data.activeGame);
        setDailyActivity(data.dailyActivity);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOpponent = (game: Game | ActiveGame) => {
    if (!userId) return null;
    return game.white.id === userId ? game.black : game.white;
  };

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="bg-[#35322e]/50 light:bg-white/50 backdrop-blur-sm rounded-2xl border border-[#474239] light:border-[#d4caba] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white light:text-black">Activity</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#35322e]/50 light:bg-white/50 backdrop-blur-sm rounded-2xl border border-[#474239] light:border-[#d4caba] p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white light:text-black">Activity</h2>
      </div>

      {/* Active Game */}
      {activeGame && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-bold mb-1 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Playing Now
              </p>
              <p className="text-white light:text-black">
                vs {getOpponent(activeGame)?.handle}
                <span className="text-[#a0958a] ml-2">• {activeGame.tc}</span>
              </p>
            </div>
            <Link
              href={`/game/${activeGame.id}/spectate`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Watch</span>
            </Link>
          </div>
        </div>
      )}

      {/* Daily Activity */}
      <div className="space-y-4">
        {dailyActivity.length === 0 ? (
          <p className="text-[#a0958a] light:text-[#5a5449] text-center py-4">No recent activity</p>
        ) : (
          dailyActivity.map((day) => (
            <div key={day.date} className="border-b border-[#3e3a33] light:border-[#d4caba] last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white light:text-black font-medium">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">{day.wins}W</span>
                  <span className="text-red-400">{day.losses}L</span>
                  {day.draws > 0 && <span className="text-[#a0958a]">{day.draws}D</span>}
                </div>
              </div>

              {day.ratingAfter !== null && (
                <p className="text-sm text-[#a0958a] light:text-[#5a5449] mb-2">
                  Rating: {Math.round(day.ratingAfter)} • {day.tc}
                </p>
              )}

              <div className="space-y-2">
                {(expandedDays.has(day.date) ? day.games : day.games.slice(0, 3)).map((game) => {
                  const opponent = getOpponent(game);
                  const isWin =
                    (game.result === '1-0' && game.white.id === userId) ||
                    (game.result === '0-1' && game.black.id === userId);
                  const isDraw = game.result === '1/2-1/2';

                  // Get player's rating info
                  const isWhite = game.white.id === userId;
                  const ratingBefore = isWhite ? game.whiteRatingBefore : game.blackRatingBefore;
                  const ratingAfter = isWhite ? game.whiteRatingAfter : game.blackRatingAfter;
                  const ratingChange = ratingBefore && ratingAfter ? ratingAfter - ratingBefore : null;

                  return (
                    <Link
                      key={game.id}
                      href={`/game/${game.id}/analysis`}
                      className="flex items-center justify-between p-2 bg-[#2a2723] light:bg-[#f5f1ea] hover:bg-[#2f2c28] light:hover:bg-[#e5e1da] border border-[#3e3a33] light:border-[#d4caba] rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy
                          className={`h-4 w-4 ${
                            isWin
                              ? 'text-green-400'
                              : isDraw
                              ? 'text-[#a0958a]'
                              : 'text-red-400'
                          }`}
                        />
                        <div className="flex flex-col">
                          <span className="text-white light:text-black text-sm">vs {opponent?.handle}</span>
                          {ratingBefore && ratingAfter && (
                            <span className="text-xs text-[#a0958a] light:text-[#5a5449]">
                              {Math.round(ratingBefore)} → {Math.round(ratingAfter)}
                              {ratingChange !== null && (
                                <span className={`ml-1 font-bold ${ratingChange > 0 ? 'text-green-400' : ratingChange < 0 ? 'text-red-400' : 'text-[#a0958a]'}`}>
                                  ({ratingChange > 0 ? '+' : ''}{Math.round(ratingChange)})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isWin
                            ? 'text-green-400'
                            : isDraw
                            ? 'text-[#a0958a]'
                            : 'text-red-400'
                        }`}
                      >
                        {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                      </span>
                    </Link>
                  );
                })}
                {day.games.length > 3 && (
                  <button
                    onClick={() => toggleDayExpansion(day.date)}
                    className="text-xs text-orange-500 hover:text-orange-400 text-center w-full py-1 transition-colors cursor-pointer"
                  >
                    {expandedDays.has(day.date)
                      ? 'Show less'
                      : `+${day.games.length - 3} more games`}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
