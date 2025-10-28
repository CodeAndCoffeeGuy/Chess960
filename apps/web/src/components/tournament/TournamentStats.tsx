'use client';

import { BarChart3, TrendingUp, Users, Zap, Target, Award } from 'lucide-react';

interface TournamentStatsProps {
  totalGames: number;
  totalMoves: number;
  averageRating: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  averageGameDuration?: number; // in seconds
  totalPlayers: number;
}

export function TournamentStats({
  totalGames,
  totalMoves,
  averageRating,
  whiteWins,
  blackWins,
  draws,
  averageGameDuration,
  totalPlayers,
}: TournamentStatsProps) {
  const whiteWinRate = totalGames > 0 ? Math.round((whiteWins / totalGames) * 100) : 0;
  const blackWinRate = totalGames > 0 ? Math.round((blackWins / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0;
  const averageMovesPerGame = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#35322e] border border-[#474239] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#2a2723] border-b border-[#474239] px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-orange-400" />
          Tournament Statistics
        </h2>
      </div>

      <div className="p-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Games */}
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Games Played"
            value={totalGames.toLocaleString()}
            color="orange"
          />

          {/* Total Moves */}
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Total Moves"
            value={totalMoves.toLocaleString()}
            color="blue"
          />

          {/* Average Rating */}
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Avg Rating"
            value={Math.round(averageRating).toString()}
            color="green"
          />

          {/* Total Players */}
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Players"
            value={totalPlayers.toString()}
            color="purple"
          />
        </div>

        {/* Win Rates Visualization */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Game Results</h3>

          {/* White Wins */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#c1b9ad]">White Wins</span>
              <span className="text-sm font-bold text-white">{whiteWinRate}%</span>
            </div>
            <div className="h-3 bg-[#1f1d1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-400 to-gray-200 transition-all duration-1000"
                style={{ width: `${whiteWinRate}%` }}
              >
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="text-xs text-[#6b6460] mt-1">{whiteWins.toLocaleString()} games</div>
          </div>

          {/* Black Wins */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#c1b9ad]">Black Wins</span>
              <span className="text-sm font-bold text-white">{blackWinRate}%</span>
            </div>
            <div className="h-3 bg-[#1f1d1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-700 to-gray-900 transition-all duration-1000"
                style={{ width: `${blackWinRate}%` }}
              >
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="text-xs text-[#6b6460] mt-1">{blackWins.toLocaleString()} games</div>
          </div>

          {/* Draws */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#c1b9ad]">Draws</span>
              <span className="text-sm font-bold text-white">{drawRate}%</span>
            </div>
            <div className="h-3 bg-[#1f1d1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-1000"
                style={{ width: `${drawRate}%` }}
              >
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="text-xs text-[#6b6460] mt-1">{draws.toLocaleString()} games</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#2a2723] rounded-xl border border-[#474239]">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{averageMovesPerGame}</div>
            <div className="text-xs text-[#a0958a] mt-1">Avg Moves/Game</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{formatDuration(averageGameDuration)}</div>
            <div className="text-xs text-[#a0958a] mt-1">Avg Game Length</div>
          </div>
        </div>

        {/* Fun Fact */}
        {totalMoves > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-orange-400">
              <Award className="h-5 w-5" />
              <span className="font-semibold">Did you know?</span>
            </div>
            <p className="text-sm text-[#c1b9ad] mt-2">
              This tournament generated{' '}
              <span className="text-white font-bold">{totalMoves.toLocaleString()}</span> moves.
              {totalMoves >= 1000 && ` That's over ${Math.floor(totalMoves / 1000)}k moves!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'orange' | 'blue' | 'green' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} hover:scale-105 transition-transform duration-200`}>
      <div className={`flex items-center gap-2 mb-2 ${colorClasses[color].split(' ')[0]}`}>
        {icon}
        <span className="text-xs text-[#a0958a]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
