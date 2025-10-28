'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1f1d1a] light:bg-[#f5f1ea] border-t border-[#474239]/30 light:border-[#d4caba]/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Links Section */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-6">
          <Link href="/about" className="text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors text-sm">
            About
          </Link>
          <Link href="/faq" className="text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors text-sm">
            FAQ
          </Link>
          <Link href="/contact" className="text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors text-sm">
            Contact
          </Link>
          <Link href="/terms" className="text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors text-sm">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors text-sm">
            Privacy Policy
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-center items-center gap-4 pt-6 border-t border-[#474239]/30 light:border-[#d4caba]/50">
          {/* Open Source Link */}
          <a
            href="https://github.com/CodeAndCoffeeGuy/Chess960"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors group"
            aria-label="GitHub Source Code"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm">Source Code</span>
          </a>

          {/* Social Links */}
          <a
            href="https://x.com/Chess960HQ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a0958a] light:text-[#5a5449] hover:text-orange-300 light:hover:text-orange-300 transition-colors"
            aria-label="X (Twitter)"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
