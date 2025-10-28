import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

// GET /api/team-tournaments/[id]/featured-game - Get highest-rated ongoing game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    // Get tournament with team entries and players
    const tournament = await prisma.teamTournament.findUnique({
      where: { id: tournamentId },
      include: {
        teamEntries: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            players: {
              where: { active: true },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Tournament is not currently active' },
        { status: 400 }
      );
    }

    // Get all player IDs from tournament
    const playerIds: string[] = [];
    for (const entry of tournament.teamEntries) {
      for (const player of entry.players) {
        playerIds.push(player.userId);
      }
    }

    if (playerIds.length === 0) {
      return NextResponse.json({ featuredGame: null });
    }

    // Find ongoing games involving tournament players
    // Prioritize by: 1) Combined player rating, 2) Game start time (most recent)
    const ongoingGames = await prisma.game.findMany({
      where: {
        AND: [
          {
            OR: [
              { whiteId: { in: playerIds } },
              { blackId: { in: playerIds } },
            ],
          },
          { startedAt: { not: null } },
          { endedAt: null }, // Game is still ongoing
        ],
      },
      include: {
        white: {
          select: {
            id: true,
            handle: true,
            image: true,
          },
        },
        black: {
          select: {
            id: true,
            handle: true,
            image: true,
          },
        },
        moves: {
          orderBy: {
            ply: 'asc',
          },
        },
      },
      take: 10, // Get top 10 to sort in memory
    });

    if (ongoingGames.length === 0) {
      return NextResponse.json({ featuredGame: null });
    }

    // Find team info for each player
    const playerTeamMap = new Map<string, { teamId: string; teamName: string; rating: number }>();
    for (const entry of tournament.teamEntries) {
      for (const player of entry.players) {
        playerTeamMap.set(player.userId, {
          teamId: entry.teamId,
          teamName: entry.team.name,
          rating: player.rating,
        });
      }
    }

    // Sort games by combined rating (highest first)
    const gamesWithRatings = ongoingGames.map(game => {
      const whiteInfo = playerTeamMap.get(game.whiteId || '');
      const blackInfo = playerTeamMap.get(game.blackId || '');
      const whiteRating = whiteInfo?.rating || game.whiteRatingBefore || 1500;
      const blackRating = blackInfo?.rating || game.blackRatingBefore || 1500;
      const combinedRating = whiteRating + blackRating;

      return {
        game,
        whiteInfo,
        blackInfo,
        whiteRating,
        blackRating,
        combinedRating,
      };
    });

    gamesWithRatings.sort((a, b) => b.combinedRating - a.combinedRating);

    const featured = gamesWithRatings[0];

    if (!featured) {
      return NextResponse.json({ featuredGame: null });
    }

    // Convert moves to PGN-style notation for chess.js
    const moves = featured.game.moves.map(move => move.uci);

    return NextResponse.json({
      featuredGame: {
        id: featured.game.id,
        white: {
          id: featured.game.white?.id,
          handle: featured.game.white?.handle || 'Anonymous',
          image: featured.game.white?.image,
          rating: featured.whiteRating,
          teamId: featured.whiteInfo?.teamId,
          teamName: featured.whiteInfo?.teamName,
        },
        black: {
          id: featured.game.black?.id,
          handle: featured.game.black?.handle || 'Anonymous',
          image: featured.game.black?.image,
          rating: featured.blackRating,
          teamId: featured.blackInfo?.teamId,
          teamName: featured.blackInfo?.teamName,
        },
        moves,
        startedAt: featured.game.startedAt,
        tc: featured.game.tc,
        variant: featured.game.variant,
        chess960Position: featured.game.chess960Position,
      },
    });
  } catch (error) {
    console.error('Failed to fetch featured game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured game' },
      { status: 500 }
    );
  }
}
