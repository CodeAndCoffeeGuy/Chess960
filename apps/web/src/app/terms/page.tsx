'use client';

import { AnimatedSection } from '@/components/AnimatedSection';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Terms of Service
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
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">1. Agreement to Terms</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              By accessing or using Chess960 (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              These terms apply to all visitors, users, and others who access or use the Service.
            </p>
            </div>
          </AnimatedSection>

          {/* User Accounts */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">2. User Accounts</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              <strong className="text-white light:text-black">Account Creation:</strong> You may create an account using Google authentication
              or email magic links. You are responsible for maintaining the confidentiality of your account.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              <strong className="text-white light:text-black">Account Responsibility:</strong> You are responsible for all activities that
              occur under your account. Notify us immediately of any unauthorized access.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              <strong className="text-white light:text-black">Account Termination:</strong> We reserve the right to suspend or terminate
              your account at any time for violations of these terms.
            </p>
            </div>
          </AnimatedSection>

          {/* Fair Play */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">3. Fair Play Policy</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              <strong className="text-white light:text-black">Prohibited Activities:</strong> The following are strictly prohibited:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6 mb-4">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Using chess engines, bots, or computer assistance during games</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Receiving outside assistance from other players or sources</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Creating multiple accounts to manipulate ratings</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Deliberately losing games to manipulate ratings (sandbagging)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Exploiting bugs or glitches in the Service</span>
              </li>
            </ul>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              <strong className="text-white light:text-black">Penalties:</strong> Violations of fair play will result in immediate
              account suspension or permanent ban.
            </p>
            </div>
          </AnimatedSection>

          {/* User Conduct */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">4. User Conduct</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="space-y-2 text-[#a0958a] light:text-[#5a5449] ml-6">
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Harass, abuse, or harm other users</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Use offensive, vulgar, or inappropriate usernames</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Spam or send unsolicited messages</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Attempt to gain unauthorized access to the Service or other accounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-300 mr-2">•</span>
                <span>Interfere with or disrupt the Service or servers</span>
              </li>
            </ul>
            </div>
          </AnimatedSection>

          {/* Intellectual Property */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">5. Intellectual Property and Open Source</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              Chess960.org is an open source project released under the GNU Affero General Public License v3.0 (AGPL-3.0). The source code is publicly
              available on{' '}
              <a href="https://github.com/CodeAndCoffeeGuy/Chess960" className="text-orange-300 hover:text-orange-200 transition-colors">
                GitHub
              </a>
              .
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              You are free to use, modify, and distribute the source code in accordance with the AGPL-3.0 license terms.
              However, the Chess960 name and branding are protected.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              The Service itself (this hosted instance at chess960.game) and its user data remain subject
              to these Terms of Service and our Privacy Policy.
            </p>
            </div>
          </AnimatedSection>

          {/* Game Data */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">6. Game Data and Ratings</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              <strong className="text-white light:text-black">Rating System:</strong> We use the Glicko-2 rating system to calculate
              player ratings. Ratings are calculated automatically and may be adjusted if violations are detected.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              <strong className="text-white light:text-black">Game Records:</strong> All games played on the Service are recorded and
              may be reviewed for fair play analysis. We reserve the right to void games or adjust ratings if
              irregularities are detected.
            </p>
            </div>
          </AnimatedSection>

          {/* Disclaimers */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">7. Disclaimers</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed mb-4">
              The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, either express or implied.
            </p>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              We do not guarantee that the Service will be uninterrupted, secure, or error-free. We are not responsible
              for any loss of games, ratings, or data due to technical issues, maintenance, or other circumstances.
            </p>
            </div>
          </AnimatedSection>

          {/* Limitation of Liability */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">8. Limitation of Liability</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              To the maximum extent permitted by law, Chess960.org and its operators shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting from your use or inability
              to use the Service.
            </p>
            </div>
          </AnimatedSection>

          {/* Changes to Terms */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">9. Changes to Terms</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes
              by updating the &quot;Last Updated&quot; date. Your continued use of the Service after changes constitutes
              acceptance of the modified terms.
            </p>
            </div>
          </AnimatedSection>

          {/* Contact */}
          <AnimatedSection>
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white light:text-black mb-4">10. Contact Information</h2>
            <p className="text-[#c1b9ad] light:text-[#5a5449] leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@chess960.game" className="text-orange-300 hover:text-orange-200 transition-colors">
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
