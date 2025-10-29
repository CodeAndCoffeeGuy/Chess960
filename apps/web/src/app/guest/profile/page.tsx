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

  const checkGuestStatus = async () => {
    try {
      console.log('[DEBUG] All cookies:', document.cookie);
      let authToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      console.log('[DEBUG] Extracted auth token:', authToken);
      
      // If no token exists, create a guest token
      if (!authToken) {
        console.log('No guest token found, creating one...');
        try {
          const response = await fetch('/api/auth/guest-simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Guest token created:', data);
            // The cookie should be set by the response
            // Wait a moment for the cookie to be set, then re-check for the token
            await new Promise(resolve => setTimeout(resolve, 100));
            authToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
            console.log('Auth token after API call and delay:', authToken);
          } else {
            console.error('Failed to create guest token');
            router.push('/');
            return;
          }
        } catch (error) {
          console.error('Error creating guest token:', error);
          router.push('/');
          return;
        }
      }

      if (!authToken) {
        console.error('Still no auth token after creation attempt');
        router.push('/');
        return;
      }

      console.log('Auth token found:', authToken);
      console.log('Token length:', authToken?.length);
      console.log('Token preview:', authToken?.substring(0, 50) + '...');
      
      const payload = verifyGuestTokenClientSide(authToken);
      console.log('Parsed payload:', payload);

      if (!payload || !payload.userId || payload.type !== 'guest') {
        console.error('Invalid guest token payload:', payload);
        router.push('/');
        return;
      }

      console.log('Guest token validated successfully:', payload);
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
