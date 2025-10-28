'use client';

import { useState } from 'react';
import { Mail, Zap, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, handle };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          // Login successful - redirect to play page
          window.location.href = '/play';
        } else {
          // Registration successful - show verification form
          setNeedsVerification(true);
          setUserId(data.userId);
          setSuccess(data.message);
        }
      } else {
        if (data.requiresVerification) {
          setNeedsVerification(true);
          setUserId(data.userId);
          setError('Please verify your email first');
        } else {
          setError(data.error || 'Something went wrong');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Email verified! You can now log in.');
        setNeedsVerification(false);
        setIsLogin(true);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/guest-simple', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = '/play';
      } else {
        setError(data.error || 'Failed to create guest session');
      }
    } catch (error) {
      console.error('Guest auth error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (needsVerification) {
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

        <div className="relative max-w-md w-full bg-[#2a2723]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#3e3a33] p-8">
          <div className="text-center mb-8">
            <Mail className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Verify Your Email
            </h1>
            <p className="text-[#b6aea2]">Enter the 6-digit code sent to your email</p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="mb-6">
            <div className="mb-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 text-white placeholder-gray-400 text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <button
            onClick={handleResendCode}
            disabled={isLoading}
            className="w-full bg-[#35322e] hover:bg-[#3a3733] text-[#c1b9ad] hover:text-white border border-[#474239] hover:border-[#5a554d] py-3 px-4 rounded-xl font-semibold transition-all duration-200"
          >
            Resend Code
          </button>
        </div>
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

      <div className="relative max-w-md w-full bg-[#2a2723]/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#3e3a33] p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {isLogin ? 'Welcome Back' : 'Join Chess960'}
          </h1>
          <p className="text-[#b6aea2]">
            {isLogin ? 'Sign in to track your rating' : 'Create your account to compete'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="mb-6">
          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="handle" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your_username"
                required={!isLogin}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 text-white placeholder-gray-400"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-[#35322e] border border-[#474239] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                minLength={8}
                className="w-full px-4 pr-10 py-3 bg-[#35322e] border border-[#474239] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a8276] hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-[#8a8276] mt-1">Minimum 8 characters</p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim() || (!isLogin && !handle.trim())}
            className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between login/register */}
        <div className="text-center mb-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            className="text-orange-400 hover:text-orange-300 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Divider */}
          <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#474239]" />
          </div>
          <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#2a2723] text-[#8a8276]">or</span>
          </div>
        </div>

        {/* Guest Play */}
        <button
          onClick={handleGuestPlay}
          disabled={isLoading}
          className="w-full bg-[#35322e] hover:bg-[#3a3733] text-[#c1b9ad] hover:text-white border border-[#474239] hover:border-[#5a554d] py-3 px-4 rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center space-x-2"
        >
          <User className="h-5 w-5" />
          <span>Play as Guest</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Info */}
        <div className="mt-8 p-4 bg-[#292622]/50 border border-[#3e3a33] rounded-2xl">
          <h3 className="font-semibold text-white mb-2">Why create an account?</h3>
          <ul className="text-sm text-[#c1b9ad] space-y-1">
            <li>• Track your Glicko-2 rating progress</li>
            <li>• Compete in rated games</li>
            <li>• Access game history and statistics</li>
            <li>• Secure password-based authentication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}