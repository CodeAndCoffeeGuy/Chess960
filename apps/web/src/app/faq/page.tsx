'use client';

import { useState } from 'react';
import { AnimatedSection } from '@/components/AnimatedSection';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is Chess960?',
    answer: 'Chess960, also known as Fischer Random Chess, is a chess variant invented by World Champion Bobby Fischer. The starting position of the pieces on the back rank is randomized from 960 possible positions, while maintaining specific constraints: bishops on opposite colors, king between rooks, and pawns in their normal positions. This eliminates opening theory memorization and puts the emphasis on pure chess understanding.',
  },
  {
    question: 'How is Chess960 different from standard chess?',
    answer: 'The only difference is the starting position of the pieces on the back rank. Instead of the traditional setup, pieces are randomly positioned (except pawns). All other chess rules remain identical—including castling, en passant, checkmate conditions, and piece movement. The key advantage is that players cannot rely on memorized opening theory and must think creatively from move one.',
  },
  {
    question: 'How does castling work in Chess960?',
    answer: 'Castling in Chess960 follows the same basic rules as standard chess, but works from any starting position. After castling kingside, the king ends up on the g-file and the rook on the f-file. After castling queenside, the king ends up on the c-file and the rook on the d-file—just like in standard chess. The king and rook must not have moved, there must be no pieces between them, and the king cannot castle through check.',
  },
  {
    question: 'How do I create an account?',
    answer: 'Click "Sign In" in the navigation bar and choose to sign in with Google or use the magic link email option. You\'ll be prompted to choose a username after your first login.',
  },
  {
    question: 'What time controls are available?',
    answer: 'We offer a full range of time controls for Chess960: Bullet (2+0), Blitz (3+2, 5+3), Rapid (10+5), and Classical (30+0, 60+0). Each time control has its own separate rating system, so you can find your competitive level across different speeds of play.',
  },
  {
    question: 'How does the rating system work?',
    answer: 'We use the Glicko-2 rating system, an improved version of Elo. Your rating adjusts based on your wins, losses, and the strength of your opponents. Importantly, you have separate ratings for each time control—your bullet rating is independent from your blitz rating, etc. New players start at 1500 rating.',
  },
  {
    question: 'Can I play as a guest?',
    answer: 'Yes! You can play unrated games as a guest. However, to track your rating, save your game history, and participate in tournaments, you\'ll need to create an account.',
  },
  {
    question: 'How does matchmaking work?',
    answer: 'Our matchmaking system pairs you with opponents of similar rating within a reasonable range. The system tries to minimize wait times while ensuring fair matches. Since each time control has its own rating, you\'ll always be matched with opponents at your skill level for that specific time control.',
  },
  {
    question: 'Is the starting position the same for both players?',
    answer: 'Yes! Both players always start with the exact same position in each game. The position is randomly generated before the game starts, but it\'s symmetrical—both White and Black have the same piece arrangement on their respective back ranks. This ensures complete fairness.',
  },
  {
    question: 'Do I need to know Chess960 opening theory?',
    answer: 'That\'s the beauty of Chess960—there is no opening theory to memorize! With 960 possible starting positions, memorization is impossible. You simply need to understand chess principles: develop your pieces, control the center, ensure king safety, and think tactically. This levels the playing field between players of different experience levels.',
  },
  {
    question: 'What happens if I disconnect?',
    answer: 'If you disconnect during a game, your clock continues to run. You have a few seconds to reconnect. If you don\'t reconnect before your time runs out, you\'ll lose the game.',
  },
  {
    question: 'Can I play on mobile?',
    answer: 'Yes! Chess960.game works on all modern mobile browsers. Simply visit chess960.game on your phone or tablet. A dedicated mobile app may be released in the future.',
  },
  {
    question: 'Can I analyze my games?',
    answer: 'Game analysis features are in development. You\'ll soon be able to review your Chess960 games with computer analysis to understand tactical patterns and improve your play.',
  },
  {
    question: 'How do I report a bug or suggest a feature?',
    answer: 'You can contact us through our Contact page with bug reports, feature suggestions, or any other feedback. We value community input!',
  },
  {
    question: 'Are there any costs or subscriptions?',
    answer: 'Chess960.game is completely free to use. All features are available to all players at no cost. There are no premium tiers or paywalls.',
  },
  {
    question: 'What are the rules for fair play?',
    answer: 'We have a zero-tolerance policy for cheating. Using chess engines, getting outside assistance, or manipulating the system is strictly prohibited and will result in account suspension.',
  },
  {
    question: 'Is Chess960.game open source?',
    answer: 'Yes! Chess960.game is fully open source under the GNU Affero General Public License v3.0 (AGPL-3.0). You can view the source code, contribute improvements, report issues, or even host your own instance on GitHub at github.com/CodeAndCoffeeGuy/Chess960',
  },
  {
    question: 'Can I contribute to the project?',
    answer: 'Absolutely! We welcome contributions from the community. Whether it\'s bug fixes, new features, documentation improvements, or testing—all contributions are valued. Check out our GitHub repository and CONTRIBUTING.md file for guidelines.',
  },
  {
    question: 'Can I self-host Chess960.game?',
    answer: 'Yes! As an open source project under the AGPL-3.0 license, you\'re free to host your own instance of Chess960.game. The repository includes detailed setup instructions for deploying both the web app and game server.',
  },
];

function FAQAccordion({ faq }: { faq: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] transition-colors"
      >
        <span className="text-white light:text-black font-semibold pr-8">{faq.question}</span>
        <svg
          className={`w-5 h-5 text-orange-300 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 pt-2">
          <p className="text-[#a0958a] light:text-[#5a5449] leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto">
            Find answers to common questions about Chess960
          </p>
        </AnimatedSection>

        {/* FAQ Items */}
        <AnimatedSection className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQAccordion key={index} faq={faq} />
          ))}
        </AnimatedSection>

        {/* Contact CTA */}
        <AnimatedSection className="mt-16 text-center bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white light:text-black mb-4">Still have questions?</h2>
          <p className="text-[#a0958a] light:text-[#5a5449] mb-6">
            Can&apos;t find the answer you&apos;re looking for? We&apos;re here to help.
          </p>
          <a
            href="/contact"
            className="inline-block bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </a>
        </AnimatedSection>
      </div>
    </div>
  );
}
