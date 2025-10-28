'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function CreateTournamentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startsAt: '',
    duration: 60,
    clockTime: 2, // minutes as decimal (default: 2)
    clockIncrement: 0, // seconds (default: 0)
    maxPlayers: '',
    minRating: '',
    maxRating: '',
  });

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

  const speedCategory = getSpeedCategory(formData.clockTime, formData.clockIncrement);


  // Pre-fill start time from URL parameter if provided
  useEffect(() => {
    const startTimeParam = searchParams.get('startTime');
    if (startTimeParam) {
      const timestamp = parseInt(startTimeParam);
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp);
        // Format for datetime-local input (YYYY-MM-DDTHH:MM)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData(prev => ({
          ...prev,
          startsAt: formattedDate,
        }));
      }
    }
  }, [searchParams]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
          <p className="mt-4 text-[#a0958a] light:text-[#5a5449]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate start time is in the future
      const startDate = new Date(formData.startsAt);
      if (startDate <= new Date()) {
        setError('Tournament must start in the future');
        setLoading(false);
        return;
      }

      // Prepare request body
      const body: any = {
        name: formData.name,
        description: formData.description || null,
        startsAt: startDate.toISOString(),
        duration: formData.duration,
        clockTime: formData.clockTime,
        clockIncrement: formData.clockIncrement,
      };

      if (formData.maxPlayers) {
        body.maxPlayers = parseInt(formData.maxPlayers);
      }
      if (formData.minRating) {
        body.minRating = parseInt(formData.minRating);
      }
      if (formData.maxRating) {
        body.maxRating = parseInt(formData.maxRating);
      }

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to tournament detail page
        router.push(`/tournaments/${data.tournament.id}`);
      } else {
        setError(data.error || 'Failed to create tournament');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
      setError('Failed to create tournament');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tournaments"
            className="text-orange-400 hover:text-orange-300 font-semibold mb-4 inline-flex items-center gap-2"
          >
            ← Back to Tournaments
          </Link>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mt-4 mb-2">
            Create Tournament
          </h1>
          <p className="text-[#a0958a] light:text-[#5a5449]">
            Set up a new Chess960 tournament for the community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 light:border-orange-400 rounded-lg text-red-400 light:text-orange-500">
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
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
              placeholder="e.g., Weekly Bullet Arena"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-white light:text-black font-semibold mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors resize-none"
              placeholder="Optional tournament description"
            />
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
                name="startsAt"
                value={formData.startsAt}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-300 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-white light:text-black font-semibold mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min={10}
                max={360}
                className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-300 transition-colors"
              />
              <p className="text-xs text-[#6b6460] light:text-[#a0958a] mt-1">Between 10 and 360 minutes</p>
            </div>
          </div>

          {/* Time Control */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-white light:text-black font-semibold">
                Time Control *
              </label>
              <span className="text-sm px-3 py-1 rounded-full bg-orange-300/10 text-orange-400 border border-orange-300/20">
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
                  name="clockTime"
                  value={formData.clockTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, clockTime: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-300 transition-colors"
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
                  name="clockIncrement"
                  value={formData.clockIncrement}
                  onChange={(e) => setFormData(prev => ({ ...prev, clockIncrement: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:border-orange-300 transition-colors"
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

          {/* Optional Settings */}
          <div className="border-t border-[#474239] light:border-[#d4caba] pt-6 mb-6">
            <h3 className="text-lg font-semibold text-white light:text-black mb-4">Optional Settings</h3>

            <div className="space-y-6">
              {/* Max Players */}
              <div>
                <label htmlFor="maxPlayers" className="block text-white light:text-black font-semibold mb-2">
                  Max Players
                </label>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  min={2}
                  max={1000}
                  className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-[#6b6460] light:text-[#a0958a] mt-1">Leave empty for unlimited players</p>
              </div>

              {/* Rating Requirements */}
              <div>
                <label className="block text-white light:text-black font-semibold mb-2">
                  Rating Requirements
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      id="minRating"
                      name="minRating"
                      value={formData.minRating}
                      onChange={handleChange}
                      min={0}
                      max={3000}
                      className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
                      placeholder="Min rating"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      id="maxRating"
                      name="maxRating"
                      value={formData.maxRating}
                      onChange={handleChange}
                      min={0}
                      max={3000}
                      className="w-full px-4 py-3 bg-[#2a2723] light:bg-[#faf7f2] border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
                      placeholder="Max rating"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#6b6460] light:text-[#a0958a] mt-1">Leave empty for no rating restrictions</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-400 to-orange-400 hover:from-orange-500 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
            <Link
              href="/tournaments"
              className="px-6 py-3 bg-[#2a2723] light:bg-[#faf7f2] hover:bg-[#3a3632] light:hover:bg-[#ebe7dc] border border-[#474239] light:border-[#d4caba] text-white light:text-black rounded-lg font-semibold transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white light:text-black mb-3">Tournament Guidelines</h2>
          <ul className="space-y-2 text-sm text-[#c1b9ad] light:text-[#5a5449]">
            <li>• Tournaments are Arena-style: players compete to play as many games as possible within the time limit</li>
            <li>• Scoring: Win = 2 points, Draw = 1 point, Loss = 0 points</li>
            <li>• Players can join until the tournament starts</li>
            <li>• Be respectful and follow the site&apos;s code of conduct</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CreateTournamentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300"></div>
          <p className="mt-4 text-[#a0958a] light:text-[#5a5449]">Loading...</p>
        </div>
      </div>
    }>
      <CreateTournamentForm />
    </Suspense>
  );
}
