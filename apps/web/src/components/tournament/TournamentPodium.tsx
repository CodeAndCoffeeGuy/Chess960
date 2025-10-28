'use client';

import { Trophy, Medal, Award, TrendingUp, Flame } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PodiumPlayer {
  rank: number;
  userId: string;
  handle: string;
  rating: number;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  performance: number | null;
}

interface TournamentPodiumProps {
  players: PodiumPlayer[];
  showConfetti?: boolean;
}

export function TournamentPodium({ players, showConfetti = false }: TournamentPodiumProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Get top 3 players
  const first = players.find(p => p.rank === 1);
  const second = players.find(p => p.rank === 2);
  const third = players.find(p => p.rank === 3);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const getWinRate = (player: PodiumPlayer) => {
    if (player.gamesPlayed === 0) return 0;
    return Math.round((player.wins / player.gamesPlayed) * 100);
  };

  if (!first) return null;

  return (
    <div className="relative">
      {/* Confetti effect placeholder - will be enhanced later */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Confetti canvas will go here */}
        </div>
      )}

      {/* Podium Container */}
      <div className="bg-gradient-to-b from-[#2a2723] to-[#35322e] rounded-3xl p-8 border border-[#474239] shadow-2xl">
        {/* Winner Spotlight */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-3xl animate-pulse"></div>
            <Trophy className="h-16 w-16 text-yellow-500 relative z-10 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
            Tournament Champion
          </h2>
        </div>

        {/* Podium Display - 2nd, 1st, 3rd arrangement */}
        <div className="flex items-end justify-center gap-4 mb-8 perspective-1000">
          {/* 2nd Place */}
          {second && (
            <div
              className={`transform transition-all duration-1000 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <PodiumPosition
                player={second}
                position="second"
                height="h-48"
                trophyColor="silver"
                bgGradient="from-gray-300 to-gray-500"
                getWinRate={getWinRate}
              />
            </div>
          )}

          {/* 1st Place */}
          <div
            className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <PodiumPosition
              player={first}
              position="first"
              height="h-64"
              trophyColor="gold"
              bgGradient="from-yellow-400 via-yellow-500 to-yellow-600"
              getWinRate={getWinRate}
              isWinner
            />
          </div>

          {/* 3rd Place */}
          {third && (
            <div
              className={`transform transition-all duration-1000 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <PodiumPosition
                player={third}
                position="third"
                height="h-40"
                trophyColor="bronze"
                bgGradient="from-orange-400 to-orange-600"
                getWinRate={getWinRate}
              />
            </div>
          )}
        </div>

        {/* Podium Base */}
        <div className="flex items-end justify-center gap-4">
          {/* 2nd Base */}
          {second && (
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full opacity-30"></div>
          )}
          {/* 1st Base */}
          <div className="w-40 h-1.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full opacity-40"></div>
          {/* 3rd Base */}
          {third && (
            <div className="w-28 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full opacity-30"></div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PodiumPositionProps {
  player: PodiumPlayer;
  position: 'first' | 'second' | 'third';
  height: string;
  trophyColor: 'gold' | 'silver' | 'bronze';
  bgGradient: string;
  getWinRate: (player: PodiumPlayer) => number;
  isWinner?: boolean;
}

function PodiumPosition({
  player,
  position,
  height,
  trophyColor,
  bgGradient,
  getWinRate,
  isWinner = false,
}: PodiumPositionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const trophyIcons = {
    gold: <Trophy className="h-12 w-12 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />,
    silver: <Medal className="h-10 w-10 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]" />,
    bronze: <Award className="h-9 w-9 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />,
  };

  const rankLabels = {
    first: '1st',
    second: '2nd',
    third: '3rd',
  };

  const widths = {
    first: 'w-40',
    second: 'w-32',
    third: 'w-28',
  };

  return (
    <div
      className={`${widths[position]} group relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Stats Card - Appears on hover */}
      <div
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="bg-[#1f1d1a] border border-[#474239] rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#a0958a]">Games</span>
              <span className="text-white font-semibold">{player.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a0958a]">Win Rate</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-white font-semibold">{getWinRate(player)}%</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a0958a]">W/L/D</span>
              <span className="text-white font-semibold">
                {player.wins}/{player.losses}/{player.draws}
              </span>
            </div>
            {player.performance && (
              <div className="flex justify-between">
                <span className="text-[#a0958a]">Performance</span>
                <span className="text-white font-semibold">{player.performance}</span>
              </div>
            )}
            {player.streak >= 2 && (
              <div className="flex justify-between border-t border-[#474239] pt-2">
                <span className="text-orange-400 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  Streak
                </span>
                <span className="text-orange-400 font-bold">{player.streak} wins!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Card */}
      <div className="relative mb-2">
        {/* Glow effect for winner */}
        {isWinner && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-2xl animate-pulse"></div>
        )}

        <div className="relative bg-[#35322e] border-2 border-[#474239] rounded-2xl p-4 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          {/* Trophy Icon */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              {player.streak >= 2 && (
                <div className="absolute -top-2 -right-2">
                  <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                </div>
              )}
              {trophyIcons[trophyColor]}
            </div>
          </div>

          {/* Player Info */}
          <Link
            href={`/@/${player.handle}`}
            className="block text-center hover:text-orange-400 transition-colors"
          >
            <div className={`font-bold mb-1 ${
              isWinner
                ? 'text-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent'
                : 'text-xl text-white'
            }`}>
              {player.handle}
            </div>
            <div className="text-xs text-[#6b6460] mb-2">
              {player.rating} rating
            </div>
          </Link>

          {/* Score */}
          <div className="text-center">
            <div className={`${
              isWinner ? 'text-3xl' : 'text-2xl'
            } font-bold bg-gradient-to-r ${bgGradient} bg-clip-text text-transparent mb-1`}>
              {player.score}
            </div>
            <div className="text-xs text-[#a0958a]">points</div>
          </div>

          {/* Quick Stats */}
          <div className="mt-3 pt-3 border-t border-[#474239] text-xs space-y-1">
            <div className="flex justify-between text-[#a0958a]">
              <span>Games</span>
              <span className="text-white font-semibold">{player.gamesPlayed}</span>
            </div>
            <div className="flex justify-between text-[#a0958a]">
              <span>Win Rate</span>
              <span className="text-green-400 font-semibold">{getWinRate(player)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Stand */}
      <div className={`${height} bg-gradient-to-b ${bgGradient} rounded-t-2xl relative overflow-hidden shadow-2xl transition-all duration-300 group-hover:shadow-3xl`}>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

        {/* Rank Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${
            isWinner ? 'text-6xl' : 'text-4xl'
          } font-black text-white/30 drop-shadow-lg`}>
            {rankLabels[position]}
          </div>
        </div>

        {/* Podium highlights */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-2 bg-black/20"></div>
      </div>
    </div>
  );
}
