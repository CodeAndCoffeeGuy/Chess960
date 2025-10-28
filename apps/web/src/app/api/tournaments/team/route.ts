import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where = status && status !== 'all'
      ? { status: status as 'UPCOMING' | 'LIVE' | 'FINISHED' }
      : {};

    const tournaments = await prisma.teamTournament.findMany({
      where,
      include: {
        teamEntries: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startsAt: 'desc' },
      ],
    });

    const tournamentsWithCounts = tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      tc: tournament.tc,
      startsAt: tournament.startsAt.toISOString(),
      duration: tournament.duration,
      endsAt: tournament.endsAt?.toISOString() || null,
      maxTeams: tournament.maxTeams,
      playersPerTeam: tournament.playersPerTeam,
      nbLeaders: tournament.nbLeaders,
      teamCount: tournament.teamEntries.length,
      createdBy: tournament.createdBy,
      createdAt: tournament.createdAt.toISOString(),
    }));

    return NextResponse.json({ tournaments: tournamentsWithCounts });
  } catch (error) {
    console.error('Error fetching team tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team tournaments' },
      { status: 500 }
    );
  }
}
