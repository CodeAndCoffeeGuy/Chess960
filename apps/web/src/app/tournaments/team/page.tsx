'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface TeamTournament {
  id: string;
  name: string;
  description: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  tc: string;
  startsAt: string;
  duration: number;
  endsAt: string | null;
  maxTeams: number | null;
  playersPerTeam: number;
  nbLeaders: number;
  teamCount: number;
  createdBy: string;
}

export default function TeamTournamentsPage() {
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<TeamTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'UPCOMING' | 'LIVE' | 'FINISHED'>('all');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? '/api/tournaments/team'
        : `/api/tournaments/team?status=${filter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
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
        return 'text-blue-400 bg-blue-400/10';
      case 'LIVE':
        return 'text-green-400 bg-green-400/10 animate-pulse';
      case 'FINISHED':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-[#a0958a]';
    }
  };

  const formatTimeControl = (tc: string) => {
    // tc is already in the format "2+0" or "1.5+3"
    return tc;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Started';
    if (minutes < 60) return `in ${minutes}m`;
    if (hours < 24) return `in ${hours}h`;
    return `in ${days}d`;
  };

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Team Tournaments
          </h1>
          <div className="text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto space-y-2">
            <p>
              Compete with your team in Chess960 battles. Coordinate with teammates to dominate the leaderboard.
            </p>
            <p>
              <strong className="text-white light:text-black">Scoring:</strong> Top {tournaments[0]?.nbLeaders || 5} players per team count toward the team score
            </p>
            <p className="text-sm text-[#6b6460] light:text-[#a0958a]">
              Team performance is calculated from your best performing members.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {['all', 'LIVE', 'UPCOMING', 'FINISHED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                filter === tab
                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-lg'
                  : 'bg-[#35322e] light:bg-white text-[#a0958a] light:text-[#5a5449] hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba]'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Create Team Tournament Button */}
        {session && (
          <div className="mb-8 text-center">
            <Link
              href="/team-tournaments/create"
              className="inline-block bg-gradient-to-r from-orange-400 to-orange-400 hover:from-orange-500 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Team Tournament
            </Link>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
            <p className="mt-4 text-[#a0958a] light:text-[#5a5449]">Loading tournaments...</p>
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && (
          <>
            {tournaments.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-[#a0958a] light:text-[#5a5449]">No team tournaments found</p>
                {!session && (
                  <p className="text-sm text-[#6b6460] light:text-[#a0958a] mt-2">
                    Sign in to create a team tournament
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/team/${tournament.id}`}
                    className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6 hover:border-orange-300/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          tournament.status
                        )}`}
                      >
                        {tournament.status === 'LIVE' && (
                          <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                        )}
                        {tournament.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-orange-400">
                        <span className="font-semibold">{formatTimeControl(tournament.tc)}</span>
                      </div>
                    </div>

                    {/* Tournament Name */}
                    <h3 className="text-xl font-bold text-white light:text-black mb-3 line-clamp-2">
                      {tournament.name}
                    </h3>

                    {/* Description */}
                    {tournament.description && (
                      <p className="text-sm text-[#a0958a] light:text-[#5a5449] mb-4 line-clamp-2">
                        {tournament.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-2 text-[#c1b9ad] light:text-[#5a5449]">
                        <span>
                          {tournament.status === 'UPCOMING'
                            ? formatDate(tournament.startsAt)
                            : tournament.status === 'LIVE'
                            ? 'In Progress'
                            : 'Finished'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[#c1b9ad] light:text-[#5a5449]">
                        <span>{tournament.duration} minutes</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#c1b9ad] light:text-[#5a5449]">
                        <span>
                          {tournament.teamCount} team{tournament.teamCount !== 1 ? 's' : ''}
                          {tournament.maxTeams && ` / ${tournament.maxTeams}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[#c1b9ad] light:text-[#5a5449]">
                        <span>{tournament.playersPerTeam} players per team</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
