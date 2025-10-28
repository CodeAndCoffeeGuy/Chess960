'use client';

import { useEffect } from 'react';

export default function PlayLoading() {
  useEffect(() => {
    // Theme detection for styling
  }, []);

  return (
    <div className="relative min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black overflow-hidden flex items-center justify-center">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          {/* Dark mode grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] light:hidden" />
          {/* Light mode grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:40px_40px] hidden light:block" />
        </div>
      </div>

      <div className="relative max-w-md w-full bg-[#2a2723]/70 light:bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#3e3a33] light:border-[#d4caba] p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-white light:text-black mb-2">Loading...</h2>
        <p className="text-[#b6aea2] light:text-[#5a5449]">Preparing your game</p>
      </div>
    </div>
  );
}
