'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Trophy, TrendingUp, Users, Target } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

interface TeamInfoModalProps {
  team: TeamEntry;
  rank: number;
  teamColor: {
    bg: string;
    text: string;
    border: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function TeamInfoModal({ team, rank, teamColor, isOpen, onClose }: TeamInfoModalProps) {
  const { data: session } = useSession();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [localTeam, setLocalTeam] = useState(team);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Update local team when prop changes
  useEffect(() => {
    setLocalTeam(team);
  }, [team]);

  // WebSocket connection and subscription
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    // Extract tournament ID from URL
    const tournamentId = window.location.pathname.split('/').pop();
    if (!tournamentId) return;

    // Determine WebSocket URL based on environment
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8080';
    const wsUrl = `${wsProtocol}//${wsHost}`;

    console.log('[WS] Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to WebSocket server');
      setWsConnected(true);

      // Send hello message with session token
      const sessionToken = (session as any)?.accessToken;
      if (sessionToken) {
        ws.send(JSON.stringify({
          t: 'hello',
          sessionId: sessionToken
        }));
      }

      // Subscribe to team tournament updates
      ws.send(JSON.stringify({
        t: 'team-tournament.subscribe',
        tournamentId
      }));

      console.log('[WS] Subscribed to tournament:', tournamentId);
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WS] Received message:', message);

        // Handle team tournament update events
        if (message.t === 'team-tournament.update' || message.t === 'team-tournament.start' || message.t === 'team-tournament.end') {
          console.log('[WS] Tournament update received, refetching data...');
          setIsRefreshing(true);

          // Fetch updated tournament data
          const response = await fetch(`/api/team-tournaments/${tournamentId}`);
          if (response.ok) {
            const data = await response.json();
            // Find the updated team data
            const updatedTeam = data.tournament.teamEntries.find((e: TeamEntry) => e.id === team.id);
            if (updatedTeam) {
              setLocalTeam(updatedTeam);
            }
          }

          setIsRefreshing(false);
        }
      } catch (error) {
        console.error('[WS] Error processing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('[WS] WebSocket connection closed');
      setWsConnected(false);
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        // Unsubscribe from tournament updates
        ws.send(JSON.stringify({
          t: 'team-tournament.unsubscribe',
          tournamentId
        }));
      }
      ws.close();
      wsRef.current = null;
    };
  }, [isOpen, autoRefresh, team.id, session]);

  if (!isOpen) return null;

  // Find top scorer (player with crown)
  const topScorer = localTeam.players.length > 0
    ? localTeam.players.reduce((max, player) =>
        player.score > max.score ? player : max
      )
    : null;

  // Sort players by score
  const sortedPlayers = [...localTeam.players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`${teamColor.bg} ${teamColor.text} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {localTeam.teamAvatar ? (
              <img src={localTeam.teamAvatar} alt={localTeam.teamName} className="w-12 h-12 rounded" />
            ) : (
              <div className={`w-12 h-12 bg-white bg-opacity-20 rounded flex items-center justify-center`}>
                <span className="text-2xl font-bold">
                  {localTeam.teamName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{localTeam.teamName}</h2>
                {isRefreshing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {!isRefreshing && wsConnected && (
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" title="Live updates connected"></div>
                )}
              </div>
              <div className="text-sm opacity-90">
                Rank #{rank} • {teamColor.name} Team
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Team Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-semibold">Score</span>
              </div>
              <div className="text-3xl font-bold text-white">{localTeam.score}</div>
              <div className="text-xs text-gray-400 mt-1">
                {localTeam.wins}W • {localTeam.losses}L • {localTeam.draws}D
              </div>
            </div>

            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-semibold">Performance</span>
              </div>
              <div className="text-3xl font-bold text-white">{localTeam.stats.avgPerformance}</div>
              <div className={`text-xs mt-1 ${
                localTeam.stats.avgPerformance >= localTeam.stats.avgRating
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {localTeam.stats.avgPerformance >= localTeam.stats.avgRating ? '+' : ''}
                {localTeam.stats.avgPerformance - localTeam.stats.avgRating} vs rating
              </div>
            </div>

            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-semibold">Players</span>
              </div>
              <div className="text-3xl font-bold text-white">{localTeam.stats.activePlayerCount}</div>
              <div className="text-xs text-gray-400 mt-1">
                active members
              </div>
            </div>

            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Target className="w-5 h-5" />
                <span className="text-sm font-semibold">Games</span>
              </div>
              <div className="text-3xl font-bold text-white">{localTeam.stats.totalGamesPlayed}</div>
              <div className="text-xs text-gray-400 mt-1">
                total played
              </div>
            </div>
          </div>

          {/* Players List */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Roster
            </h3>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-gray-750 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-500 w-8">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          User {player.userId.slice(0, 8)}
                        </span>
                        {topScorer && player.id === topScorer.id && (
                          <span className="text-yellow-400" title="Top scorer">
                            👑
                          </span>
                        )}
                        {player.streak >= 2 && (
                          <span
                            className="text-orange-500"
                            title={`${player.streak} win streak! Earning doubled points`}
                          >
                            🔥
                          </span>
                        )}
                        {!player.active && (
                          <span className="text-xs px-2 py-1 bg-gray-600 text-gray-400 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Rating: {player.rating}
                        {player.performance && (
                          <span className={`ml-2 ${
                            player.performance >= player.rating
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}>
                            • Perf: {player.performance}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-400">{player.score}</div>
                    <div className="text-xs text-gray-400">
                      {player.gamesPlayed} games • {player.wins}-{player.losses}-{player.draws}
                    </div>
                  </div>
                </div>
              ))}
              {sortedPlayers.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No players in this team
                </div>
              )}
            </div>
          </div>

          {/* Live Updates Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                Live updates via WebSocket
              </span>
              {wsConnected && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                  <span>Connected</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                autoRefresh
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {autoRefresh ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
