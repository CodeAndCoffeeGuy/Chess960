'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TournamentCalendarView } from '@/components/tournament/TournamentCalendarView';

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
}


export default function TournamentCalendarPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments?status=UPCOMING');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleCreateAtTime = (startTime: Date) => {
    // Format the date for the create page
    const timestamp = startTime.getTime();
    router.push(`/tournaments/create?startTime=${timestamp}`);
  };

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Simple Back Link */}
        <Link
          href="/tournaments"
          className="text-orange-400 hover:text-orange-300 font-semibold mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
          </div>
        )}

        {/* Calendar */}
        {!loading && (
          <TournamentCalendarView
            tournaments={tournaments}
            onCreateAtTime={handleCreateAtTime}
          />
        )}
      </div>
    </div>
  );
}
