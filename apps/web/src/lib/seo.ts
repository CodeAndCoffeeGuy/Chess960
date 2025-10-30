import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';
const siteName = 'Chess960';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}

export function generateSEO({
  title,
  description,
  path = '',
  image = '/og-image.png',
  noIndex = false,
  keywords = [],
}: SEOProps): Metadata {
  const url = `${siteUrl}${path}`;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
      site: '@chess960',
      creator: '@chess960',
    },
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

// Pre-configured metadata for common pages
export const pageSEO = {
  home: generateSEO({
    title: 'Chess960 - Fischer Random Chess Platform',
    description:
      'Play Fischer Random Chess online. No opening theory, just pure chess skill. Bullet, blitz, rapid, and classical time controls with randomized starting positions.',
    path: '/',
    keywords: [
      'chess960',
      'fischer random chess',
      'fischer random',
      'chess 960',
      'randomized chess',
      'online chess',
      'bullet chess',
      'blitz chess',
      'rapid chess',
      'classical chess',
      'chess platform',
      'competitive chess',
      'no opening theory',
    ],
  }),

  play: generateSEO({
    title: 'Play Chess960 - Fischer Random Chess',
    description:
      'Start playing Fischer Random Chess now! Choose from bullet, blitz, rapid, or classical time controls. No opening theory required.',
    path: '/play',
    keywords: ['play chess960', 'fischer random chess', 'play chess', 'chess matchmaking', 'online chess game', 'randomized chess'],
  }),

  leaderboard: generateSEO({
    title: 'Chess960 Leaderboard - Top Players',
    description:
      'View the top Chess960 players worldwide. Rankings based on Glicko rating across all time controls. See where you rank among the best.',
    path: '/leaderboard',
    keywords: ['chess960 leaderboard', 'chess rankings', 'top chess players', 'glicko rating', 'chess ratings', 'fischer random chess'],
  }),

  tournaments: generateSEO({
    title: 'Chess960 Tournaments',
    description:
      'Join Chess960 tournaments and compete with players worldwide. Swiss system, round-robin, and elimination formats available.',
    path: '/tournaments',
    keywords: ['chess960 tournaments', 'chess tournaments', 'fischer random tournaments', 'chess competition', 'tournament chess'],
  }),

  about: generateSEO({
    title: 'About Chess960 - Fischer Random Chess',
    description:
      'Learn about Chess960 (Fischer Random Chess), the chess variant that eliminates opening theory. Discover the history, rules, and benefits of randomized starting positions.',
    path: '/about',
    keywords: ['about chess960', 'fischer random chess rules', 'chess960 history', 'randomized chess', 'chess variant'],
  }),

  faq: generateSEO({
    title: 'Chess960 FAQ - Frequently Asked Questions',
    description:
      'Get answers to common questions about Chess960, Fischer Random Chess rules, time controls, ratings, and gameplay.',
    path: '/faq',
    keywords: ['chess960 faq', 'fischer random chess faq', 'chess960 questions', 'chess960 help', 'chess960 rules'],
  }),

  signin: generateSEO({
    title: 'Sign In - Chess960',
    description: 'Sign in to Chess960. Play Fischer Random Chess, track your rating, and compete with players worldwide.',
    path: '/auth/signin',
    noIndex: true, // Don't index auth pages
  }),

  signup: generateSEO({
    title: 'Sign Up - Chess960',
    description: 'Create your Chess960 account. Join thousands of players and start playing Fischer Random Chess.',
    path: '/auth/signup',
    noIndex: true,
  }),
};

// Helper to generate profile metadata
export function generateProfileSEO(handle: string, rating?: number, gamesPlayed?: number): Metadata {
  const stats = rating ? ` • ${rating} rating` : '';
  const games = gamesPlayed ? ` • ${gamesPlayed} games` : '';

  return generateSEO({
    title: `${handle} - Chess960 Profile`,
    description: `View ${handle}'s Chess960 profile${stats}${games}. See game history, statistics, and achievements in Fischer Random Chess.`,
    path: `/profile/${handle}`,
    keywords: ['chess960 profile', 'chess player', handle, 'chess stats', 'chess history', 'fischer random chess'],
  });
}

// Helper to generate game metadata
export function generateGameSEO(gameId: string, white?: string, black?: string, result?: string, timeControl?: string): Metadata {
  const title = white && black ? `${white} vs ${black} - Chess960` : 'Chess960 Game';
  const resultText = result ? ` - ${result}` : '';
  const timeText = timeControl ? ` (${timeControl})` : '';

  return generateSEO({
    title,
    description: `Watch or replay this Chess960 game${resultText}${timeText}. View all moves, time control, and analysis of Fischer Random Chess.`,
    path: `/game/${gameId}`,
    keywords: ['chess960 game', 'chess replay', 'chess analysis', 'fischer random chess', 'chess game'],
  });
}

// Helper to generate tournament metadata
export function generateTournamentSEO(tournamentId: string, name: string, status: string, participants?: number): Metadata {
  const participantText = participants ? ` • ${participants} players` : '';
  
  return generateSEO({
    title: `${name} - Chess960 Tournament`,
    description: `Join the ${name} Chess960 tournament${participantText}. ${status} tournament with Fischer Random Chess.`,
    path: `/tournaments/${tournamentId}`,
    keywords: ['chess960 tournament', 'chess tournament', 'fischer random tournament', name.toLowerCase(), 'chess competition'],
  });
}
