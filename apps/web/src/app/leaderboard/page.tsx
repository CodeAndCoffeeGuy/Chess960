'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award, TrendingUp, Flame, Zap, Crown, Calendar } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { TimeControlModal } from '@/components/game/TimeControlModal';
import { useSession } from 'next-auth/react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  handle: string;
  country: string | null;
  isSupporter: boolean;
  rating: number;
  rd: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

interface TournamentChampion {
  tournamentId: string;
  tournamentName: string;
  winnerId: string;
  winnerHandle: string;
  winnerCountry: string | null;
  winnerIsSupporter: boolean;
  score: number;
  gamesPlayed: number;
  tc: string;
  finishedAt: string;
}

type TabType = 'ratings' | 'champions' | 'streaks';
type TimeControl = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('ratings');
  const [timeControl, setTimeControl] = useState<TimeControl>('BULLET');
  const [ratingsData, setRatingsData] = useState<LeaderboardEntry[]>([]);
  const [championsData, setChampionsData] = useState<TournamentChampion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeControlModalOpen, setTimeControlModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'ratings') {
      fetchRatings();
    } else if (activeTab === 'champions') {
      fetchChampions();
    }
  }, [activeTab, timeControl]);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leaderboard?limit=100&tc=${timeControl}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const result = await response.json();
      setRatingsData(result.leaderboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchChampions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leaderboard/champions?limit=50');
      if (!response.ok) throw new Error('Failed to fetch champions');
      const result = await response.json();
      setChampionsData(result.champions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />;
    return null;
  };

  const getWinRate = (entry: LeaderboardEntry) => {
    const totalGames = entry.wins + entry.losses + entry.draws;
    if (totalGames === 0) return 0;
    return Math.round((entry.wins / totalGames) * 100);
  };

  const formatTimeControl = (tc: string) => {
    const tcMap: { [key: string]: string } = {
      'ONE_PLUS_ZERO': '1+0',
      'TWO_PLUS_ZERO': '2+0',
      'TWO_PLUS_ONE': '2+1',
      'THREE_PLUS_ZERO': '3+0',
      'THREE_PLUS_TWO': '3+2',
      'FIVE_PLUS_ZERO': '5+0',
      'FIVE_PLUS_THREE': '5+3',
      'TEN_PLUS_ZERO': '10+0',
      'TEN_PLUS_FIVE': '10+5',
      'FIFTEEN_PLUS_ZERO': '15+0',
      'FIFTEEN_PLUS_TEN': '15+10',
      'THIRTY_PLUS_ZERO': '30+0',
      'THIRTY_PLUS_TWENTY': '30+20',
      'SIXTY_PLUS_ZERO': '60+0',
    };
    return tcMap[tc] || tc;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderPodium = () => {
    if (ratingsData.length === 0) return null;

    const top3 = ratingsData.slice(0, 3);
    const [first, second, third] = top3;

    return (
      <div className="mb-12 px-4">
        <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-3xl mx-auto">
          {/* Second Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl p-3 sm:p-6 w-full text-center border-2 border-gray-400 shadow-lg">
                <Medal className="h-8 w-8 sm:h-12 sm:w-12 text-white mx-auto mb-2 sm:mb-3" />
                <Link
                  href={`/@/${second.handle}`}
                  className="text-lg sm:text-xl font-bold text-white hover:text-gray-200 transition-colors block mb-1 sm:mb-2"
                >
                  {second.country && (
                    <span className="text-xl sm:text-2xl mr-1 sm:mr-2">
                      {String.fromCodePoint(...second.country.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))}
                    </span>
                  )}
                  <span className="break-words">{second.handle}</span>
                </Link>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{second.rating}</div>
                <div className="text-xs sm:text-sm text-gray-200">{second.gamesPlayed} games</div>
              </div>
              <div className="w-20 sm:w-32 h-16 sm:h-24 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl sm:text-4xl font-bold text-white">2</span>
              </div>
            </div>
          )}

          {/* First Place */}
          {first && (
            <div className="flex-1 flex flex-col items-center">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-4 sm:p-8 w-full text-center border-2 border-yellow-400 shadow-2xl transform scale-105 sm:scale-110">
                <Crown className="h-10 w-10 sm:h-16 sm:w-16 text-white mx-auto mb-2 sm:mb-4 animate-pulse" />
                <Link
                  href={`/@/${first.handle}`}
                  className="text-xl sm:text-2xl font-bold text-white hover:text-yellow-100 transition-colors block mb-1 sm:mb-2"
                >
                  {first.country && (
                    <span className="text-2xl sm:text-3xl mr-1 sm:mr-2">
                      {String.fromCodePoint(...first.country.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))}
                    </span>
                  )}
                  <span className="break-words">{first.handle}</span>
                </Link>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{first.rating}</div>
                <div className="text-xs sm:text-sm text-yellow-100">{first.gamesPlayed} games</div>
              </div>
              <div className="w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-3xl sm:text-5xl font-bold text-white">1</span>
              </div>
            </div>
          )}

          {/* Third Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-3 sm:p-6 w-full text-center border-2 border-orange-400 shadow-lg">
                <Award className="h-8 w-8 sm:h-12 sm:w-12 text-white mx-auto mb-2 sm:mb-3" />
                <Link
                  href={`/@/${third.handle}`}
                  className="text-lg sm:text-xl font-bold text-white hover:text-orange-200 transition-colors block mb-1 sm:mb-2"
                >
                  {third.country && (
                    <span className="text-xl sm:text-2xl mr-1 sm:mr-2">
                      {String.fromCodePoint(...third.country.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))}
                    </span>
                  )}
                  <span className="break-words">{third.handle}</span>
                </Link>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{third.rating}</div>
                <div className="text-xs sm:text-sm text-orange-200">{third.gamesPlayed} games</div>
              </div>
              <div className="w-20 sm:w-32 h-14 sm:h-20 bg-gradient-to-b from-orange-500 to-orange-700 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl sm:text-4xl font-bold text-white">3</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Leaderboard
          </h1>
          <p className="text-xl text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto">
            Compete for glory and climb the ranks
          </p>
        </AnimatedSection>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#2a2723] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-xl p-1.5 gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('ratings')}
              className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'ratings'
                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-lg'
                  : 'text-[#a0958a] light:text-[#5a5449] hover:text-white light:hover:text-black hover:bg-[#35322e] light:hover:bg-[#f5f1ea]'
              }`}
            >
              Ratings
            </button>
            <button
              onClick={() => setActiveTab('champions')}
              className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'champions'
                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-lg'
                  : 'text-[#a0958a] light:text-[#5a5449] hover:text-white light:hover:text-black hover:bg-[#35322e] light:hover:bg-[#f5f1ea]'
              }`}
            >
              Champions
            </button>
            <button
              onClick={() => setActiveTab('streaks')}
              className={`px-3 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'streaks'
                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-lg'
                  : 'text-[#a0958a] light:text-[#5a5449] hover:text-white light:hover:text-black hover:bg-[#35322e] light:hover:bg-[#f5f1ea]'
              }`}
            >
              Hot Streaks
            </button>
          </div>
        </div>

        {/* Time Control Filter (for Ratings tab) */}
        {activeTab === 'ratings' && (
          <div className="flex justify-center mb-8 gap-2 flex-wrap px-4">
            {(['BULLET', 'BLITZ', 'RAPID', 'CLASSICAL'] as TimeControl[]).map((tc) => (
              <button
                key={tc}
                onClick={() => setTimeControl(tc)}
                className={`px-3 sm:px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                  timeControl === tc
                    ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-lg'
                    : 'bg-[#35322e] light:bg-white text-[#a0958a] light:text-[#5a5449] hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba]'
                }`}
              >
                {tc.charAt(0) + tc.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
            <p className="mt-4 text-[#a0958a] light:text-[#5a5449]">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Ratings Tab */}
        {!loading && !error && activeTab === 'ratings' && (
          <>
            {renderPodium()}

            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl overflow-hidden">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden sm:block bg-[#2a2723] light:bg-[#f5f1ea] border-b border-[#474239] light:border-[#d4caba] px-6 py-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-[#a0958a] light:text-[#5a5449]">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-center">Rating</div>
                  <div className="col-span-2 text-center">Games</div>
                  <div className="col-span-2 text-center">Win Rate</div>
                  <div className="col-span-1 text-center">W/L/D</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[#474239] light:divide-[#d4caba]">
                {ratingsData.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[#a0958a] light:text-[#5a5449]">
                    No players found for this time control
                  </div>
                ) : (
                  ratingsData.slice(3).map((entry) => (
                    <div
                      key={entry.userId}
                      className="px-4 sm:px-6 py-4 hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] transition-colors"
                    >
                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        {/* Rank */}
                        <div className="col-span-1">
                          <span className="text-[#a0958a] light:text-[#5a5449] font-semibold">{entry.rank}</span>
                        </div>

                        {/* Player */}
                        <div className="col-span-4">
                          <Link
                            href={`/@/${entry.handle}`}
                            className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                          >
                            {entry.country && (
                              <span className="text-lg">
                                {String.fromCodePoint(
                                  ...entry.country
                                    .toUpperCase()
                                    .split('')
                                    .map((char) => 127397 + char.charCodeAt(0))
                                )}
                              </span>
                            )}
                            <span className="font-semibold text-white light:text-black">
                              {entry.handle}
                            </span>
                            {entry.isSupporter && (
                              <span className="text-orange-300" title="Supporter">★</span>
                            )}
                          </Link>
                        </div>

                        {/* Rating */}
                        <div className="col-span-2 text-center">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-orange-400">
                              {entry.rating}
                            </span>
                            <span className="text-xs text-[#6b6460] light:text-[#a0958a]">±{entry.rd}</span>
                          </div>
                        </div>

                        {/* Games Played */}
                        <div className="col-span-2 text-center">
                          <span className="text-[#c1b9ad] light:text-[#5a5449]">{entry.gamesPlayed}</span>
                        </div>

                        {/* Win Rate */}
                        <div className="col-span-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-[#c1b9ad] light:text-[#5a5449]">{getWinRate(entry)}%</span>
                          </div>
                        </div>

                        {/* W/L/D */}
                        <div className="col-span-1 text-center">
                          <span className="text-xs text-[#6b6460] light:text-[#a0958a]">
                            {entry.wins}/{entry.losses}/{entry.draws}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="sm:hidden">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#a0958a] light:text-[#5a5449] font-semibold text-sm">#{entry.rank}</span>
                            <Link
                              href={`/@/${entry.handle}`}
                              className="flex items-center gap-1 hover:text-orange-400 transition-colors"
                            >
                              {entry.country && (
                                <span className="text-sm">
                                  {String.fromCodePoint(
                                    ...entry.country
                                      .toUpperCase()
                                      .split('')
                                      .map((char) => 127397 + char.charCodeAt(0))
                                  )}
                                </span>
                              )}
                              <span className="font-semibold text-white light:text-black text-sm">
                                {entry.handle}
                              </span>
                              {entry.isSupporter && (
                                <span className="text-orange-300 text-xs" title="Supporter">★</span>
                              )}
                            </Link>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-400">{entry.rating}</div>
                            <div className="text-xs text-[#6b6460] light:text-[#a0958a]">±{entry.rd}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-[#c1b9ad] light:text-[#5a5449]">{entry.gamesPlayed} games</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="text-[#c1b9ad] light:text-[#5a5449]">{getWinRate(entry)}%</span>
                            </div>
                          </div>
                          <span className="text-xs text-[#6b6460] light:text-[#a0958a]">
                            {entry.wins}/{entry.losses}/{entry.draws}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Champions Tab */}
        {!loading && !error && activeTab === 'champions' && (
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#474239] light:divide-[#d4caba]">
              {championsData.length === 0 ? (
                <div className="px-6 py-12 text-center text-[#a0958a] light:text-[#5a5449]">
                  No tournament champions yet
                </div>
              ) : (
                championsData.map((champion, index) => (
                  <div
                    key={champion.tournamentId}
                    className="px-4 sm:px-6 py-4 sm:py-6 hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] transition-colors"
                  >
                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          {index < 3 ? (
                            getRankIcon(index + 1)
                          ) : (
                            <span className="text-[#6b6460] light:text-[#a0958a] font-semibold w-6 text-center block">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Tournament Info */}
                        <div className="flex-1">
                          <Link
                            href={`/tournaments/${champion.tournamentId}`}
                            className="text-lg font-semibold text-white light:text-black hover:text-orange-400 transition-colors block mb-1"
                          >
                            {champion.tournamentName}
                          </Link>
                          <div className="flex items-center gap-3 text-sm text-[#a0958a] light:text-[#5a5449]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(champion.finishedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4 text-orange-400" />
                              {formatTimeControl(champion.tc)}
                            </span>
                          </div>
                        </div>

                        {/* Winner */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Link
                              href={`/@/${champion.winnerHandle}`}
                              className="flex items-center gap-2 hover:text-orange-400 transition-colors mb-1"
                            >
                              {champion.winnerCountry && (
                                <span className="text-lg">
                                  {String.fromCodePoint(
                                    ...champion.winnerCountry
                                      .toUpperCase()
                                      .split('')
                                      .map((char) => 127397 + char.charCodeAt(0))
                                  )}
                                </span>
                              )}
                              <span className="font-semibold text-white light:text-black">
                                {champion.winnerHandle}
                              </span>
                              {champion.winnerIsSupporter && (
                                <span className="text-orange-300" title="Supporter">★</span>
                              )}
                            </Link>
                            <div className="text-sm text-[#a0958a] light:text-[#5a5449]">
                              {champion.score} pts • {champion.gamesPlayed} games
                            </div>
                          </div>
                          <Trophy className="h-8 w-8 text-yellow-500" />
                        </div>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {index < 3 ? (
                            getRankIcon(index + 1)
                          ) : (
                            <span className="text-[#6b6460] light:text-[#a0958a] font-semibold text-sm">#{index + 1}</span>
                          )}
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#a0958a] light:text-[#5a5449]">
                            {champion.score} pts • {champion.gamesPlayed} games
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href={`/tournaments/${champion.tournamentId}`}
                        className="text-base font-semibold text-white light:text-black hover:text-orange-400 transition-colors block mb-2"
                      >
                        {champion.tournamentName}
                      </Link>
                      
                      <div className="flex items-center gap-3 text-xs text-[#a0958a] light:text-[#5a5449] mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(champion.finishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-orange-400" />
                          {formatTimeControl(champion.tc)}
                        </span>
                      </div>
                      
                      <Link
                        href={`/@/${champion.winnerHandle}`}
                        className="flex items-center gap-1 hover:text-orange-400 transition-colors"
                      >
                        {champion.winnerCountry && (
                          <span className="text-sm">
                            {String.fromCodePoint(
                              ...champion.winnerCountry
                                .toUpperCase()
                                .split('')
                                .map((char) => 127397 + char.charCodeAt(0))
                            )}
                          </span>
                        )}
                        <span className="font-semibold text-white light:text-black text-sm">
                          {champion.winnerHandle}
                        </span>
                        {champion.winnerIsSupporter && (
                          <span className="text-orange-300 text-xs" title="Supporter">★</span>
                        )}
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Hot Streaks Tab */}
        {!loading && !error && activeTab === 'streaks' && (
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-12 text-center">
            <Flame className="h-20 w-20 text-orange-400 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-white light:text-black mb-3">Hot Streaks Coming Soon</h2>
            <p className="text-[#a0958a] light:text-[#5a5449] max-w-md mx-auto">
              Track players on fire with the longest winning streaks. This feature is currently in development.
            </p>
          </div>
        )}

        {/* Info Section */}
        {activeTab === 'ratings' && !loading && (
          <AnimatedSection className="mt-16 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-6">About the Leaderboard</h2>
            <div className="space-y-4 text-[#c1b9ad] light:text-[#5a5449]">
              <p>
                Rankings are based on the <strong className="text-white light:text-black">Glicko-2 rating system</strong>,
                an advanced rating algorithm that accounts for rating reliability (RD) and rating volatility.
              </p>
              <p>
                Players start at <strong className="text-white light:text-black">1500 rating</strong> with high RD.
                As you play more games, your rating becomes more accurate and RD decreases.
              </p>
              <p>
                Compete across different time controls: Bullet, Blitz, Rapid, and Classical chess variants!
              </p>
            </div>
          </AnimatedSection>
        )}

        {/* CTA Section */}
        <AnimatedSection className="mt-8 text-center bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white light:text-black mb-4">Ready to Compete?</h2>
          <p className="text-[#a0958a] light:text-[#5a5449] mb-6">
            Join the leaderboard and test your skills against the best players
          </p>
          <button
            onClick={() => setTimeControlModalOpen(true)}
            className="inline-block bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Play Now
          </button>
        </AnimatedSection>
      </div>

      {/* Time Control Modal */}
      <TimeControlModal
        isOpen={timeControlModalOpen}
        onClose={() => setTimeControlModalOpen(false)}
        defaultSpeed="bullet"
        userRating={(session?.user as any)?.rating || 1500}
      />
    </div>
  );
}
