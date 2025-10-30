import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';
  const { page } = params;
  const pageNum = parseInt(page) || 1;
  const usersPerPage = 1000;
  const skip = (pageNum - 1) * usersPerPage;

  try {
    const users = await prisma.user.findMany({
      where: {
        handle: { not: null },
        isActive: true,
      },
      select: {
        handle: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: usersPerPage,
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${users.map(user => `
  <url>
    <loc>${baseUrl}/profile/${user.handle}</loc>
    <lastmod>${user.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating users sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
