'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Play, User } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  handle: string;
  email: string | null;
  type: 'user' | 'guest';
  totalGames: number;
  ratings: {
    '1+0': { rating: number; rd: number };
    '1+1': { rating: number; rd: number };
  };
}

export default function AuthSuccessPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#1f1d1a] text-white overflow-hidden flex items-center justify-center">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
               style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.35), rgba(59,130,246,0.15) 45%, transparent 60%)' }} />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1f1d1a] text-white overflow-hidden flex items-center justify-center p-4">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.35), rgba(59,130,246,0.15) 45%, transparent 60%)' }} />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      </div>

      <div className="relative max-w-md w-full bg-[#2a2723]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#3e3a33] p-8 text-center">
        {/* Success Icon */}
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
        
        {/* Welcome Message */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent mb-2">Welcome to Chess960!</h1>
        <p className="text-[#b6aea2] mb-6">
          {user?.type === 'user'
            ? 'You\'ve successfully signed in to your account.'
            : 'You\'re playing as a guest.'
          }
        </p>

        {/* User Info */}
        {user && (
          <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <User className="h-6 w-6 text-orange-400" />
              <span className="font-semibold text-white">{user.handle}</span>
              {user.type === 'user' && (
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                  Verified
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#a0958a]">1+0 Rating</div>
                <div className="font-bold text-orange-400">
                  {Math.round(user.ratings['1+0']?.rating || 1500)}
                </div>
              </div>
              <div>
                <div className="text-[#a0958a]">1+1 Rating</div>
                <div className="font-bold text-purple-400">
                  {Math.round(user.ratings['1+1']?.rating || 1500)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Link
            href="/play"
            className="w-full bg-[#35322e] border border-[#474239] hover:border-orange-500/70 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_34px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 inline-flex items-center justify-center space-x-2"
          >
            <Play className="h-5 w-5" />
            <span>Start Playing</span>
          </Link>

          <Link
            href="/profile"
            className="w-full bg-[#292622]/70 border border-[#3e3a33] hover:border-orange-500/50 text-[#c1b9ad] hover:text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_34px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 block"
          >
            View Profile
          </Link>
        </div>

        {/* Tips */}
        <div className="text-left bg-[#292622]/70 border border-[#3e3a33] rounded-2xl p-4">
          <h3 className="font-semibold text-orange-400 mb-2">Quick Tips</h3>
          <ul className="text-sm text-[#c1b9ad] space-y-1">
            <li>• Use premoves to stay ahead in time pressure</li>
            <li>• Focus on piece activity over material</li>
            <li>• Practice your mouse accuracy and speed</li>
            <li>• Stay calm when time gets low</li>
          </ul>
        </div>
      </div>
    </div>
  );
}