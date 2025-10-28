'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { Swords, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChallengeButtonProps {
  userId: string;
  userHandle: string;
}

export function ChallengeButton({ userId, userHandle }: ChallengeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedTc, setSelectedTc] = useState<'ONE_PLUS_ZERO' | 'TWO_PLUS_ZERO'>('ONE_PLUS_ZERO');
  const [rated, setRated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show button if viewing own profile or not logged in
  if (!session?.user || session.user.id === userId) {
    return null;
  }

  const handleChallenge = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/challenge/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: userId,
          tc: selectedTc,
          rated,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send challenge');
      } else {
        setShowModal(false);
        alert(`Challenge sent to ${userHandle}! Waiting for response...`);
        // Navigate to play page to see the challenge status
        router.push('/play');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = showModal && mounted ? (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/75 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-[#2a2723] border-2 border-[#3e3a33] rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Swords className="h-7 w-7 text-purple-500" />
                Challenge {userHandle}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#a0958a] hover:text-white transition-colors p-1"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Time Control */}
              <div>
                <label className="block text-base font-medium text-[#c1b9ad] mb-3">
                  Time Control
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedTc('ONE_PLUS_ZERO')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTc === 'ONE_PLUS_ZERO'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-[#3e3a33] bg-[#2b2824] text-[#a0958a] hover:border-[#4a453e]'
                    }`}
                  >
                    <div className="font-bold text-lg">1+0</div>
                    <div className="text-sm">Bullet</div>
                  </button>
                  <button
                    onClick={() => setSelectedTc('TWO_PLUS_ZERO')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTc === 'TWO_PLUS_ZERO'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-[#3e3a33] bg-[#2b2824] text-[#a0958a] hover:border-[#4a453e]'
                    }`}
                  >
                    <div className="font-bold text-lg">2+0</div>
                    <div className="text-sm">Bullet</div>
                  </button>
                </div>
              </div>

              {/* Rated */}
              <div className="flex items-center justify-between p-4 bg-[#2b2824] rounded-lg border border-[#3e3a33]">
                <div>
                  <div className="text-base font-medium text-[#c1b9ad]">Rated Game</div>
                  <div className="text-sm text-[#a0958a]">Affects your rating</div>
                </div>
                <input
                  type="checkbox"
                  checked={rated}
                  onChange={(e) => setRated(e.target.checked)}
                  className="w-5 h-5 text-orange-500 bg-[#2a2723] border-[#4a453e] rounded focus:ring-orange-500 focus:ring-2"
                />
              </div>

              {/* Send Challenge Button */}
              <button
                onClick={handleChallenge}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Challenge'}
              </button>
            </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold shadow-lg"
      >
        <Swords className="h-5 w-5" />
        <span>Challenge</span>
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
