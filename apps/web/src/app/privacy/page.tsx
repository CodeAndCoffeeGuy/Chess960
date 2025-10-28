'use client';

import { AnimatedSection } from '@/components/AnimatedSection';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-[#b6aea2] light:text-[#5a5449]">
            Last Updated: October 9, 2025
          </p>
        </AnimatedSection>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">1. Introduction</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              Chess960.org is an open source platform committed to protecting your privacy and being transparent
              about data practices. This Privacy Policy explains how information is collected, used, disclosed,
              and safeguarded when you use the service.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              By using Chess960.org, you agree to the collection and use of information in accordance with this policy.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              As an open source project, our codebase is publicly available on{' '}
              <a href="https://github.com/CodeAndCoffeeGuy/Chess960" className="text-orange-300 hover:text-orange-400 transition-colors">
                GitHub
              </a>
              , allowing you to verify our data handling practices.
            </p>
            </div>
          </AnimatedSection>

          {/* Information We Collect */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-white light:text-black mb-3 mt-6">2.1 Account Information</h3>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Email address (for authentication and communication)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Username (chosen by you)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Google profile information (if you sign in with Google)</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white light:text-black mb-3 mt-6">2.2 Game Data</h3>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              We automatically collect:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Game moves and outcomes</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Chess ratings and statistics</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Game timestamps and duration</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Win/loss records</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white light:text-black mb-3 mt-6">2.3 Technical Information</h3>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              We collect technical data including:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>IP address</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Browser type and version</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Device information</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Connection timestamps and session data</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Error logs and performance metrics</span>
              </li>
            </ul>
            </div>
          </AnimatedSection>

          {/* How We Use Your Information */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">3. How We Use Your Information</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Provide and maintain the Service</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Authenticate your account and process logins</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Calculate and maintain chess ratings</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Match you with opponents of similar skill level</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Detect and prevent cheating and abuse</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Improve and optimize the Service</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Send important updates and notifications</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Respond to support requests</span>
              </li>
            </ul>
            </div>
          </AnimatedSection>

          {/* Analytics */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">4. Analytics and Tracking</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              We use PostHog for analytics to understand how users interact with our Service. PostHog collects:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Page views and navigation patterns</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Feature usage and interaction events</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Session duration and frequency</span>
              </li>
            </ul>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              This data helps us improve the user experience and identify issues. Analytics data is anonymized
              where possible.
            </p>
            </div>
          </AnimatedSection>

          {/* Data Sharing */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in these circumstances:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">Service Providers:</strong> With third-party services that help us operate (e.g., Neon for database, Vercel for hosting, PostHog for analytics)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">Legal Requirements:</strong> If required by law or to protect our rights</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span><strong className="text-white light:text-black">Public Information:</strong> Your username, ratings, and game history are publicly visible on the platform</span>
              </li>
            </ul>
            </div>
          </AnimatedSection>

          {/* Data Security */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">6. Data Security</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Encrypted connections (HTTPS/WSS)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Secure authentication via NextAuth</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Regular security audits and updates</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Access controls and monitoring</span>
              </li>
            </ul>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
            </div>
          </AnimatedSection>

          {/* Data Retention */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">7. Data Retention</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              We retain your account information and game data for as long as your account is active. If you delete
              your account, we will remove your personal information within 30 days, though some data may be retained
              for legal or security purposes.
            </p>
            </div>
          </AnimatedSection>

          {/* Your Rights */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">8. Your Privacy Rights</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Access your personal data</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Correct inaccurate data</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Request deletion of your account and data</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Object to data processing</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Export your data</span>
              </li>
            </ul>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              To exercise these rights, contact us at{' '}
              <a href="mailto:support@chess960.game" className="text-orange-300 hover:text-orange-400 transition-colors">
                support@chess960.game
              </a>
            </p>
            </div>
          </AnimatedSection>

          {/* International Users */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">9. International Data Transfers</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              Your information may be transferred to and maintained on servers located outside your country.
              By using the Service, you consent to this transfer. We ensure appropriate safeguards are in place
              to protect your data.
            </p>
            </div>
          </AnimatedSection>

          {/* Changes to Policy */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">10. Changes to This Policy</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by updating the &quot;Last Updated&quot; date and posting the new policy on this page.
            </p>
            </div>
          </AnimatedSection>

          {/* Contact */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">11. Contact Us</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@chess960.game" className="text-orange-300 hover:text-orange-400 transition-colors">
                support@chess960.game
              </a>
            </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
