'use client';

import { useState, useEffect } from 'react';
// Using inline SVG icons instead of external library

interface BetaNotificationProps {
  className?: string;
}

export function BetaNotification({ className = '' }: BetaNotificationProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'already-exists'>('idle');
  const [message, setMessage] = useState('');

  // Auto-hide success/already-exists messages after 4 seconds
  useEffect(() => {
    if (status === 'success' || status === 'already-exists') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.alreadyExists ? 'already-exists' : 'success');
        setMessage(data.message);
        if (!data.alreadyExists) {
          setEmail('');
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Beta Banner with Email Signup */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-gray-200/30 to-gray-300/30 border-2 border-gray-400/60 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-sm shadow-lg">
        {/* Beta Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs sm:text-sm font-bold text-white light:text-gray-600 whitespace-nowrap">
            BETA - Site under active development
          </span>
        </div>

        {/* Email Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Get notified when ready"
              className="w-full pl-10 pr-4 py-2 bg-white/15 border-2 border-gray-400/40 rounded-lg text-sm text-white placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-gray-400/60 focus:border-gray-400/80 transition-all"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none shadow-md whitespace-nowrap"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Notify Me'
            )}
          </button>
        </form>
      </div>

      {/* Status Message */}
      {status !== 'idle' && (
        <div className={`absolute top-full left-0 right-0 mt-2 p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
          status === 'success'
            ? 'bg-gray-500/20 border border-gray-400/40 text-white light:text-gray-800'
            : status === 'already-exists'
            ? 'bg-gray-500/20 border border-gray-400/40 text-white light:text-gray-800'
            : 'bg-gray-500/20 border border-gray-400/40 text-white light:text-gray-800'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {status === 'success' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {status === 'already-exists' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
