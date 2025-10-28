import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// POST /api/team-tournaments/[id]/messages - Send message in team tournament
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
    const { content, teamId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Verify tournament exists
    const tournament = await prisma.teamTournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Team tournament not found' },
        { status: 404 }
      );
    }

    // If teamId is provided (team chat), verify user is a member of that team
    if (teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: session.user.id,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You are not a member of this team' },
          { status: 403 }
        );
      }

      // Verify team is in the tournament
      const teamEntry = await prisma.teamTournamentEntry.findUnique({
        where: {
          teamTournamentId_teamId: {
            teamTournamentId: id,
            teamId,
          },
        },
      });

      if (!teamEntry) {
        return NextResponse.json(
          { error: 'Team is not in this tournament' },
          { status: 400 }
        );
      }
    } else {
      // For global chat, verify user is participating in the tournament
      const userEntry = await prisma.teamTournamentEntry.findFirst({
        where: {
          teamTournamentId: id,
          players: {
            some: {
              userId: session.user.id,
            },
          },
        },
      });

      if (!userEntry) {
        return NextResponse.json(
          { error: 'You are not participating in this tournament' },
          { status: 403 }
        );
      }
    }

    const message = await prisma.teamTournamentMessage.create({
      data: {
        teamTournamentId: id,
        teamId: teamId || null,
        userId: session.user.id,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/team-tournaments/[id]/messages - Get messages for team tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId'); // If null, get global chat
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Cursor-based pagination

    // Verify tournament exists
    const tournament = await prisma.teamTournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Team tournament not found' },
        { status: 404 }
      );
    }

    // If teamId is provided, verify user is a member
    if (teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: session.user.id,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You are not a member of this team' },
          { status: 403 }
        );
      }
    } else {
      // For global chat, verify user is participating
      const userEntry = await prisma.teamTournamentEntry.findFirst({
        where: {
          teamTournamentId: id,
          players: {
            some: {
              userId: session.user.id,
            },
          },
        },
      });

      if (!userEntry) {
        return NextResponse.json(
          { error: 'You are not participating in this tournament' },
          { status: 403 }
        );
      }
    }

    const messages = await prisma.teamTournamentMessage.findMany({
      where: {
        teamTournamentId: id,
        teamId: teamId || null,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
