'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Clock, Trophy, Zap, Target, Filter, X } from 'lucide-react';
import { TimeControlModal } from '@/components/game/TimeControlModal';

interface Lobby {
  id: string;
  hostId: string;
  hostHandle: string;
  hostRating: number;
  timeControl: string;
  rated: boolean;
  minRating: number;
  maxRating: number;
  speed: 'bullet' | 'blitz' | 'rapid' | 'classical';
  createdAt: string;
}

const SPEED_ICONS = {
  bullet: Zap,
  blitz: Target,
  rapid: Clock,
  classical: Trophy,
};

export default function LobbyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [speedFilter, setSpeedFilter] = useState<string | null>(null);
  const [ratedFilter, setRatedFilter] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasActiveLobby, setHasActiveLobby] = useState(false);
  const [activeLobby, setActiveLobby] = useState<Lobby | null>(null);
  const [showActiveLobbyAlert, setShowActiveLobbyAlert] = useState(false);

  // Fetch lobbies
  const fetchLobbies = async () => {
    try {
      const params = new URLSearchParams();
      if (speedFilter) params.set('speed', speedFilter);
      if (ratedFilter !== null) params.set('rated', ratedFilter.toString());

      const response = await fetch(`/api/lobby?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLobbies(data.lobbies || []);
        
        // Check if user has an active lobby
        if (session?.user) {
          const userLobby = data.lobbies?.find((lobby: Lobby) => 
            (session.user as any).id === lobby.hostId
          );
          if (userLobby) {
            setHasActiveLobby(true);
            setActiveLobby(userLobby);
          } else {
            setHasActiveLobby(false);
            setActiveLobby(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch lobbies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, [speedFilter, ratedFilter]);

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to the game
        router.push(`/play/${data.gameId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join lobby');
      }
    } catch (error) {
      console.error('Failed to join lobby:', error);
      alert('Failed to join lobby');
    }
  };

  const handleDeleteLobby = async (lobbyId: string) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh lobbies
        fetchLobbies();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete lobby');
      }
    } catch (error) {
      console.error('Failed to delete lobby:', error);
    }
  };

  const handleCreateLobbyClick = () => {
    if (hasActiveLobby) {
      setShowActiveLobbyAlert(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const getSpeedLabel = (tc: string): string => {
    const [mins] = tc.split('+').map(Number);
    if (mins < 3) return 'bullet';
    if (mins < 10) return 'blitz';
    if (mins < 30) return 'rapid';
    return 'classical';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#b6aea2] light:text-[#5a5449]">Loading lobbies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white light:text-black flex items-center gap-2 sm:gap-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-orange-400" />
                Game Lobbies
              </h1>
              <p className="text-[#b6aea2] light:text-[#5a5449] mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
                Join an existing lobby or create your own
              </p>
            </div>
            <button
              onClick={handleCreateLobbyClick}
              className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] text-xs sm:text-sm md:text-base w-full sm:w-auto"
            >
              Create Lobby
            </button>
          </div>

          {/* Filters */}
          <div className="bg-[#2a2926] light:bg-white border border-[#454038] light:border-[#d4caba] rounded-lg p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a0958a] light:text-[#5a5449]" />
              <span className="text-xs sm:text-sm font-semibold text-[#a0958a] light:text-[#5a5449]">Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Speed Filters */}
              {['bullet', 'blitz', 'rapid', 'classical'].map((speed) => {
                return (
                  <button
                    key={speed}
                    onClick={() => setSpeedFilter(speedFilter === speed ? null : speed)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all text-xs sm:text-sm font-medium ${
                      speedFilter === speed
                        ? 'bg-orange-300 border-orange-300 text-white'
                        : 'bg-[#35322e] light:bg-[#faf7f2] border-[#474239] light:border-[#d4caba] text-[#c1b9ad] light:text-[#4a453e] hover:border-orange-300/50'
                    }`}
                  >
                    <span className="capitalize">{speed}</span>
                  </button>
                );
              })}

              {/* Rated Filter */}
              <button
                onClick={() => setRatedFilter(ratedFilter === true ? null : true)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all text-xs sm:text-sm font-medium ${
                  ratedFilter === true
                    ? 'bg-orange-300 border-orange-300 text-white'
                    : 'bg-[#35322e] light:bg-[#faf7f2] border-[#474239] light:border-[#d4caba] text-[#c1b9ad] light:text-[#4a453e] hover:border-orange-300/50'
                }`}
              >
                <span>Rated</span>
              </button>

              <button
                onClick={() => setRatedFilter(ratedFilter === false ? null : false)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all text-xs sm:text-sm font-medium ${
                  ratedFilter === false
                    ? 'bg-orange-300 border-orange-300 text-white'
                    : 'bg-[#35322e] light:bg-[#faf7f2] border-[#474239] light:border-[#d4caba] text-[#c1b9ad] light:text-[#4a453e] hover:border-orange-300/50'
                }`}
              >
                <span>Casual</span>
              </button>

              {/* Clear Filters */}
              {(speedFilter || ratedFilter !== null) && (
                <button
                  onClick={() => {
                    setSpeedFilter(null);
                    setRatedFilter(null);
                  }}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all text-xs sm:text-sm font-medium"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Lobby Alert */}
        {showActiveLobbyAlert && activeLobby && (
          <div className="mb-4 sm:mb-6 bg-orange-300/10 border border-orange-300/30 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-300/20 rounded-full flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-white light:text-black mb-2">
                  You already have an active lobby
                </h3>
                <div className="bg-[#2a2926] light:bg-white border border-[#454038] light:border-[#d4caba] rounded-lg p-2.5 sm:p-3 mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-[#35322e] light:bg-[#faf7f2] rounded-lg">
                      {(() => {
                        const speed = getSpeedLabel(activeLobby.timeControl);
                        const Icon = SPEED_ICONS[speed as keyof typeof SPEED_ICONS];
                        return <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <span className="font-mono text-base sm:text-lg font-bold text-white light:text-black">
                          {activeLobby.timeControl}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold ${
                          activeLobby.rated
                            ? 'bg-orange-300/20 text-orange-400'
                            : 'bg-[#474239] light:bg-[#d4caba] text-[#a0958a] light:text-[#5a5449]'
                        }`}>
                          {activeLobby.rated ? 'Rated' : 'Casual'}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-[#a0958a] light:text-[#5a5449]">
                        Rating: {activeLobby.minRating} - {activeLobby.maxRating}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setShowActiveLobbyAlert(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] text-[#c1b9ad] light:text-[#4a453e] rounded-lg hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] transition-colors text-xs sm:text-sm font-medium"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleDeleteLobby(activeLobby.id)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-400/20 border border-orange-400/50 text-red-400 rounded-lg hover:bg-orange-400/30 transition-colors text-xs sm:text-sm font-medium"
                  >
                    Cancel Lobby
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lobbies List */}
        {lobbies.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[#474239] light:text-[#d4caba] mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-[#a0958a] light:text-[#5a5449]">
              No lobbies available
            </h2>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:gap-3 md:gap-4">
            {lobbies.map((lobby) => {
              const speed = getSpeedLabel(lobby.timeControl);
              const Icon = SPEED_ICONS[speed as keyof typeof SPEED_ICONS];
              const isMyLobby = session?.user && (session.user as any).id === lobby.hostId;

              return (
                <div
                  key={lobby.id}
                  className="bg-[#2a2926] light:bg-white border border-[#454038] light:border-[#d4caba] rounded-lg p-3 sm:p-4 md:p-6 hover:border-orange-300/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
                      {/* Speed Icon */}
                      <div className="p-1.5 sm:p-2 md:p-3 bg-[#35322e] light:bg-[#faf7f2] rounded-lg flex-shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400" />
                      </div>

                      {/* Lobby Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-0.5 sm:mb-1">
                          <span className="font-mono text-sm sm:text-base md:text-lg font-bold text-white light:text-black">
                            {lobby.timeControl}
                          </span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold w-fit ${
                            lobby.rated
                              ? 'bg-orange-300/20 text-orange-400'
                              : 'bg-[#474239] light:bg-[#d4caba] text-[#a0958a] light:text-[#5a5449]'
                          }`}>
                            {lobby.rated ? 'Rated' : 'Casual'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm text-[#a0958a] light:text-[#5a5449]">
                          <span className="truncate">Host: <span className="font-semibold text-white light:text-black">{lobby.hostHandle}</span> ({lobby.hostRating})</span>
                          <span className="truncate">Rating: {lobby.minRating} - {lobby.maxRating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {isMyLobby ? (
                        <button
                          onClick={() => handleDeleteLobby(lobby.id)}
                          className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-orange-400/20 border border-orange-400/50 text-red-400 font-bold rounded-lg hover:bg-orange-400/30 transition-all text-xs sm:text-sm md:text-base"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinLobby(lobby.id)}
                          className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] text-xs sm:text-sm md:text-base"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Control Modal */}
      <TimeControlModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        defaultSpeed="bullet"
        userRating={(session?.user as any)?.ratings?.find((r: any) => r.tc === '1+0')?.rating || 1500}
        onLobbyCreated={() => {
          setIsModalOpen(false);
          fetchLobbies(); // Refresh the lobby list
        }}
        onError={(error) => {
          console.error('Lobby creation error:', error);
          // If the error is about having an active lobby, show the alert
          if (error.includes('already have an active lobby') || error.includes('active lobby')) {
            setShowActiveLobbyAlert(true);
          }
        }}
      />
    </div>
  );
}
