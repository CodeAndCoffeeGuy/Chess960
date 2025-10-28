export function WebsiteStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Chess960',
    description: 'The premier platform for Chess960 (Fischer Random Chess). Play bullet, blitz, rapid, and classical games with randomized starting positions.',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/profile/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chess960',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function GameStructuredData({ gameId, whitePlayer, blackPlayer }: {
  gameId: string;
  whitePlayer: string;
  blackPlayer: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: `Chess960 Game: ${whitePlayer} vs ${blackPlayer}`,
    description: `Chess960 (Fischer Random) game between ${whitePlayer} (White) and ${blackPlayer} (Black)`,
    url: `${siteUrl}/game/${gameId}`,
    gameItem: {
      '@type': 'Thing',
      name: 'Chess960',
    },
    numberOfPlayers: 2,
    characterAttribute: [
      {
        '@type': 'PropertyValue',
        name: 'White Player',
        value: whitePlayer,
      },
      {
        '@type': 'PropertyValue',
        name: 'Black Player',
        value: blackPlayer,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ProfileStructuredData({ handle, rating, gamesPlayed }: {
  handle: string;
  rating: number;
  gamesPlayed: number;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: handle,
      url: `${siteUrl}/profile/${handle}`,
      description: `Chess player profile for ${handle}`,
      knowsAbout: 'Chess',
      hasOccupation: {
        '@type': 'Role',
        hasOccupation: {
          '@type': 'Occupation',
          name: 'Chess Player',
        },
      },
    },
    about: {
      '@type': 'Thing',
      name: 'Chess',
      description: `Player stats: ${rating} rating, ${gamesPlayed} games played`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Chess960',
    description: 'The premier platform for Chess960 (Fischer Random Chess). Play bullet, blitz, rapid, and classical games with randomized starting positions.',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
      width: 400,
      height: 400,
    },
    sameAs: [
      // Add your social media profiles
      // 'https://twitter.com/bulletchess',
      // 'https://github.com/bulletchess',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: {
  items: Array<{ name: string; url: string }>;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
