'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestProfile } from '@/components/guest/GuestProfile';
import { verifyGuestTokenClientSide } from '@chess960/utils';

export default function GuestProfilePage() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGuestStatus();
  }, []);

  const checkGuestStatus = () => {
    try {
      const authToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      if (!authToken) {
        router.push('/');
        return;
      }

      const payload = verifyGuestTokenClientSide(authToken);

      if (!payload || !payload.userId || payload.type !== 'guest') {
        router.push('/');
        return;
      }

      setIsGuest(true);
    } catch (error) {
      console.error('Error checking guest status:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-[#b6aea2] light:text-[#5a5449]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isGuest) {
    return null; // Will redirect
  }

  return (
    <div className="relative min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white light:text-black mb-2">Guest Profile</h1>
            <p className="text-[#a0958a] light:text-[#5a5449]">
              Your guest session progress and statistics
            </p>
          </div>
          
          <GuestProfile />
        </div>
      </div>
    </div>
  );
}
