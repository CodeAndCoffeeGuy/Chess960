'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

interface Spectator {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    handle: string;
    fullName: string | null;
    image: string | null;
  };
}

interface SpectatorListProps {
  gameId: string;
}

export function SpectatorList({ gameId }: SpectatorListProps) {
  const [spectators, setSpectators] = useState<Spectator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpectators();

    // Poll for spectator updates every 5 seconds
    const interval = setInterval(fetchSpectators, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchSpectators = async () => {
    try {
      const response = await fetch(`/api/game/${gameId}/spectate`);
      if (response.ok) {
        const data = await response.json();
        setSpectators(data.spectators);
      }
    } catch (error) {
      console.error('Failed to fetch spectators:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (spectators.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#35322e]/50 backdrop-blur-sm rounded-lg border border-[#474239] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-bold text-white">
          Spectators ({spectators.length})
        </h3>
      </div>
      <div className="space-y-1">
        {spectators.map((spec) => (
          <div
            key={spec.id}
            className="flex items-center gap-2 p-2 bg-[#2a2723] rounded border border-[#3e3a33]"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {spec.user.handle[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{spec.user.handle}</p>
              {spec.user.fullName && (
                <p className="text-xs text-[#6b6460]">{spec.user.fullName}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
