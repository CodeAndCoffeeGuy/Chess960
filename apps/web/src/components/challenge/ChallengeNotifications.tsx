'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Swords, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Challenge {
  id: string;
  tc: string;
  rated: boolean;
  createdAt: string;
  expiresAt: string;
  sender: {
    id: string;
    handle: string;
    fullName: string | null;
    image: string | null;
    ratings: Array<{
      tc: string;
      rating: string;
      rd: string;
    }>;
  };
}

export function ChallengeNotifications() {
  const { data: session } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchChallenges();
      // Poll every 5 seconds
      const interval = setInterval(fetchChallenges, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenge/incoming');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    }
  };

  const handleAccept = async (challengeId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/challenge/${challengeId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Show success message with game info if available
        if (data.gameId) {
          alert(`Challenge accepted! Game ${data.gameId} starting...`);
        } else {
          alert(`Challenge accepted! Game starting...`);
        }
        // Navigate to play page where active games are played
        router.push('/play');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to accept challenge');
        fetchChallenges(); // Refresh to remove expired/invalid challenges
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (challengeId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/challenge/${challengeId}`, {
        method: 'DELETE',
      });
      fetchChallenges(); // Refresh list
    } catch (error) {
      console.error('Failed to decline challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (challenges.length === 0) {
    return null;
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expires - now) / 1000));
    return remaining;
  };

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm space-y-2">
      {challenges.map((challenge) => {
        const timeRemaining = getTimeRemaining(challenge.expiresAt);
        const senderRating = challenge.sender.ratings.find(r => r.tc === challenge.tc);

        return (
          <div
            key={challenge.id}
            className="bg-[#2a2723] border-2 border-orange-500 rounded-xl p-4 shadow-2xl animate-slide-in"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                <Swords className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-sm truncate">
                    {challenge.sender.handle} challenges you!
                  </h3>
                  <div className="text-xs text-orange-400 font-bold ml-2">
                    {timeRemaining}s
                  </div>
                </div>
                <div className="text-xs text-[#a0958a] space-y-1">
                  <div>
                    {challenge.tc === 'ONE_PLUS_ZERO' ? '1+0' : '2+0'} Bullet
                    {challenge.rated && ' • Rated'}
                  </div>
                  {senderRating && (
                    <div>
                      Rating: {Math.round(Number(senderRating.rating))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAccept(challenge.id)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm font-bold"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(challenge.id)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm font-bold"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
