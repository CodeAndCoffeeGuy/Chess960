import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// POST /api/team-tournaments/[id]/join - Join team tournament with a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { teamId, playerUserIds } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    if (!playerUserIds || !Array.isArray(playerUserIds) || playerUserIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one player is required' },
        { status: 400 }
      );
    }

    const tournament = await prisma.teamTournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teamEntries: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Team tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is upcoming
    if (tournament.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Cannot join a tournament that has already started or ended' },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament.maxTeams && tournament._count.teamEntries >= tournament.maxTeams) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Check if user is a member of the team (and is leader or admin)
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: {
                  in: playerUserIds,
                },
              },
              include: {
                team: true,
              },
            },
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    if (teamMember.role !== 'LEADER' && teamMember.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only team leaders and admins can join tournaments' },
        { status: 403 }
      );
    }

    // Check if team is already in the tournament
    const existingEntry = await prisma.teamTournamentEntry.findUnique({
      where: {
        teamTournamentId_teamId: {
          teamTournamentId: id,
          teamId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Team is already in this tournament' },
        { status: 400 }
      );
    }

    // Validate player count
    if (playerUserIds.length > tournament.playersPerTeam) {
      return NextResponse.json(
        { error: `Cannot have more than ${tournament.playersPerTeam} players` },
        { status: 400 }
      );
    }

    // Check if all players are team members
    if (teamMember.team.members.length !== playerUserIds.length) {
      return NextResponse.json(
        { error: 'All selected players must be members of the team' },
        { status: 400 }
      );
    }

    // Get player ratings for the tournament time control
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: playerUserIds,
        },
      },
      select: {
        id: true,
        handle: true,
      },
    });

    // Create tournament entry with players
    const entry = await prisma.teamTournamentEntry.create({
      data: {
        teamTournamentId: id,
        teamId,
        players: {
          create: users.map(user => ({
            userId: user.id,
            rating: 1500, // Default rating, will be updated from actual rating data
          })),
        },
      },
      include: {
        players: true,
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Failed to join team tournament:', error);
    return NextResponse.json(
      { error: 'Failed to join team tournament' },
      { status: 500 }
    );
  }
}
