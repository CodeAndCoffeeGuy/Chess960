export function WebsiteStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Chess960 - Fischer Random Chess Platform',
    alternateName: 'Chess960',
    description: 'The premier platform for Chess960 (Fischer Random Chess). Play bullet, blitz, rapid, and classical games with randomized starting positions. No opening theory required.',
    url: siteUrl,
    inLanguage: 'en-US',
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
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://twitter.com/Chess960HQ',
        'https://github.com/CodeAndCoffeeGuy/chess960',
      ],
    },
    mainEntity: {
      '@type': 'Game',
      name: 'Chess960',
      alternateName: 'Fischer Random Chess',
      description: 'A chess variant with randomized starting positions that eliminates opening theory',
      genre: 'Strategy Game',
      numberOfPlayers: '2',
      gameLocation: siteUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
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

export function GameStructuredData({ 
  gameId, 
  whitePlayer, 
  blackPlayer, 
  result, 
  timeControl,
  date 
}: {
  gameId: string;
  whitePlayer: string;
  blackPlayer: string;
  result?: string;
  timeControl?: string;
  date?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: `Chess960 Game: ${whitePlayer} vs ${blackPlayer}`,
    alternateName: 'Fischer Random Chess Game',
    description: `Chess960 (Fischer Random) game between ${whitePlayer} (White) and ${blackPlayer} (Black)${result ? ` - ${result}` : ''}`,
    url: `${siteUrl}/game/${gameId}`,
    gameItem: {
      '@type': 'Thing',
      name: 'Chess960',
      alternateName: 'Fischer Random Chess',
    },
    numberOfPlayers: 2,
    genre: 'Strategy Game',
    ...(date && { datePublished: date }),
    ...(timeControl && { 
      gameLocation: {
        '@type': 'VirtualLocation',
        name: 'Chess960 Platform',
        url: siteUrl,
      },
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Time Control',
        value: timeControl,
      }
    }),
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
      ...(result ? [{
        '@type': 'PropertyValue',
        name: 'Result',
        value: result,
      }] : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function TournamentStructuredData({
  tournamentId,
  name,
  description,
  status,
  startDate,
  endDate,
  participants,
  timeControl,
}: {
  tournamentId: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  participants?: number;
  timeControl?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${name} - Chess960 Tournament`,
    description: description || `Chess960 tournament: ${name}`,
    url: `${siteUrl}/tournaments/${tournamentId}`,
    eventStatus: status === 'LIVE' ? 'https://schema.org/EventScheduled' : 
                 status === 'FINISHED' ? 'https://schema.org/EventScheduled' : 
                 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      name: 'Chess960 Platform',
      url: siteUrl,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Chess960',
      url: siteUrl,
    },
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(participants && { 
      maximumAttendeeCapacity: participants,
      remainingAttendeeCapacity: participants,
    }),
    about: {
      '@type': 'Game',
      name: 'Chess960',
      alternateName: 'Fischer Random Chess',
      description: 'A chess variant with randomized starting positions',
    },
    ...(timeControl && {
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Time Control',
        value: timeControl,
      }
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function PersonStructuredData({ 
  handle, 
  fullName, 
  rating, 
  gamesPlayed, 
  country 
}: {
  handle: string;
  fullName?: string;
  rating: number;
  gamesPlayed: number;
  country?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName || handle,
    alternateName: handle,
    url: `${siteUrl}/profile/${handle}`,
    description: `Chess960 player ${handle} with ${rating} rating and ${gamesPlayed} games played`,
    knowsAbout: ['Chess', 'Chess960', 'Fischer Random Chess'],
    hasOccupation: {
      '@type': 'Role',
      roleName: 'Chess Player',
      description: 'Chess960 (Fischer Random Chess) player',
    },
    ...(country && {
      address: {
        '@type': 'PostalAddress',
        addressCountry: country,
      },
    }),
    sameAs: [`${siteUrl}/profile/${handle}`],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: {
  items: Array<{
    name: string;
    url: string;
  }>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
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

// Removed duplicate BreadcrumbStructuredData
