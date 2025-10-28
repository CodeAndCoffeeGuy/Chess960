'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// interface Team {
//   id: string;
//   name: string;
// }

export default function CreateTeamTournamentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clockTime, setClockTime] = useState(2); // minutes as decimal (default: 2)
  const [clockIncrement, setClockIncrement] = useState(0); // seconds (default: 0)
  const variant = 'CHESS960'; // Always Chess960 for this site
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxTeams, setMaxTeams] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('4');
  const [nbLeaders, setNbLeaders] = useState('5');

  // Time options (minutes)
  const timeOptions = [
    0, 0.25, 0.5, 0.75, 1, 1.5,
    2, 3, 4, 5, 6, 7, 8,
    10, 15, 20, 25, 30, 35, 40, 45,
    50, 60
  ];

  // Increment options (seconds)
  const incrementOptions = [
    0, 1, 2, 3, 4, 5, 6, 7,
    10, 15, 20, 25, 30,
    40, 50, 60
  ];

  // Calculate speed category dynamically
  const getSpeedCategory = (timeMinutes: number, incrementSeconds: number): string => {
    const estimatedTime = (timeMinutes * 60) + (incrementSeconds * 40);
    if (estimatedTime < 180) return 'Bullet';
    if (estimatedTime < 480) return 'Blitz';
    if (estimatedTime < 1500) return 'Rapid';
    return 'Classical';
  };

  const speedCategory = getSpeedCategory(clockTime, clockIncrement);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/team-tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          clockTime,
          clockIncrement,
          variant,
          startsAt: new Date(startsAt).toISOString(),
          duration: parseInt(duration),
          maxTeams: maxTeams ? parseInt(maxTeams) : null,
          playersPerTeam: parseInt(playersPerTeam),
          nbLeaders: parseInt(nbLeaders),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create team tournament');
      }

      const { tournament } = await res.json();
      router.push(`/team-tournaments/${tournament.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-[#a0958a] light:text-[#5a5449]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tournaments/team"
            className="text-orange-400 hover:text-orange-300 font-semibold mb-4 inline-flex items-center gap-2"
          >
            ← Back to Team Tournaments
          </Link>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mt-4 mb-2">
            Create Team Tournament
          </h1>
          <p className="text-[#a0958a] light:text-[#5a5449]">
            Set up a new Chess960 team tournament for the community
          </p>
          {session?.user && (
            <p className="text-sm text-[#a0958a] light:text-[#5a5449] mt-2">
              Creating as: {session.user.name || session.user.email}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 light:border-red-600 rounded-lg text-red-400 light:text-red-700">
              {error}
            </div>
          )}

          {/* Tournament Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-white light:text-black font-semibold mb-2">
              Tournament Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="e.g., Weekly Team Battle"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-white light:text-black font-semibold mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Optional tournament description"
            />
          </div>

          {/* Time Control */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-white light:text-black font-semibold">
                Time Control *
              </label>
              <span className="text-sm px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {speedCategory}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clockTime" className="block text-[#a0958a] light:text-[#5a5449] text-sm mb-2">
                  Minutes per side
                </label>
                <select
                  id="clockTime"
                  value={clockTime}
                  onChange={(e) => setClockTime(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-500 transition-colors"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time < 1 ? `${Math.round(time * 60)} seconds` : `${time} ${time === 1 ? 'minute' : 'minutes'}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="clockIncrement" className="block text-[#a0958a] light:text-[#5a5449] text-sm mb-2">
                  Increment in seconds
                </label>
                <select
                  id="clockIncrement"
                  value={clockIncrement}
                  onChange={(e) => setClockIncrement(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-500 transition-colors"
                >
                  {incrementOptions.map(inc => (
                    <option key={inc} value={inc}>
                      {inc} {inc === 1 ? 'second' : 'seconds'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Start Time and Duration */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="startsAt" className="block text-white light:text-black font-semibold mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                id="startsAt"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-white light:text-black font-semibold mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                min="5"
                max="600"
                className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-[#6b6460] light:text-[#a0958a] mt-1">Between 5 and 600 minutes</p>
            </div>
          </div>

          {/* Optional Settings */}
          <div className="border-t border-[#474239] light:border-[#d4caba] pt-6 mb-6">
            <h3 className="text-lg font-semibold text-white light:text-black mb-4">Team Settings</h3>

            <div className="space-y-6">
              {/* Players Per Team and Max Teams */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="playersPerTeam" className="block text-white light:text-black font-semibold mb-2">
                    Players Per Team *
                  </label>
                  <input
                    type="number"
                    id="playersPerTeam"
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(e.target.value)}
                    required
                    min="1"
                    max="20"
                    className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="maxTeams" className="block text-white light:text-black font-semibold mb-2">
                    Max Teams
                  </label>
                  <input
                    type="number"
                    id="maxTeams"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                    min="2"
                    className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-[#6b6460] light:text-[#a0958a] mt-1">Leave empty for unlimited teams</p>
                </div>
              </div>

              {/* Number of Leaders */}
              <div>
                <label htmlFor="nbLeaders" className="block text-white light:text-black font-semibold mb-2">
                  Number of Leaders *
                </label>
                <input
                  type="number"
                  id="nbLeaders"
                  value={nbLeaders}
                  onChange={(e) => setNbLeaders(e.target.value)}
                  required
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-500 transition-colors"
                />
                <p className="text-xs text-[#6b6460] light:text-[#a0958a] mt-1">
                  Only the top N players per team count toward team score (1-20, default 5)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Team Tournament'}
            </button>
            <Link
              href="/tournaments/team"
              className="px-6 py-3 bg-[#2a2723] light:bg-[#faf7f2] hover:bg-[#3a3632] light:hover:bg-[#ebe7dc] border border-[#474239] light:border-[#d4caba] text-white light:text-black rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white light:text-black mb-3">Team Tournament Guidelines</h2>
          <ul className="space-y-2 text-sm text-[#c1b9ad] light:text-[#5a5449]">
            <li>• Teams compete against each other with multiple players per team</li>
            <li>• Only the top N players&apos; scores count toward the team&apos;s total score</li>
            <li>• Team leaders can manage their roster and strategy</li>
            <li>• Coordinate with your team to dominate the leaderboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
