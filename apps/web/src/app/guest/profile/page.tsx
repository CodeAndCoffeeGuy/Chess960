'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestProfile } from '@/components/guest/GuestProfile';
import { getUserContextFromCookies, clearAuthToken, GHOST_USERNAME } from '@chess960/utils';

export default function GuestProfilePage() {
  const router = useRouter();
  const [userContext, setUserContext] = useState<{ isAuth: boolean; username?: string; type?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      // Get user context from cookies
      const context = getUserContextFromCookies();

      // If user is authenticated (has a real account), redirect to user profile
      if (context.isAuth) {
        console.log('Authenticated user detected, redirecting to user profile');
        console.log('User context:', context);
        if (context.username) {
          // First check if the user actually exists in the database
          try {
            const response = await fetch(`/api/user/stats/${context.username}`);
            if (response.ok) {
              router.push(`/profile/${context.username}`);
            } else {
              console.log('User not found in database, clearing token and staying as guest');
              clearAuthToken();
              // Create a new guest token and stay on guest profile page
              try {
                const response = await fetch('/api/auth/guest-simple', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                if (response.ok) {
                  console.log('Guest token created after clearing invalid user token');
                  // Wait a moment for the cookie to be set, then re-check
                  await new Promise(resolve => setTimeout(resolve, 100));
                  const newContext = getUserContextFromCookies();
                  setUserContext(newContext);
                } else {
                  console.error('Failed to create guest token after clearing invalid user token');
                  setUserContext({ isAuth: false, type: 'guest' });
                }
              } catch (error) {
                console.error('Error creating guest token after clearing invalid user token:', error);
                setUserContext({ isAuth: false, type: 'guest' });
              }
            }
          } catch (error) {
            console.log('Error checking user existence, clearing token and staying as guest');
            clearAuthToken();
            // Create a new guest token and stay on guest profile page
            try {
              const response = await fetch('/api/auth/guest-simple', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                console.log('Guest token created after error clearing invalid user token');
                // Wait a moment for the cookie to be set, then re-check
                await new Promise(resolve => setTimeout(resolve, 100));
                const newContext = getUserContextFromCookies();
                setUserContext(newContext);
              } else {
                console.error('Failed to create guest token after error clearing invalid user token');
                setUserContext({ isAuth: false, type: 'guest' });
              }
            } catch (guestError) {
              console.error('Error creating guest token after error clearing invalid user token:', guestError);
              setUserContext({ isAuth: false, type: 'guest' });
            }
          }
        } else {
          console.log('No username found, redirecting to home');
          router.push('/');
        }
        return;
      }

      // If no token exists, create a guest token
      if (!context.userId) {
        console.log('No token found, creating guest token...');
        try {
          const response = await fetch('/api/auth/guest-simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            console.log('Guest token created');
            // Wait a moment for the cookie to be set, then re-check
            await new Promise(resolve => setTimeout(resolve, 100));
            const newContext = getUserContextFromCookies();
            setUserContext(newContext);
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
      } else {
        setUserContext(context);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
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

  if (!userContext) {
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
                    {userContext.username && (
                      <p className="text-sm text-[#8a7f73] light:text-[#6b6358] mt-2">
                        Playing as: {userContext.username}
                      </p>
                    )}
                  </div>

                  <GuestProfile />
                </div>
              </div>
            </div>
          );
}
