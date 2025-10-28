'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Trophy, UserPlus, UserCheck } from 'lucide-react';

interface PlayerInfo {
  handle: string;
  fullName?: string;
  country?: string;
  state?: string;
  gamesPlayed: number;
  rating: number;
  isFollowing?: boolean;
}

interface PlayerHoverCardProps {
  handle: string;
  rating: number;
  children: React.ReactNode;
  onFollow?: (handle: string) => void;
  onUnfollow?: (handle: string) => void;
}

export function PlayerHoverCard({ handle, rating, children, onFollow, onUnfollow }: PlayerHoverCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch player info when hovering
  useEffect(() => {
    if (isHovering && !playerInfo) {
      const fetchPlayerInfo = async () => {
        setLoading(true);
        try {
          // Fetch player profile data
          const response = await fetch(`/api/user/profile/${handle}`);
          if (response.ok) {
            const data = await response.json();
            setPlayerInfo({
              handle: data.handle,
              fullName: data.name,
              country: data.country,
              state: data.state,
              gamesPlayed: data.gamesPlayed || 0,
              rating: rating,
              isFollowing: data.isFollowing || false,
            });
            setIsFollowing(data.isFollowing || false);
          }
        } catch (error) {
          console.error('Failed to fetch player info:', error);
        } finally {
          setLoading(false);
        }
      };

      // Small delay before fetching to avoid unnecessary requests
      const timeout = setTimeout(fetchPlayerInfo, 300);
      return () => clearTimeout(timeout);
    }
  }, [isHovering, playerInfo, handle, rating]);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/user/unfollow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle }),
        });

        if (response.ok) {
          setIsFollowing(false);
          if (onUnfollow) onUnfollow(handle);
        }
      } else {
        // Follow
        const response = await fetch(`/api/user/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle }),
        });

        if (response.ok) {
          setIsFollowing(true);
          if (onFollow) onFollow(handle);
        }
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {children}
      </div>

      {/* Hover Card */}
      {isHovering && (
        <div
          className="absolute left-0 bottom-full mb-2 z-[100] w-72 animate-[fadeIn_0.15s_ease-out]"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="bg-[#2a2825] border-2 border-[#3a3632] rounded-xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-[#3a3632] p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-white truncate">{handle}</div>
                  {loading ? (
                    <div className="h-4 w-24 bg-[#3a3632] rounded animate-pulse mt-1"></div>
                  ) : playerInfo?.fullName ? (
                    <div className="text-sm text-gray-400 truncate">{playerInfo.fullName}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {loading ? (
                <>
                  <div className="h-4 bg-[#3a3632] rounded animate-pulse"></div>
                  <div className="h-4 bg-[#3a3632] rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-[#3a3632] rounded animate-pulse w-1/2"></div>
                </>
              ) : playerInfo ? (
                <>
                  {/* Location */}
                  {(playerInfo.country || playerInfo.state) && (
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>
                        {[playerInfo.state, playerInfo.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Trophy className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>Rating: <span className="font-bold text-orange-300">{playerInfo.rating}</span></span>
                  </div>

                  {/* Games Played */}
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Games Played: <span className="font-bold text-white">{playerInfo.gamesPlayed}</span></span>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={handleFollowClick}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      isFollowing
                        ? 'bg-gray-600/30 hover:bg-gray-600/40 text-gray-300 border border-gray-600/50'
                        : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* View Profile Link */}
                  <a
                    href={`/profile/${handle}`}
                    className="block text-center text-sm text-orange-400 hover:text-orange-300 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Full Profile →
                  </a>
                </>
              ) : (
                <div className="text-sm text-gray-400 text-center py-2">
                  Failed to load player info
                </div>
              )}
            </div>
          </div>

          {/* Triangle pointer - pointing down */}
          <div className="absolute left-8 -bottom-2 w-4 h-4 bg-[#2a2825] border-r-2 border-b-2 border-[#3a3632] transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
