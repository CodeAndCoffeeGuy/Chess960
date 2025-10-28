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
    title: 'Chess960 - Ultra-Fast Online Chess Platform',
    description:
      'Play ultra-fast bullet chess online. Instant matchmaking for 1+0 and 2+0 games. Compete with players worldwide, track your Elo rating, and improve your speed chess skills.',
    path: '/',
    keywords: [
      'bullet chess',
      'online chess',
      'fast chess',
      '1+0 chess',
      '2+0 chess',
      'speed chess',
      'chess online',
      'play chess',
      'competitive chess',
    ],
  }),

  play: generateSEO({
    title: 'Play Chess960',
    description:
      'Start playing bullet chess now! Instant matchmaking for 1+0 and 2+0 time controls. Compete in rated or casual games.',
    path: '/play',
    keywords: ['play chess', 'bullet chess game', 'chess matchmaking', 'online chess game'],
  }),

  leaderboard: generateSEO({
    title: 'Chess Leaderboard',
    description:
      'View the top bullet chess players. Rankings based on Elo rating. See where you rank among the best players.',
    path: '/leaderboard',
    keywords: ['chess leaderboard', 'chess rankings', 'top chess players', 'elo rating', 'chess ratings'],
  }),

  signin: generateSEO({
    title: 'Sign In',
    description: 'Sign in to Chess960. Play bullet chess, track your rating, and compete with players worldwide.',
    path: '/auth/signin',
    noIndex: true, // Don't index auth pages
  }),

  signup: generateSEO({
    title: 'Sign Up',
    description: 'Create your Chess960 account. Join thousands of players and start improving your speed chess skills.',
    path: '/auth/signup',
    noIndex: true,
  }),
};

// Helper to generate profile metadata
export function generateProfileSEO(handle: string, rating?: number, gamesPlayed?: number): Metadata {
  const stats = rating ? ` • ${rating} rating` : '';
  const games = gamesPlayed ? ` • ${gamesPlayed} games` : '';

  return generateSEO({
    title: `${handle}'s Profile`,
    description: `View ${handle}'s bullet chess profile${stats}${games}. See game history, statistics, and achievements.`,
    path: `/profile/${handle}`,
    keywords: ['chess profile', 'chess player', handle, 'chess stats', 'chess history'],
  });
}

// Helper to generate game metadata
export function generateGameSEO(gameId: string, white?: string, black?: string, result?: string): Metadata {
  const title = white && black ? `${white} vs ${black}` : 'Chess Game';
  const resultText = result ? ` - ${result}` : '';

  return generateSEO({
    title,
    description: `Watch or replay this bullet chess game${resultText}. View all moves, time control, and analysis.`,
    path: `/game/${gameId}`,
    keywords: ['chess game', 'chess replay', 'chess analysis', 'bullet chess game'],
  });
}
