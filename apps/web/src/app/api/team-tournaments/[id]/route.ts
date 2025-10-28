import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/team-tournaments/[id] - Get team tournament details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await prisma.teamTournament.findUnique({
      where: { id },
      include: {
        teamEntries: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            players: {
              include: {
                entry: {
                  select: {
                    teamId: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { score: 'desc' },
            { wins: 'desc' },
          ],
        },
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

    // Calculate team statistics
    const teamEntriesWithStats = tournament.teamEntries.map((entry) => {
      const activePlayers = entry.players.filter(p => p.active);

      // Calculate average rating
      const avgRating = activePlayers.length > 0
        ? Math.round(activePlayers.reduce((sum, p) => sum + p.rating, 0) / activePlayers.length)
        : 1500;

      // Calculate average performance (only for players who have played)
      const playersWithGames = activePlayers.filter(p => p.gamesPlayed > 0 && p.performance !== null);
      const avgPerformance = playersWithGames.length > 0
        ? Math.round(playersWithGames.reduce((sum, p) => sum + (p.performance || 0), 0) / playersWithGames.length)
        : avgRating;

      // Get top 3 performers
      const topPerformers = activePlayers
        .filter(p => p.gamesPlayed > 0)
        .slice(0, 3)
        .map(p => ({
          userId: p.userId,
          rating: p.rating,
          performance: p.performance || p.rating,
          score: p.score,
        }));

      // Total games played by team
      const totalGamesPlayed = activePlayers.reduce((sum, p) => sum + p.gamesPlayed, 0);

      return {
        id: entry.id,
        teamId: entry.teamId,
        teamName: entry.team.name,
        teamAvatar: entry.team.avatar,
        score: entry.score,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        withdrawn: entry.withdrawn,
        stats: {
          avgRating,
          avgPerformance,
          topPerformers,
          activePlayerCount: activePlayers.length,
          totalGamesPlayed,
        },
        players: entry.players.map(p => ({
          id: p.id,
          userId: p.userId,
          rating: p.rating,
          score: p.score,
          gamesPlayed: p.gamesPlayed,
          wins: p.wins,
          losses: p.losses,
          draws: p.draws,
          streak: p.streak,
          performance: p.performance,
          active: p.active,
        })),
      };
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        tc: tournament.tc,
        variant: tournament.variant,
        chess960Position: tournament.chess960Position,
        startsAt: tournament.startsAt.toISOString(),
        duration: tournament.duration,
        endsAt: tournament.endsAt?.toISOString(),
        maxTeams: tournament.maxTeams,
        playersPerTeam: tournament.playersPerTeam,
        nbLeaders: tournament.nbLeaders,
        teamCount: tournament._count.teamEntries,
        createdBy: tournament.createdBy,
        winnerTeamId: tournament.winnerTeamId,
        teamEntries: teamEntriesWithStats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch team tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team tournament' },
      { status: 500 }
    );
  }
}
