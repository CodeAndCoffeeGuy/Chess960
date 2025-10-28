import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobile App - Chess960',
  description: 'Play Chess960 on the go with our mobile-optimized platform',
};

export default function MobilePage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Play Anywhere
          </h1>
          <p className="text-xl text-[#b6aea2] max-w-2xl mx-auto">
            Chess960 works seamlessly on your mobile device. Fast, responsive, and always ready for action.
          </p>
        </div>

        {/* Mobile Web App */}
        <div className="mb-16">
          <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-8 text-center">
            <div className="text-orange-300 text-5xl mb-6">📱</div>
            <h2 className="text-3xl font-bold text-white mb-4">Mobile-Optimized Web App</h2>
            <p className="text-[#c1b9ad] text-lg leading-relaxed mb-6">
              No download required! Simply visit <span className="text-orange-300 font-semibold">chess960.game</span> on
              your phone or tablet to start playing. Our responsive design ensures a smooth experience on any screen size.
            </p>
            <a
              href="/play"
              className="inline-block bg-gradient-to-r from-orange-400 to-orange-400 hover:from-orange-500 hover:to-orange-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Play Now on Mobile
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Mobile Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-6">
              <div className="text-orange-300 text-2xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-[#a0958a]">
                Optimized for mobile connections. Play bullet chess with minimal lag, even on 4G networks.
              </p>
            </div>

            <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-6">
              <div className="text-orange-300 text-2xl mb-3">👆</div>
              <h3 className="text-xl font-semibold text-white mb-2">Touch Optimized</h3>
              <p className="text-[#a0958a]">
                Drag and drop pieces with precision. Our interface is designed specifically for touch screens.
              </p>
            </div>

            <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-6">
              <div className="text-orange-300 text-2xl mb-3">Loading...</div>
              <h3 className="text-xl font-semibold text-white mb-2">Auto-Rotate</h3>
              <p className="text-[#a0958a]">
                Seamlessly switch between portrait and landscape modes. The board adapts to your preference.
              </p>
            </div>

            <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-6">
              <div className="text-orange-300 text-2xl mb-3">💾</div>
              <h3 className="text-xl font-semibold text-white mb-2">Offline Ready</h3>
              <p className="text-[#a0958a]">
                The app caches essential resources so you can quickly resume playing even with spotty connections.
              </p>
            </div>
          </div>
        </div>

        {/* How to Add to Home Screen */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Add to Home Screen</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* iOS */}
            <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>🍎</span> iOS (Safari)
              </h3>
              <ol className="space-y-3 text-[#a0958a]">
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">1.</span>
                  <span>Open chess960.game in Safari</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">2.</span>
                  <span>Tap the Share button (square with arrow)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">3.</span>
                  <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">4.</span>
                  <span>Tap &quot;Add&quot; in the top right corner</span>
                </li>
              </ol>
            </div>

            {/* Android */}
            <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>🤖</span> Android (Chrome)
              </h3>
              <ol className="space-y-3 text-[#a0958a]">
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">1.</span>
                  <span>Open chess960.game in Chrome</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">2.</span>
                  <span>Tap the Menu button (three dots)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">3.</span>
                  <span>Tap &quot;Add to Home screen&quot; or &quot;Install app&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-300 font-bold mr-3">4.</span>
                  <span>Tap &quot;Add&quot; or &quot;Install&quot; to confirm</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Native App Future */}
        <div className="bg-[#35322e] border border-[#474239] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Native Mobile Apps Coming Soon</h2>
          <p className="text-[#a0958a] mb-4">
            We&apos;re working on dedicated iOS and Android apps with enhanced features like push notifications
            for game invites, offline analysis, and more.
          </p>
          <p className="text-[#b6aea2] text-sm">
            In the meantime, our mobile web app provides the full Chess960 experience right in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
