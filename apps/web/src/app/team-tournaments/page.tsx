'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface TeamTournament {
  id: string;
  name: string;
  description: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  tc: string;
  variant: string;
  startsAt: string;
  duration: number;
  maxTeams: number | null;
  playersPerTeam: number;
  _count: {
    teamEntries: number;
  };
}

export default function TeamTournamentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<TeamTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'UPCOMING' | 'LIVE' | 'FINISHED'>('all');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const res = await fetch(`/api/team-tournaments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Failed to fetch team tournaments:', error);
    } finally {
      setLoading(false);
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
    return tc.replace('_PLUS_', '+').replace('_', ' ');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading team tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Team Tournaments</h1>
          {session && (
            <button
              onClick={() => router.push('/team-tournaments/create')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
            >
              Create Team Tournament
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`px-4 py-2 rounded ${
              filter === 'UPCOMING' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('LIVE')}
            className={`px-4 py-2 rounded ${
              filter === 'LIVE' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setFilter('FINISHED')}
            className={`px-4 py-2 rounded ${
              filter === 'FINISHED' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Finished
          </button>
        </div>

        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => router.push(`/team-tournaments/${tournament.id}`)}
              className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-6 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{tournament.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(tournament.status)}`}>
                      {tournament.status}
                    </span>
                  </div>
                  {tournament.description && (
                    <p className="text-gray-400 mb-2">{tournament.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    {tournament._count.teamEntries}
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
            </div>
          ))}
        </div>

        {tournaments.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">No team tournaments found</p>
            {session && (
              <p className="mt-2">Create the first team tournament!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
