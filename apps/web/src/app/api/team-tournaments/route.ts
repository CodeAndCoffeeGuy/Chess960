import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// POST /api/team-tournaments - Create a new team tournament
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      clockTime = 2,
      clockIncrement = 0,
      variant,
      chess960Position,
      startsAt,
      duration,
      maxTeams,
      playersPerTeam,
      nbLeaders,
    } = body;

    // Generate tc string from clockTime and clockIncrement
    const tc = `${clockTime}+${clockIncrement}`;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tournament name is required' },
        { status: 400 }
      );
    }

    if (!startsAt) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }

    if (!duration || duration < 5 || duration > 600) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 600 minutes' },
        { status: 400 }
      );
    }

    const startDate = new Date(startsAt);
    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Tournament start time must be in the future' },
        { status: 400 }
      );
    }

    if (variant === 'CHESS960' && chess960Position !== undefined) {
      if (chess960Position < 0 || chess960Position > 959) {
        return NextResponse.json(
          { error: 'Chess960 position must be between 0 and 959' },
          { status: 400 }
        );
      }
    }

    // Validate nbLeaders (1-20)
    const validatedNbLeaders = nbLeaders || 5;
    if (validatedNbLeaders < 1 || validatedNbLeaders > 20) {
      return NextResponse.json(
        { error: 'Number of leaders must be between 1 and 20' },
        { status: 400 }
      );
    }

    const tournament = await prisma.teamTournament.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        tc,
        variant: variant || 'CHESS960',
        chess960Position: variant === 'CHESS960' ? chess960Position : null,
        startsAt: startDate,
        duration,
        maxTeams: maxTeams || null,
        playersPerTeam: playersPerTeam || 4,
        nbLeaders: validatedNbLeaders,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error('Failed to create team tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create team tournament' },
      { status: 500 }
    );
  }
}

// GET /api/team-tournaments - List team tournaments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status: status as any }),
    };

    const [tournaments, total] = await Promise.all([
      prisma.teamTournament.findMany({
        where,
        include: {
          _count: {
            select: {
              teamEntries: true,
            },
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.teamTournament.count({ where }),
    ]);

    return NextResponse.json({
      tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch team tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team tournaments' },
      { status: 500 }
    );
  }
}
