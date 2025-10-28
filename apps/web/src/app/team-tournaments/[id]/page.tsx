'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TeamSelectionModal } from '@/components/TeamSelectionModal';
import { TeamInfoModal } from '@/components/TeamInfoModal';

interface TeamPlayer {
  id: string;
  userId: string;
  rating: number;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  performance: number | null;
  active: boolean;
  name?: string;
}

interface TeamStats {
  avgRating: number;
  avgPerformance: number;
  topPerformers: Array<{
    userId: string;
    rating: number;
    performance: number;
    score: number;
  }>;
  activePlayerCount: number;
  totalGamesPlayed: number;
}

interface TeamEntry {
  id: string;
  teamId: string;
  teamName: string;
  teamAvatar: string | null;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  withdrawn: boolean;
  stats: TeamStats;
  players: TeamPlayer[];
}

interface TeamTournament {
  id: string;
  name: string;
  description: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  tc: string;
  variant: string;
  chess960Position: number | null;
  startsAt: string;
  duration: number;
  endsAt: string | null;
  maxTeams: number | null;
  playersPerTeam: number;
  teamCount: number;
  createdBy: string;
  winnerTeamId: string | null;
  teamEntries: TeamEntry[];
}

interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  teamId: string | null;
}

// Team color palette - first 10 teams get unique colors
const TEAM_COLORS = [
  { bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500', name: 'Purple' },
  { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500', name: 'Blue' },
  { bg: 'bg-green-600', text: 'text-green-100', border: 'border-green-500', name: 'Green' },
  { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-500', name: 'Red' },
  { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500', name: 'Orange' },
  { bg: 'bg-lime-600', text: 'text-lime-100', border: 'border-lime-500', name: 'Lime' },
  { bg: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500', name: 'Rose' },
  { bg: 'bg-teal-600', text: 'text-teal-100', border: 'border-teal-500', name: 'Teal' },
  { bg: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-500', name: 'Amber' },
  { bg: 'bg-indigo-600', text: 'text-indigo-100', border: 'border-indigo-500', name: 'Indigo' },
];

// Helper to get team color by index (returns default gray if beyond 10 teams)
function getTeamColor(index: number) {
  if (index < 0 || index >= TEAM_COLORS.length) {
    return { bg: 'bg-gray-700', text: 'text-gray-200', border: 'border-gray-600', name: 'Gray' };
  }
  return TEAM_COLORS[index];
}

export default function TeamTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<TeamTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'chat'>('leaderboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setTournamentId(id));
  }, [params]);
  const [isUserInTournament, setIsUserInTournament] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [sortBy, setSortBy] = useState<'score' | 'performance'>('score');
  const [selectedTeam, setSelectedTeam] = useState<{ entry: TeamEntry; rank: number } | null>(null);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchMessages();
    }
  }, [activeTab]);

  useEffect(() => {
    if (tournament?.status === 'LIVE' && isUserInTournament) {
      // Fetch queue status initially
      fetchQueueStatus();

      // Poll for queue updates every 3 seconds
      const interval = setInterval(fetchQueueStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [tournament?.status, isUserInTournament]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/team-tournaments/${tournamentId}`);
      if (!res.ok) {
        throw new Error('Failed to load tournament');
      }
      const data = await res.json();
      setTournament(data.tournament);

      // Find user's team
      if (session?.user?.id) {
        const userEntry = data.tournament.teamEntries.find((entry: TeamEntry) =>
          entry.players.some((p) => p.userId === session.user.id)
        );
        if (userEntry) {
          setUserTeamId(userEntry.teamId);
          setIsUserInTournament(true);
        } else {
          setIsUserInTournament(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/team-tournaments/${tournamentId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      const res = await fetch(`/api/team-tournaments/${tournamentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageInput,
          teamId: null, // Global chat
        }),
      });

      if (res.ok) {
        setMessageInput('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleJoinTournament = async (teamId: string, playerIds: string[]) => {
    const res = await fetch(`/api/team-tournaments/${tournamentId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        playerUserIds: playerIds,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to join tournament');
    }

    // Refresh tournament data
    await fetchTournament();
  };

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch(`/api/team-tournaments/${tournamentId}/queue`);
      if (res.ok) {
        const data = await res.json();
        setInQueue(data.inQueue);
        setQueueSize(data.size);
      }
    } catch (err) {
      console.error('Failed to fetch queue status:', err);
    }
  };

  const handleJoinQueue = async () => {
    try {
      const res = await fetch(`/api/team-tournaments/${tournamentId}/queue`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setInQueue(data.inQueue);
        await fetchQueueStatus();
      }
    } catch (err) {
      console.error('Failed to join queue:', err);
    }
  };

  const handleLeaveQueue = async () => {
    try {
      const res = await fetch(`/api/team-tournaments/${tournamentId}/queue`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        setInQueue(data.inQueue);
        await fetchQueueStatus();
      }
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-600';
      case 'LIVE':
        return 'bg-green-600';
      case 'FINISHED':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatTimeControl = (tc: string) => {
    // tc is already in the format "2+0" or "1.5+3"
    return tc;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading tournament...</div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-400 mb-4">{error || 'Tournament not found'}</div>
          <button
            onClick={() => router.push('/team-tournaments')}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <span className={`text-sm px-3 py-1 rounded ${getStatusColor(tournament.status)}`}>
              {tournament.status}
            </span>
          </div>
          {tournament.description && (
            <p className="text-gray-400 mb-4">{tournament.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div>
              <div className="text-gray-400">Time Control</div>
              <div className="font-semibold">{formatTimeControl(tournament.tc)}</div>
            </div>
            <div>
              <div className="text-gray-400">Variant</div>
              <div className="font-semibold">{tournament.variant}</div>
            </div>
            <div>
              <div className="text-gray-400">Duration</div>
              <div className="font-semibold">{tournament.duration} min</div>
            </div>
            <div>
              <div className="text-gray-400">Teams</div>
              <div className="font-semibold">
                {tournament.teamCount}
                {tournament.maxTeams && `/${tournament.maxTeams}`}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Starts At</div>
              <div className="font-semibold">
                {new Date(tournament.startsAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Players Per Team</div>
              <div className="font-semibold">{tournament.playersPerTeam}</div>
            </div>
          </div>

          {session && !isUserInTournament && tournament.status === 'UPCOMING' && (
            <div className="mt-6">
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Join Tournament
              </button>
            </div>
          )}

          {session && isUserInTournament && tournament.status === 'LIVE' && (
            <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Play Next Game</h3>
              <p className="text-sm text-gray-400 mb-4">
                {inQueue
                  ? 'Waiting for opponent... You will be paired automatically.'
                  : 'Join the queue to be paired with an opponent from a different team.'}
              </p>

              {queueSize > 0 && (
                <div className="text-sm text-gray-400 mb-4">
                  {queueSize} {queueSize === 1 ? 'player' : 'players'} in queue
                </div>
              )}

              {!inQueue ? (
                <button
                  onClick={handleJoinQueue}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Join Queue
                </button>
              ) : (
                <button
                  onClick={handleLeaveQueue}
                  className="w-full bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Leave Queue
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'leaderboard' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'chat' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Chat
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <>
            {/* Team Color Legend */}
            {tournament.teamEntries.length > 1 && (
              <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-400 mb-3">Team Colors:</div>
                <div className="flex flex-wrap gap-2">
                  {tournament.teamEntries.slice(0, 10).map((entry, index) => {
                    const teamColor = getTeamColor(index);
                    return (
                      <div key={entry.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${teamColor.bg}`}></div>
                        <span className="text-xs text-gray-300">{entry.teamName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sorting Toggle */}
            {tournament.teamEntries.some(e => e.stats.totalGamesPlayed > 0) && (
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setSortBy('score')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    sortBy === 'score'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Sort by Score
                </button>
                <button
                  onClick={() => setSortBy('performance')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    sortBy === 'performance'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Sort by Performance
                </button>
              </div>
            )}

            {/* Tournament Summary Stats */}
            {tournament.teamEntries.some(e => e.stats.totalGamesPlayed > 0) && (
              <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Rankings</h3>
                <div className="grid gap-2">
                  {[...tournament.teamEntries]
                    .filter(e => e.stats.totalGamesPlayed > 0)
                    .sort((a, b) => b.stats.avgPerformance - a.stats.avgPerformance)
                    .map((entry, idx) => {
                      const actualRank = tournament.teamEntries.findIndex(e => e.id === entry.id);
                      const teamColor = getTeamColor(actualRank);
                      const perfRank = idx + 1;
                      const rankDiff = (actualRank + 1) - perfRank;

                      return (
                        <div key={entry.id} className="flex items-center justify-between bg-gray-750 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-500">#{perfRank}</span>
                            <span className="font-semibold">{entry.teamName}</span>
                            <span className={`text-xs px-2 py-1 rounded ${teamColor.bg} ${teamColor.text} font-semibold`}>
                              {teamColor.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">
                              Perf: <span className="text-blue-400 font-semibold">{entry.stats.avgPerformance}</span>
                            </span>
                            {rankDiff !== 0 && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                rankDiff > 0 ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400'
                              }`}>
                                {rankDiff > 0 ? `↓ ${rankDiff}` : `↑ ${Math.abs(rankDiff)}`} in standings
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="space-y-4">
            {(() => {
              // Sort teams based on selected sorting method
              const sortedEntries = [...tournament.teamEntries].sort((a, b) => {
                if (sortBy === 'performance') {
                  // Sort by performance (only if teams have played games)
                  if (a.stats.totalGamesPlayed === 0 && b.stats.totalGamesPlayed === 0) {
                    return b.score - a.score; // Fall back to score
                  }
                  if (a.stats.totalGamesPlayed === 0) return 1;
                  if (b.stats.totalGamesPlayed === 0) return -1;
                  return b.stats.avgPerformance - a.stats.avgPerformance;
                } else {
                  // Sort by score (default)
                  if (a.score === b.score) {
                    // Tiebreaker: use performance rating
                    return b.stats.avgPerformance - a.stats.avgPerformance;
                  }
                  return b.score - a.score;
                }
              });

              return sortedEntries.map((entry, index) => {
              const teamColor = getTeamColor(tournament.teamEntries.findIndex(e => e.id === entry.id));
              const actualScoreRank = tournament.teamEntries.findIndex(e => e.id === entry.id) + 1;
              const isTiebreaker = sortBy === 'score' && index > 0 && sortedEntries[index - 1].score === entry.score;

              return (
              <div
                key={entry.id}
                onClick={() => setSelectedTeam({ entry, rank: index + 1 })}
                className={`bg-gray-800 border-2 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors ${
                  tournament.status === 'FINISHED' && tournament.winnerTeamId === entry.teamId
                    ? 'border-yellow-500'
                    : teamColor.border
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`text-2xl font-bold px-2 py-1 rounded ${teamColor.bg} ${teamColor.text}`}>
                        #{index + 1}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Score Rank: #{actualScoreRank}
                      </div>
                      {isTiebreaker && (
                        <span className="text-xs text-yellow-400 mt-1" title="Ranked by performance (tiebreaker)">
                          TB
                        </span>
                      )}
                    </div>
                    {entry.teamAvatar ? (
                      <img src={entry.teamAvatar} alt={entry.teamName} className="w-12 h-12 rounded" />
                    ) : (
                      <div className={`w-12 h-12 ${teamColor.bg} rounded flex items-center justify-center`}>
                        <span className={`text-xl font-bold ${teamColor.text}`}>
                          {entry.teamName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{entry.teamName}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${teamColor.bg} ${teamColor.text} font-semibold`}>
                          {teamColor.name}
                        </span>
                        {entry.stats.totalGamesPlayed > 0 && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${
                              entry.stats.avgPerformance >= entry.stats.avgRating
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                            title="Average Performance Rating"
                          >
                            Perf: {entry.stats.avgPerformance}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.gamesPlayed} games • {entry.wins}W {entry.losses}L {entry.draws}D
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-400">{entry.score}</div>
                    <div className="text-sm text-gray-400">points</div>
                  </div>
                </div>

                {/* Team Statistics */}
                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-750 rounded-lg p-3">
                  <div>
                    <div className="text-xs text-gray-500">Avg Rating</div>
                    <div className="text-lg font-semibold text-white">{entry.stats.avgRating}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Avg Performance</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-blue-400">{entry.stats.avgPerformance}</div>
                      {entry.stats.avgPerformance > entry.stats.avgRating && (
                        <span className="text-xs text-green-400">↑ {entry.stats.avgPerformance - entry.stats.avgRating}</span>
                      )}
                      {entry.stats.avgPerformance < entry.stats.avgRating && (
                        <span className="text-xs text-red-400">↓ {entry.stats.avgRating - entry.stats.avgPerformance}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Active Players</div>
                    <div className="text-lg font-semibold text-white">{entry.stats.activePlayerCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Games</div>
                    <div className="text-lg font-semibold text-white">{entry.stats.totalGamesPlayed}</div>
                  </div>
                </div>

                {/* Performance Bar */}
                {entry.stats.totalGamesPlayed > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1.5">Performance vs Rating</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-900 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            entry.stats.avgPerformance >= entry.stats.avgRating
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.abs(entry.stats.avgPerformance - entry.stats.avgRating) / 5)}%`
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 w-16 text-right">
                        {entry.stats.avgPerformance >= entry.stats.avgRating ? '+' : '-'}
                        {Math.abs(entry.stats.avgPerformance - entry.stats.avgRating)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Performers */}
                {entry.stats.topPerformers.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Top Performers:</div>
                    <div className="flex gap-2 flex-wrap">
                      {entry.stats.topPerformers.map((performer, idx) => {
                        const player = entry.players.find(p => p.userId === performer.userId);
                        return (
                          <div key={performer.userId} className="bg-gray-900 rounded px-3 py-1.5 text-sm">
                            <span className="text-yellow-400">#{idx + 1}</span>
                            <span className="text-gray-400 ml-2">{player?.name || `User ${performer.userId.slice(0, 8)}`}</span>
                            <span className="text-blue-400 ml-2">Perf: {performer.performance}</span>
                            <span className="text-white ml-2">{performer.score} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <div className="text-sm font-semibold text-gray-400 mb-1">Players:</div>
                  {entry.players.map((player) => (
                    <div key={player.id} className="bg-gray-750 rounded p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          User {player.userId.slice(0, 8)}
                        </span>
                        <span className="text-sm text-gray-400">Rating: {player.rating}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span>{player.score} pts</span>
                        <span className="text-gray-400">
                          {player.gamesPlayed} games
                        </span>
                        {player.performance && (
                          <span className="text-blue-400">Perf: {player.performance}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            });
            })()}
          </div>
          </>
        )}

        {activeTab === 'chat' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="h-96 overflow-y-auto mb-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-gray-750 rounded p-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold">User {msg.userId.slice(0, 8)}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-8">No messages yet</div>
              )}
            </div>

            {session && userTeamId && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  maxLength={1000}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        <TeamSelectionModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSubmit={handleJoinTournament}
          tournamentId={tournamentId}
          maxPlayers={tournament.playersPerTeam}
        />

        {selectedTeam && (
          <TeamInfoModal
            team={selectedTeam.entry}
            rank={selectedTeam.rank}
            teamColor={getTeamColor(tournament.teamEntries.findIndex(e => e.id === selectedTeam.entry.id))}
            isOpen={true}
            onClose={() => setSelectedTeam(null)}
          />
        )}
      </div>
    </div>
  );
}
