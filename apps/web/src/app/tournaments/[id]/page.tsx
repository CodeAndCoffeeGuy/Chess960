'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Trophy, Clock, Users, Calendar, TrendingUp, UserPlus, UserMinus, Flame, Play, Zap } from 'lucide-react';
import { TournamentChat, TournamentChatMessage } from '@/components/tournament/TournamentChat';
import { TournamentPodium } from '@/components/tournament/TournamentPodium';
import { TournamentStats } from '@/components/tournament/TournamentStats';
import { TournamentConfetti } from '@/components/tournament/TournamentConfetti';
import { useWebSocket } from '@/hooks/useWebSocket';

interface TournamentPlayer {
  rank: number;
  id: string;
  userId: string;
  handle: string;
  country: string | null;
  isSupporter: boolean;
  rating: number;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  performance: number | null;
  withdrawn: boolean;
  joinedAt: string;
}

interface TournamentDetails {
  id: string;
  name: string;
  description: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  tc: string;
  startsAt: string;
  duration: number;
  endsAt: string | null;
  maxPlayers: number | null;
  minRating: number | null;
  maxRating: number | null;
  winnerId: string | null;
  createdBy: string;
  createdAt: string;
  stats?: {
    totalMoves: number;
    whiteWins: number;
    blackWins: number;
    draws: number;
    totalGames: number;
  };
}

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<TournamentChatMessage[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const tournamentId = params.id as string;
  const { on } = useWebSocket();

  // Check if user placed in top 3 for confetti
  useEffect(() => {
    if (tournament?.status === 'FINISHED' && session?.user?.id) {
      const userPlayer = players.find(p => p.userId === session.user.id);
      if (userPlayer && userPlayer.rank <= 3) {
        setShowConfetti(true);
        // Hide confetti after 8 seconds
        const timer = setTimeout(() => setShowConfetti(false), 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [tournament?.status, session?.user?.id, players]);

  // Set up WebSocket handler for tournament chat
  useEffect(() => {
    const unsubscribe = on('tournament.chat.received', (message: any) => {
      console.log('[TOURNAMENT CHAT] Received message:', message);
      setChatMessages(prev => [...prev, {
        userId: message.userId,
        handle: message.handle,
        message: message.message,
        timestamp: message.timestamp,
      }]);
    });

    return unsubscribe;
  }, [on]);

  useEffect(() => {
    fetchTournament();
    // Refresh every 5 seconds for live tournaments
    const interval = setInterval(() => {
      if (tournament?.status === 'LIVE') {
        fetchTournament();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [tournamentId, tournament?.status]);

  // Update time remaining
  useEffect(() => {
    if (!tournament) return;

    const updateTime = () => {
      if (tournament.status === 'UPCOMING') {
        const start = new Date(tournament.startsAt);
        const now = new Date();
        const diff = Math.floor((start.getTime() - now.getTime()) / 1000);
        setTimeRemaining(diff > 0 ? diff : 0);
      } else if (tournament.status === 'LIVE' && tournament.endsAt) {
        const end = new Date(tournament.endsAt);
        const now = new Date();
        const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
        setTimeRemaining(diff > 0 ? diff : 0);
      } else {
        setTimeRemaining(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        const tournamentData = data.tournament;

        // Extract players and add rank
        const playersWithRank = tournamentData.players.map((p: any, index: number) => ({
          ...p,
          rank: index + 1,
        }));

        setTournament(tournamentData);
        setPlayers(playersWithRank);
      } else {
        setError('Tournament not found');
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        fetchTournament();
      } else {
        setError(data.error || 'Failed to join tournament');
      }
    } catch {
      setError('Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTournament();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to leave tournament');
      }
    } catch {
      setError('Failed to leave tournament');
    } finally {
      setJoining(false);
    }
  };

  const handlePlayNextGame = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setPlaying(true);
    setError(null);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/play`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the game
        router.push(`/game/${data.gameId}`);
      } else {
        setError(data.error || 'Failed to start game');
        // If already in a game, redirect to it
        if (data.gameId) {
          router.push(`/game/${data.gameId}`);
        }
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('Failed to start game');
    } finally {
      setPlaying(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!session?.user?.id) return;

    console.log('[TOURNAMENT CHAT] Sending message:', message);
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      
      if (response.ok) {
        // Message sent successfully
        console.log('[TOURNAMENT CHAT] Message sent successfully');
      } else {
        console.error('[TOURNAMENT CHAT] Failed to send message');
      }
    } catch (error) {
      console.error('[TOURNAMENT CHAT] Error sending message:', error);
    }
  };

  const isJoined = session && players.some(p => p.userId === session.user?.id);

  // Calculate tournament statistics
  const totalGames = tournament?.stats?.totalGames || players.reduce((sum, p) => sum + p.gamesPlayed, 0) / 2;
  const totalMoves = tournament?.stats?.totalMoves || 0;
  const averageRating = players.length > 0
    ? players.reduce((sum, p) => sum + p.rating, 0) / players.length
    : 0;
  const whiteWins = tournament?.stats?.whiteWins || 0;
  const blackWins = tournament?.stats?.blackWins || 0;
  const draws = tournament?.stats?.draws || players.reduce((sum, p) => sum + p.draws, 0) / 2;

  const formatTimeControl = (tc: string) => {
    // tc is already in the format "2+0" or "1.5+3"
    return tc;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'text-blue-400 bg-blue-400/10';
      case 'LIVE':
        return 'text-green-400 bg-green-400/10';
      case 'FINISHED':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-[#a0958a]';
    }
  };

  const getWinRate = (player: TournamentPlayer) => {
    if (player.gamesPlayed === 0) return 0;
    return Math.round((player.wins / player.gamesPlayed) * 100);
  };

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return '';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
          <p className="mt-4 text-[#a0958a]">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-[#6b6460] mx-auto mb-4" />
          <p className="text-xl text-[#a0958a]">{error || 'Tournament not found'}</p>
          <Link
            href="/tournaments"
            className="inline-block mt-6 text-orange-400 hover:text-orange-300 font-semibold"
          >
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tournaments"
            className="text-orange-400 hover:text-orange-300 font-semibold mb-4 inline-block"
          >
            ← Back to Tournaments
          </Link>

          <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      tournament.status
                    )}`}
                  >
                    {tournament.status === 'LIVE' && (
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                    )}
                    {tournament.status}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-300/10 rounded-full">
                    <Zap className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-orange-400 font-semibold">
                      {formatTimeControl(tournament.tc)}
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {tournament.name}
                </h1>

                {tournament.description && (
                  <p className="text-[#c1b9ad] mb-4">{tournament.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-[#a0958a]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    <span>{formatDate(tournament.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span>{tournament.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-400" />
                    <span>
                      {players.length} player{players.length !== 1 ? 's' : ''}
                      {tournament.maxPlayers && ` / ${tournament.maxPlayers}`}
                    </span>
                  </div>
                </div>

                {(tournament.minRating || tournament.maxRating) && (
                  <div className="mt-3 text-sm text-[#6b6460]">
                    Rating requirement: {tournament.minRating || '0'} - {tournament.maxRating || '∞'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {session && (
                <div className="flex flex-col gap-2">
                  {error && (
                    <div className="text-sm text-red-400 mb-2 max-w-xs">{error}</div>
                  )}

                  {/* UPCOMING - Join/Leave */}
                  {tournament.status === 'UPCOMING' && (
                    <>
                      {isJoined ? (
                        <button
                          onClick={handleLeave}
                          disabled={joining}
                          className="flex items-center gap-2 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserMinus className="h-5 w-5" />
                          {joining ? 'Leaving...' : 'Leave Tournament'}
                        </button>
                      ) : (
                        <button
                          onClick={handleJoin}
                          disabled={joining}
                          className="flex items-center gap-2 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserPlus className="h-5 w-5" />
                          {joining ? 'Joining...' : 'Join Tournament'}
                        </button>
                      )}
                    </>
                  )}

                  {/* LIVE - Play Next Game */}
                  {tournament.status === 'LIVE' && isJoined && (
                    <button
                      onClick={handlePlayNextGame}
                      disabled={playing}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-5 w-5" />
                      {playing ? 'Finding opponent...' : 'Play Next Game'}
                    </button>
                  )}

                  {/* LIVE - Not Joined */}
                  {tournament.status === 'LIVE' && !isJoined && (
                    <div className="text-sm text-[#6b6460] text-center p-4 bg-[#2a2723] rounded-lg max-w-xs">
                      Tournament in progress.<br />Cannot join after start.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        {timeRemaining !== null && timeRemaining > 0 && (
          <div className="mb-6">
            <div className={`p-6 rounded-xl border ${
              timeRemaining <= 60
                ? 'bg-red-500/10 border-red-500/50 animate-pulse'
                : tournament.status === 'UPCOMING'
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-orange-300/10 border-orange-300/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={`h-6 w-6 ${
                    timeRemaining <= 60 ? 'text-red-400' : 'text-orange-400'
                  }`} />
                  <span className="text-lg font-semibold text-white">
                    {tournament.status === 'UPCOMING' ? 'Starts in:' : 'Time remaining:'}
                  </span>
                </div>
                <span className={`text-3xl font-bold ${
                  timeRemaining <= 60 ? 'text-red-400' : 'text-orange-400'
                }`}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              {timeRemaining <= 60 && tournament.status === 'LIVE' && (
                <p className="text-sm text-red-400 mt-2 text-center font-semibold">
                  Less than 1 minute remaining!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Confetti Effect for Winners */}
        {showConfetti && <TournamentConfetti />}

        {/* Tournament Results - Show Podium and Stats for FINISHED tournaments */}
        {tournament.status === 'FINISHED' && players.length >= 3 && (
          <div className="space-y-6 mb-6">
            {/* Podium */}
            <TournamentPodium players={players.slice(0, 3)} showConfetti={false} />

            {/* Statistics */}
            <TournamentStats
              totalGames={totalGames}
              totalMoves={totalMoves}
              averageRating={averageRating}
              whiteWins={whiteWins}
              blackWins={blackWins}
              draws={draws}
              totalPlayers={players.length}
            />
          </div>
        )}

        {/* Chat and Standings Layout */}
        <div className={`grid gap-6 ${isJoined ? 'lg:grid-cols-[1fr_2fr]' : 'grid-cols-1'} mb-6`}>
          {/* Tournament Chat - Only for joined players */}
          {isJoined && session?.user?.id && (
            <div className="h-[600px]">
              <TournamentChat
                tournamentId={tournamentId}
                currentUserId={session.user.id}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}

          {/* Standings */}
          <div className="bg-[#35322e] border border-[#474239] rounded-2xl overflow-hidden">
          <div className="bg-[#2a2723] border-b border-[#474239] px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-orange-400" />
              Standings
            </h2>
          </div>

          {players.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#a0958a]">
              No players yet. Be the first to join!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2723] border-b border-[#474239]">
                  <tr className="text-sm text-[#a0958a]">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Games</th>
                    <th className="px-4 py-3 text-center">Win Rate</th>
                    <th className="px-4 py-3 text-center">W/L/D</th>
                    {tournament.status !== 'UPCOMING' && (
                      <th className="px-4 py-3 text-center">Performance</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#474239]">
                  {players.map((player) => (
                    <tr
                      key={player.id}
                      className={`hover:bg-[#3a3632] transition-colors ${
                        player.rank <= 3 ? 'bg-[#3a3632]/50' : ''
                      } ${player.userId === session?.user?.id ? 'bg-orange-900/10' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {player.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
                          {player.rank === 2 && <Trophy className="h-5 w-5 text-gray-400" />}
                          {player.rank === 3 && <Trophy className="h-5 w-5 text-orange-400" />}
                          <span className="font-semibold text-white">{player.rank}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/@/${player.handle}`}
                          className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                        >
                          {player.country && (
                            <span className="text-lg">
                              {String.fromCodePoint(
                                ...player.country
                                  .toUpperCase()
                                  .split('')
                                  .map((char) => 127397 + char.charCodeAt(0))
                              )}
                            </span>
                          )}
                          <span className="font-semibold text-white">
                            {player.handle}
                          </span>
                          {player.isSupporter && (
                            <span className="text-orange-300" title="Supporter">★</span>
                          )}
                          {player.streak >= 2 && (
                            <span className="relative" title={`On fire! ${player.streak} win streak - earning double points`}>
                              <Flame className="h-4 w-4 text-orange-300 animate-pulse" />
                            </span>
                          )}
                          <span className="text-xs text-[#6b6460]">({player.rating})</span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold text-orange-400">
                          {player.score}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-[#c1b9ad]">
                        {player.gamesPlayed}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {player.gamesPlayed > 0 && (
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-[#c1b9ad]">{getWinRate(player)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-[#6b6460]">
                        {player.wins}/{player.losses}/{player.draws}
                      </td>
                      {tournament.status !== 'UPCOMING' && (
                        <td className="px-4 py-4 text-center text-[#c1b9ad]">
                          {player.performance || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
