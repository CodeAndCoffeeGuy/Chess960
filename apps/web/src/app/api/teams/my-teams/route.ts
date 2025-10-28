import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/teams/my-teams - Get teams where user is leader or admin
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
        role: {
          in: ['LEADER', 'ADMIN'],
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            avatar: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return NextResponse.json({
      teams: teams.map(tm => ({
        ...tm.team,
        role: tm.role,
        memberCount: tm.team._count.members,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch user teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
