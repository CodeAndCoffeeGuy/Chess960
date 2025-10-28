'use client';

import { AnimatedSection } from '@/components/AnimatedSection';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            About Chess960
          </h1>
          <p className="text-xl text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto">
            The premier platform for Fischer Random Chess
          </p>
        </AnimatedSection>

        {/* What is Chess960 Section */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">What is Chess960?</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Chess960, also known as Fischer Random Chess, is a variant of chess invented by the legendary
              World Champion Bobby Fischer. Instead of starting every game from the traditional position,
              Chess960 randomizes the placement of pieces on the back rank while maintaining key constraints.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              There are exactly <strong className="text-white light:text-black">960 possible starting positions</strong>, each
              numbered from 1 to 960 using the Scharnagl numbering system. The starting position is randomized,
              but both players always start with the same position—maintaining perfect symmetry and fairness.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed">
              The rules ensure that bishops are on opposite colors, the king is between the two rooks (to preserve
              castling rights), and pawns remain in their traditional positions. All other chess rules apply identically.
            </p>
          </div>
        </AnimatedSection>

        {/* Why Chess960 Section */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Why Chess960?</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-6">
              Chess960 eliminates the greatest problem in modern chess: opening theory memorization.
              Here&apos;s what makes it revolutionary:
            </p>
            <ul className="space-y-4 text-[#c1b9ad] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Pure Chess from Move One</strong>
                  <p className="mt-1">No memorization required. Every position demands original thinking and calculation.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Creativity Over Memory</strong>
                  <p className="mt-1">Success comes from understanding chess principles, not memorizing 20 moves of theory.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Level Playing Field</strong>
                  <p className="mt-1">A 1500-rated player can face a 2000-rated player without being crushed by opening prep.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Endless Variety</strong>
                  <p className="mt-1">960 positions mean you&apos;ll rarely face the same opening twice. Every game is fresh.</p>
                </div>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* Our Mission Section */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Our Mission</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Chess960.org was created to be the premier online platform for Fischer Random Chess. Our vision
              is to provide the fastest, most responsive, and most competitive Chess960 experience on the web
              across all time controls.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed">
              We believe Chess960 represents the future of chess—a game that rewards creativity, calculation,
              and pure chess understanding. Our platform is designed to eliminate lag, provide precise timing,
              and create an environment where players can experience chess in its purest form, from bullet to classical.
            </p>
          </div>
        </AnimatedSection>

        {/* Platform Features Section */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Platform Features</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-6">
              Chess960.org offers a complete Chess960 experience across all time controls:
            </p>
            <ul className="space-y-4 text-[#c1b9ad] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">All Time Controls</strong>
                  <p className="mt-1">Bullet (2+0), Blitz (3+2, 5+3), Rapid (10+5), and Classical (30+0, 60+0)</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Rated & Casual Games</strong>
                  <p className="mt-1">Separate Glicko-2 ratings for each time control with fair matchmaking</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Tournaments & Arenas</strong>
                  <p className="mt-1">Scheduled and instant tournaments for all skill levels</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Lightning-Fast Performance</strong>
                  <p className="mt-1">WebSocket connections with sub-120ms latency for responsive gameplay</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-3 mt-1 text-xl">•</span>
                <div>
                  <strong className="text-white light:text-black">Complete Game History</strong>
                  <p className="mt-1">Review, analyze, and learn from every game you play</p>
                </div>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* Open Source Section */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Open Source & Community</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Chess960.org is proudly open source, released under the GNU Affero General Public License v3.0. We believe in
              transparency, community-driven development, and giving back to the chess community.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Our entire codebase is publicly available on{' '}
              <a href="https://github.com/CodeAndCoffeeGuy/Chess960" className="text-orange-300 hover:text-orange-200 transition-colors">
                GitHub
              </a>
              , where you can:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>View and audit the source code</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Contribute improvements and new features</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Report bugs and suggest enhancements</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Fork and host your own instance</span>
              </li>
            </ul>
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              We welcome contributions from developers, chess enthusiasts, and anyone passionate
              about building great software. Check out our{' '}
              <a href="https://github.com/CodeAndCoffeeGuy/Chess960/blob/main/CONTRIBUTING.md" className="text-orange-300 hover:text-orange-200 transition-colors">
                contribution guidelines
              </a>{' '}
              to get started.
            </p>
            <div className="mt-6">
              <a 
                href="/source" 
                className="inline-block bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                View Source Information
              </a>
            </div>
          </div>
        </AnimatedSection>

        {/* Technology Section */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Technology</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Built with modern web technologies for maximum performance:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">Next.js 15</strong> - Server-side rendering and optimized performance</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">WebSocket</strong> - Sub-120ms latency real-time connections</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">PostgreSQL</strong> - Reliable data storage and game history</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">Redis</strong> - Fast caching and session management</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">Glicko-2</strong> - Advanced rating system for fair matchmaking</span>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* Contact Section */}
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Get Involved</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-6">
              Whether you&apos;re a player, developer, or chess enthusiast, we&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://github.com/CodeAndCoffeeGuy/Chess960"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                View on GitHub
              </a>
              <a
                href="/contact"
                className="inline-block bg-[#3a3632] light:bg-[#f5f1ea] hover:bg-[#454039] light:hover:bg-[#e5e1da] text-white light:text-black px-8 py-3 rounded-lg font-semibold transition-all duration-200 border border-[#474239] text-center"
              >
                Contact Us
              </a>
            </div>
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
}
