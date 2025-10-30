import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';
  
  try {
    // Get counts for pagination
    const [userCount, tournamentCount, gameCount] = await Promise.all([
      prisma.user.count({ where: { handle: { not: null }, deletedAt: null } }),
      prisma.tournament.count({ where: { status: { in: ['UPCOMING', 'LIVE', 'FINISHED'] } } }),
      prisma.game.count({ where: { endedAt: { not: null } } }),
    ]);

    const usersPerSitemap = 1000;
    const tournamentsPerSitemap = 100;
    const gamesPerSitemap = 500;

    const userSitemaps = Math.ceil(userCount / usersPerSitemap);
    const tournamentSitemaps = Math.ceil(tournamentCount / tournamentsPerSitemap);
    const gameSitemaps = Math.ceil(gameCount / gamesPerSitemap);

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  ${Array.from({ length: userSitemaps }, (_, i) => `
  <sitemap>
    <loc>${baseUrl}/sitemap-users-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
  ${Array.from({ length: tournamentSitemaps }, (_, i) => `
  <sitemap>
    <loc>${baseUrl}/sitemap-tournaments-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
  ${Array.from({ length: gameSitemaps }, (_, i) => `
  <sitemap>
    <loc>${baseUrl}/sitemap-games-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>`;

    return new NextResponse(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
