import { Metadata } from 'next';
import { generateTournamentSEO } from '@/lib/seo';
import TournamentPageClient from '../../TournamentPageClient';
import { prisma } from '@chess960/db';
import { notFound } from 'next/navigation';

interface TournamentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    // Fetch tournament data for SEO
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        timeControl: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!tournament) {
      return generateTournamentSEO(id, 'Tournament', 'Unknown');
    }

    const status = tournament.status === 'UPCOMING' ? 'Upcoming' : 
                  tournament.status === 'LIVE' ? 'Live' : 'Finished';
    const participants = tournament._count.players;

    return generateTournamentSEO(
      tournament.id,
      tournament.name,
      status,
      tournament.startsAt?.toISOString(),
      tournament.endsAt?.toISOString(),
      participants,
      tournament.timeControl
    );
  } catch (error) {
    console.error('Error generating tournament metadata:', error);
    return generateTournamentSEO(id, 'Tournament', 'Unknown');
  }
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params;
  
  try {
    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!tournament) {
      notFound();
    }

    return <TournamentPageClient />;
  } catch (error) {
    console.error('Error loading tournament:', error);
    notFound();
  }
}