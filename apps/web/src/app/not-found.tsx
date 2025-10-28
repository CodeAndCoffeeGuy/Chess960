import Link from 'next/link';
import { Home, Play } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black overflow-hidden flex items-center justify-center p-6">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle grid */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-8xl font-mono font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">404</div>
          <h1 className="text-2xl font-bold text-white light:text-black mb-2">Page Not Found</h1>
          <p className="text-[#b6aea2] light:text-[#6b6460]">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="w-full bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] hover:border-orange-300/70 text-white light:text-black py-3 px-4 rounded-2xl font-semibold transition-all duration-200 shadow-[0_6px_20px_rgba(0,0,0,0.35)] light:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_34px_rgba(0,0,0,0.45)] light:hover:shadow-[0_12px_34px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 inline-flex items-center justify-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Link>

          <Link
            href="/play"
            className="w-full bg-[#292622]/70 light:bg-[#faf7f2] border border-[#3e3a33] light:border-[#d4caba] hover:border-orange-300/50 text-[#c1b9ad] light:text-[#4a453e] hover:text-white light:hover:text-black py-3 px-4 rounded-2xl font-semibold transition-all duration-200 shadow-[0_6px_20px_rgba(0,0,0,0.35)] light:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_34px_rgba(0,0,0,0.45)] light:hover:shadow-[0_12px_34px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 inline-flex items-center justify-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Playing</span>
          </Link>
        </div>
      </div>
    </div>
  );
}