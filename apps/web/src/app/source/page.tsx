'use client';

import { AnimatedSection } from '@/components/AnimatedSection';
import { Github, ExternalLink } from 'lucide-react';

export default function SourcePage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Chess960 is Open Source
          </h1>
          <p className="text-xl text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto">
            The premier platform for Fischer Random Chess
          </p>
        </AnimatedSection>

        {/* Open Source Information */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Open Source & Community</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Chess960 is completely free and open source, built by the community for the community. 
              Our entire codebase is available on GitHub under the GNU Affero General Public License v3.0.
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
            <div className="mt-6">
              <a 
                href="https://github.com/CodeAndCoffeeGuy/Chess960" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-300 hover:bg-orange-400 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                <Github className="h-5 w-5" />
                View on GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </AnimatedSection>

        {/* Technology Stack */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">Technology Stack</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white light:text-black mb-4">Frontend</h3>
                <ul className="space-y-2 text-[#c1b9ad] light:text-[#5a5449]">
                  <li>• Next.js 15 with React 18</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• React Chessground for board rendering</li>
                  <li>• WebSocket for real-time communication</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white light:text-black mb-4">Backend</h3>
                <ul className="space-y-2 text-[#c1b9ad] light:text-[#5a5449]">
                  <li>• Node.js with TypeScript</li>
                  <li>• Prisma ORM with PostgreSQL</li>
                  <li>• Redis for caching and real-time data</li>
                  <li>• NextAuth.js for authentication</li>
                  <li>• Stockfish 17.1 for engine analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* License Information */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6">License & Legal</h2>
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white light:text-black mb-4">GNU Affero General Public License v3.0</h3>
            <p className="text-[#c1b9ad] light:text-[#5a5449] text-lg leading-relaxed mb-4">
              Chess960 is released under the GNU Affero General Public License v3.0 (AGPL-3.0), 
              a copyleft license that ensures the software remains free and open source.
            </p>
            <div className="bg-[#1f1d1a] light:bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white light:text-black mb-3">What this means:</h4>
              <ul className="space-y-2 text-[#c1b9ad] light:text-[#5a5449]">
                <li>• You can use Chess960 for any purpose</li>
                <li>• You can modify and distribute the code</li>
                <li>• You can create commercial products</li>
                <li>• Any modifications must be released under the same license</li>
                <li>• Network services must provide source code to users</li>
                <li>• Full attribution and license preservation required</li>
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
