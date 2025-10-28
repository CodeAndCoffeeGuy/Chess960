import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chess960/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        handle: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        handle: true,
      },
      take: 10,
      orderBy: {
        handle: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
