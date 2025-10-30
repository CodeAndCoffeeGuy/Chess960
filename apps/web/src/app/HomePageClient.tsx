'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TimeControlModal } from '@/components/game/TimeControlModal';
import { LiveStats } from '@/components/LiveStats';
import { BetaNotification } from '@/components/BetaNotification';
import { useHomepageWebSocket } from '@/hooks/useHomepageWebSocket';

export default function HomePageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeControlModalOpen, setTimeControlModalOpen] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<'bullet' | 'blitz' | 'rapid' | 'classical'>('bullet');
  const [isVisible, setIsVisible] = useState(false);

  // Establish WebSocket connection for online user tracking
  useHomepageWebSocket();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePlayClick = () => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else {
      setTimeControlModalOpen(true);
    }
  };

  const handleTimeControlSelect = (speed: 'bullet' | 'blitz' | 'rapid' | 'classical') => {
    setSelectedSpeed(speed);
    setTimeControlModalOpen(false);
    router.push(`/play?speed=${speed}`);
  };

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <BetaNotification />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-300/10 via-transparent to-orange-400/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center">
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                Chess960
              </span>
            </h1>
            
            <p className={`text-lg sm:text-xl md:text-2xl text-[#a0958a] light:text-[#5a5449] mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              Fischer Random Chess - No opening theory, just pure chess skill
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <button
                onClick={handlePlayClick}
                className="group relative px-8 py-4 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-400/25"
              >
                <span className="relative z-10">Play Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button
                onClick={() => router.push('/leaderboard')}
                className="px-8 py-4 border-2 border-orange-300/30 hover:border-orange-300 text-orange-300 hover:text-white hover:bg-orange-300/10 font-semibold rounded-xl transition-all duration-300"
              >
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white light:text-black mb-4">
              Why Chess960?
            </h2>
            <p className="text-lg text-[#a0958a] light:text-[#5a5449] max-w-2xl mx-auto">
              Experience chess like never before with randomized starting positions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-[#2a2723] light:bg-white rounded-xl border border-[#3e3a33] light:border-[#d4caba]">
              <div className="w-16 h-16 bg-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">♔</span>
              </div>
              <h3 className="text-xl font-semibold text-white light:text-black mb-2">No Opening Theory</h3>
              <p className="text-[#a0958a] light:text-[#5a5449]">
                Every game starts fresh with randomized positions, eliminating memorized openings
              </p>
            </div>

            <div className="text-center p-6 bg-[#2a2723] light:bg-white rounded-xl border border-[#3e3a33] light:border-[#d4caba]">
              <div className="w-16 h-16 bg-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white light:text-black mb-2">Pure Skill</h3>
              <p className="text-[#a0958a] light:text-[#5a5449]">
                Focus on tactics, strategy, and calculation rather than memorization
              </p>
            </div>

            <div className="text-center p-6 bg-[#2a2723] light:bg-white rounded-xl border border-[#3e3a33] light:border-[#d4caba]">
              <div className="w-16 h-16 bg-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold text-white light:text-black mb-2">Global Competition</h3>
              <p className="text-[#a0958a] light:text-[#5a5449]">
                Play against players worldwide with our Glicko rating system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="py-16 bg-[#2a2723] light:bg-[#f5f1ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveStats />
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white light:text-black mb-6">
            Ready to Play?
          </h2>
          <p className="text-lg text-[#a0958a] light:text-[#5a5449] mb-8">
            Join thousands of players and discover the true essence of chess
          </p>
          <button
            onClick={handlePlayClick}
            className="px-8 py-4 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-400/25"
          >
            Start Playing Now
          </button>
        </div>
      </div>

      {/* Time Control Modal */}
      <TimeControlModal
        isOpen={timeControlModalOpen}
        onClose={() => setTimeControlModalOpen(false)}
        onSelect={handleTimeControlSelect}
        selectedSpeed={selectedSpeed}
      />
    </div>
  );
}
