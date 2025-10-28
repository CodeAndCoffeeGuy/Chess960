'use client';

import { useState, useEffect } from 'react';
import { Trophy, Clock, Target, TrendingUp, TrendingDown, Filter, X, Search } from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: string;
  result: string;
  whiteId: string;
  blackId: string;
  whiteHandle: string;
  blackHandle: string;
  whiteRatingBefore: number;
  blackRatingBefore: number;
  whiteRatingAfter: number;
  blackRatingAfter: number;
  startedAt: string;
  endedAt: string;
  moveCount: number;
  tc?: string;
  rated?: boolean;
  opening?: {
    name: string;
    eco: string;
  };
}

interface GameHistoryProps {
  userId: string;
  username: string;
}

type ResultFilter = 'all' | 'wins' | 'losses' | 'draws';

export function GameHistory({ userId, username: _username }: GameHistoryProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [opponentSearch, setOpponentSearch] = useState('');
  const [openingSearch, setOpeningSearch] = useState('');

  useEffect(() => {
    loadGames();
  }, [userId]);

  const loadGames = async () => {
    try {
      const limit = 20;
      const response = await fetch(`/api/games/history?userId=${userId}&limit=${limit}&offset=0`);
      if (!response.ok) throw new Error('Failed to load games');

      const data = await response.json();
      setGames(data.games || []);
      // filteredGames will be set by the useEffect
      setHasMore(data.pagination?.hasMore || false);
      setOffset(limit);
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const limit = 20;
      const response = await fetch(`/api/games/history?userId=${userId}&limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to load more games');

      const data = await response.json();
      const newGames = [...games, ...(data.games || [])];
      setGames(newGames);
      // Don't set filteredGames here - let the useEffect handle filtering
      setHasMore(data.pagination?.hasMore || false);
      setOffset(offset + limit);
    } catch (error) {
      console.error('Error loading more games:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...games];

    // Filter by result
    if (resultFilter !== 'all') {
      filtered = filtered.filter(game => {
        const result = getGameResult(game);
        if (resultFilter === 'wins') return result === 'WIN';
        if (resultFilter === 'losses') return result === 'LOSS';
        if (resultFilter === 'draws') return result === 'DRAW';
        return true;
      });
    }

    // Filter by opponent
    if (opponentSearch) {
      filtered = filtered.filter(game => {
        const opponent = getOpponent(game);
        return opponent.toLowerCase().includes(opponentSearch.toLowerCase());
      });
    }

    // Filter by opening
    if (openingSearch) {
      filtered = filtered.filter(game => {
        if (!game.opening) return false;
        const searchLower = openingSearch.toLowerCase();
        return (
          game.opening.name.toLowerCase().includes(searchLower) ||
          game.opening.eco.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredGames(filtered);
  }, [games, resultFilter, opponentSearch, openingSearch]);

  // Helper functions - defined before use
  const getGameResult = (game: Game) => {
    const isWhite = game.whiteId === userId;

    if (game.result === '1-0') {
      return isWhite ? 'WIN' : 'LOSS';
    } else if (game.result === '0-1') {
      return isWhite ? 'LOSS' : 'WIN';
    } else if (game.result.includes('flag')) {
      const flaggedColor = game.result.split('-')[1];
      return (isWhite && flaggedColor === 'black') || (!isWhite && flaggedColor === 'white') ? 'WIN' : 'LOSS';
    } else if (game.result.includes('resign')) {
      const resignedColor = game.result.split('-')[1];
      return (isWhite && resignedColor === 'black') || (!isWhite && resignedColor === 'white') ? 'WIN' : 'LOSS';
    }
    return 'DRAW';
  };

  const getOpponent = (game: Game) => {
    const isWhite = game.whiteId === userId;
    return isWhite ? game.blackHandle : game.whiteHandle;
  };

  const clearFilters = () => {
    setResultFilter('all');
    setOpponentSearch('');
    setOpeningSearch('');
  };

  const hasActiveFilters = resultFilter !== 'all' || opponentSearch || openingSearch;

  const getFilterStats = () => {
    const wins = games.filter(g => getGameResult(g) === 'WIN').length;
    const losses = games.filter(g => getGameResult(g) === 'LOSS').length;
    const draws = games.filter(g => getGameResult(g) === 'DRAW').length;
    return { wins, losses, draws, total: games.length };
  };

  const stats = getFilterStats();

  const getResultColor = (result: string) => {
    if (result === 'WIN') return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (result === 'LOSS') return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  };

  const getResultIcon = (result: string) => {
    if (result === 'WIN') return <Trophy className="w-4 h-4" />;
    if (result === 'LOSS') return <Target className="w-4 h-4" />;
    return <div className="w-4 h-4 flex items-center justify-center text-xs">½</div>;
  };

  const getRatingChange = (game: Game) => {
    const isWhite = game.whiteId === userId;
    const before = isWhite ? game.whiteRatingBefore : game.blackRatingBefore;
    const after = isWhite ? game.whiteRatingAfter : game.blackRatingAfter;
    return after - before;
  };

  const getGameDuration = (game: Game) => {
    const start = new Date(game.startedAt).getTime();
    const end = new Date(game.endedAt).getTime();
    const durationSeconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-[#35322e] light:bg-[#d4caba] rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#35322e] light:bg-[#d4caba] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-8 text-center">
        <Trophy className="w-12 h-12 text-[#a0958a] mx-auto mb-3" />
        <h3 className="text-white light:text-black font-semibold text-lg mb-2">No games yet</h3>
        <p className="text-[#a0958a] light:text-[#5a5449] text-sm">Start playing to see your game history here</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white light:text-black font-semibold text-lg">Recent Games</h3>
        <div className="flex items-center space-x-3">
          <span className="text-[#a0958a] light:text-[#5a5449] text-sm">{filteredGames.length}/{games.length} games</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
              hasActiveFilters
                ? 'bg-orange-600/20 border-orange-500/40 text-orange-400'
                : 'bg-[#35322e] light:bg-[#f5f1ea] border-[#474239] light:border-[#d4caba] text-[#a0958a] light:text-[#5a5449] hover:text-orange-500'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-semibold">Filter</span>
            {hasActiveFilters && (
              <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {[resultFilter !== 'all', opponentSearch, openingSearch].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#35322e] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-4 mb-4 space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#2a2723] light:bg-white rounded-lg p-2 text-center">
              <div className="text-xs text-[#a0958a] light:text-[#5a5449]">Total</div>
              <div className="text-white light:text-black font-bold">{stats.total}</div>
            </div>
            <div className="bg-green-400/10 rounded-lg p-2 text-center border border-green-400/20">
              <div className="text-xs text-green-300">Wins</div>
              <div className="text-green-400 font-bold">{stats.wins}</div>
            </div>
            <div className="bg-red-400/10 rounded-lg p-2 text-center border border-red-400/20">
              <div className="text-xs text-red-300">Losses</div>
              <div className="text-red-400 font-bold">{stats.losses}</div>
            </div>
            <div className="bg-yellow-400/10 rounded-lg p-2 text-center border border-yellow-400/20">
              <div className="text-xs text-yellow-300">Draws</div>
              <div className="text-yellow-400 font-bold">{stats.draws}</div>
            </div>
          </div>

          {/* Result Filter */}
          <div>
            <label className="text-xs font-semibold text-[#a0958a] light:text-[#5a5449] mb-2 block">Result</label>
            <div className="flex space-x-2">
              {(['all', 'wins', 'losses', 'draws'] as ResultFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setResultFilter(filter)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    resultFilter === filter
                      ? 'bg-orange-600 text-white'
                      : 'bg-[#2a2723] light:bg-white text-[#a0958a] light:text-[#5a5449] hover:text-orange-500 border border-[#474239] light:border-[#d4caba]'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Opponent Search */}
          <div>
            <label className="text-xs font-semibold text-[#a0958a] light:text-[#5a5449] mb-2 block">Opponent</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0958a]" />
              <input
                type="text"
                value={opponentSearch}
                onChange={(e) => setOpponentSearch(e.target.value)}
                placeholder="Search by opponent name..."
                className="w-full bg-[#2a2723] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg pl-10 pr-3 py-2 text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Opening Search */}
          <div>
            <label className="text-xs font-semibold text-[#a0958a] light:text-[#5a5449] mb-2 block">Opening</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0958a]" />
              <input
                type="text"
                value={openingSearch}
                onChange={(e) => setOpeningSearch(e.target.value)}
                placeholder="Search by opening name or ECO..."
                className="w-full bg-[#2a2723] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg pl-10 pr-3 py-2 text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full bg-[#2a2723] light:bg-white hover:bg-[#35322e] light:hover:bg-[#f5f1ea] text-[#a0958a] light:text-[#5a5449] hover:text-orange-500 py-2 rounded-lg text-sm font-semibold border border-[#474239] light:border-[#d4caba] transition-all flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filteredGames.map((game) => {
          const result = getGameResult(game);
          const ratingChange = getRatingChange(game);
          const opponent = getOpponent(game);
          const isWhite = game.whiteId === userId;

          return (
            <Link
              key={game.id}
              href={`/game/${game.id}/analysis`}
              className="block bg-[#35322e] light:bg-[#f5f1ea] hover:bg-[#3e3a33] light:hover:bg-[#e5e1da] border border-[#474239] light:border-[#d4caba] rounded-lg p-4 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                {/* Left: Result Badge */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getResultColor(result)}`}>
                  {getResultIcon(result)}
                  <span className="font-semibold text-sm">{result}</span>
                </div>

                {/* Center: Game Info */}
                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${isWhite ? 'bg-white' : 'bg-gray-800 border border-gray-600'}`}></div>
                      <span className="text-white light:text-black font-medium">vs {opponent}</span>
                    </div>
                    <span className="text-[#a0958a] light:text-[#5a5449] text-sm">•</span>
                    <div className="flex items-center space-x-1 text-[#a0958a] light:text-[#5a5449] text-sm">
                      <Clock className="w-3 h-3" />
                      <span>{getGameDuration(game)}</span>
                    </div>
                    <span className="text-[#a0958a] light:text-[#5a5449] text-sm">•</span>
                    <span className="text-[#a0958a] light:text-[#5a5449] text-sm">{game.moveCount} moves</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[#a0958a] light:text-[#5a5449] text-xs">{formatDate(game.endedAt)}</span>
                    {game.opening && (
                      <>
                        <span className="text-[#a0958a] light:text-[#5a5449] text-xs">•</span>
                        <span className="text-orange-400/80 text-xs font-mono">{game.opening.eco}</span>
                        <span className="text-[#a0958a] light:text-[#5a5449] text-xs">{game.opening.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Rating Change */}
                <div className="flex items-center space-x-2">
                  {ratingChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : ratingChange < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : null}
                  <span className={`font-semibold ${
                    ratingChange > 0 ? 'text-green-400' :
                    ratingChange < 0 ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {ratingChange > 0 ? '+' : ''}{ratingChange}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full mt-4 bg-[#35322e] light:bg-[#f5f1ea] hover:bg-[#3e3a33] light:hover:bg-[#e5e1da] text-white light:text-black py-2 rounded-lg font-semibold border border-[#474239] light:border-[#d4caba] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
