import { MetadataRoute } from 'next';
import { prisma } from '@chess960/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';
  const currentDate = new Date();

  // Static pages
  const routes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/play`,
      lastModified: currentDate,
      changeFrequency: 'always' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: currentDate,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: currentDate,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tournaments/create`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/source`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Dynamic routes - fetch from database
  try {
    // Get top 1000 user profiles (most active players)
    const topUsers = await prisma.user.findMany({
      where: {
        handle: { not: null },
        deletedAt: null,
      },
      select: {
        handle: true,
        lastActivityAt: true,
        createdAt: true,
      },
      orderBy: [
        { lastActivityAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 1000,
    });

    // Add user profile routes
    const userRoutes = topUsers.map((user) => ({
      url: `${baseUrl}/profile/${user.handle}`,
      lastModified: user.lastActivityAt ?? user.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Get recent tournaments (last 100)
    const recentTournaments = await prisma.tournament.findMany({
      where: {
        status: { in: ['UPCOMING', 'LIVE', 'FINISHED'] },
      },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
      orderBy: [
        { endsAt: 'desc' },
        { startsAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    // Add tournament routes
    const tournamentRoutes = recentTournaments.map((tournament) => ({
      url: `${baseUrl}/tournaments/${tournament.id}`,
      lastModified: tournament.endsAt ?? tournament.startsAt ?? tournament.createdAt,
      changeFrequency: tournament.status === 'LIVE' ? 'hourly' as const : 'daily' as const,
      priority: tournament.status === 'LIVE' ? 0.8 : 0.7,
    }));

    // Get recent games (last 500)
    const recentGames = await prisma.game.findMany({
      where: {
        endedAt: { not: null },
      },
      select: {
        id: true,
        endedAt: true,
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 500,
    });

    // Add game routes
    const gameRoutes = recentGames.map((game) => ({
      url: `${baseUrl}/game/${game.id}`,
      lastModified: game.endedAt!,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...routes, ...userRoutes, ...tournamentRoutes, ...gameRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static routes if database fails
    return routes;
  }
}
