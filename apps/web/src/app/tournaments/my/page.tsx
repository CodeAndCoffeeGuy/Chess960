'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Tournament {
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
  playerCount: number;
  createdBy: string;
  isCreator: boolean;
  myStats: {
    score: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
  } | null;
}

export default function MyTournamentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'playing' | 'created'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyTournaments();
    }
  }, [filter, status]);

  const fetchMyTournaments = async () => {
    setLoading(true);
    try {
      const url = `/api/tournaments/my?filter=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Failed to fetch my tournaments:', error);
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

    if (diff < 0) return date.toLocaleDateString();
    if (minutes < 60) return `in ${minutes}m`;
    if (hours < 24) return `in ${hours}h`;
    return `in ${days}d`;
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
          <p className="mt-4 text-[#a0958a] light:text-[#5a5449]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            My Tournaments
          </h1>
          <div className="text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto space-y-2">
            <p>
              View all tournaments you&apos;ve joined or created
            </p>
            <Link
              href="/tournaments"
              className="text-sm text-orange-400 hover:text-orange-300 transition-colors inline-block"
            >
              ← Back to All Tournaments
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'playing', label: 'Playing' },
            { key: 'created', label: 'Created' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white shadow-lg'
                  : 'bg-[#35322e] light:bg-white text-[#a0958a] light:text-[#5a5449] hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                <p className="text-xl text-[#a0958a] light:text-[#5a5449] mb-2">No tournaments found</p>
                <p className="text-sm text-[#6b6460] light:text-[#a0958a] mb-6">
                  {filter === 'playing' && "You haven't joined any tournaments yet"}
                  {filter === 'created' && "You haven't created any tournaments yet"}
                  {filter === 'all' && "You haven't participated in any tournaments yet"}
                </p>
                <Link
                  href="/tournaments"
                  className="inline-block bg-gradient-to-r from-orange-400 to-orange-400 hover:from-orange-500 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Browse Tournaments
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
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
                      {tournament.isCreator && (
                        <span className="ml-2 text-xs text-orange-400">(Created)</span>
                      )}
                    </h3>

                    {/* My Stats */}
                    {tournament.myStats && (
                      <div className="mb-4 p-3 bg-[#2a2723] light:bg-[#faf7f2] rounded-lg">
                        <p className="text-xs text-[#6b6460] light:text-[#a0958a] mb-2">Your Performance</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white light:text-black font-semibold">Score: {tournament.myStats.score}</span>
                          <span className="text-[#a0958a] light:text-[#5a5449]">
                            {tournament.myStats.wins}W {tournament.myStats.draws}D {tournament.myStats.losses}L
                          </span>
                        </div>
                      </div>
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
                          {tournament.playerCount} player{tournament.playerCount !== 1 ? 's' : ''}
                          {tournament.maxPlayers && ` / ${tournament.maxPlayers}`}
                        </span>
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
