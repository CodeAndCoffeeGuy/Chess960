import { Metadata } from 'next';
import { generateProfileSEO } from '@/lib/seo';
import ProfilePageClient from '../../ProfilePageClient';
import { prisma } from '@chess960/db';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  
  try {
    // Fetch user data for SEO
    const user = await prisma.user.findUnique({
      where: { handle: username },
      select: {
        handle: true,
        fullName: true,
        ratings: {
          select: {
            tc: true,
            rating: true,
          },
          orderBy: { rating: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            whiteGames: true,
            blackGames: true,
          },
        },
      },
    });

    if (!user) {
      return generateProfileSEO(username);
    }

    const gamesPlayed = user._count.whiteGames + user._count.blackGames;
    const topRating = user.ratings[0]?.rating || 1500;

    return generateProfileSEO(user.handle, topRating, gamesPlayed);
  } catch (error) {
    console.error('Error generating profile metadata:', error);
    return generateProfileSEO(username);
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  return <ProfilePageClient />;
}