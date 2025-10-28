import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has already changed their username
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { handleChangedAt: true },
    });

    if (currentUser?.handleChangedAt) {
      return NextResponse.json(
        { error: 'Username can only be changed once' },
        { status: 403 }
      );
    }

    const { username } = await request.json();

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    // Check if username is already taken (case-insensitive, excluding current user)
    const existingUsers = await prisma.user.findMany({
      where: {
        handle: {
          equals: cleanUsername,
          mode: 'insensitive',
        },
      },
    });

    if (existingUsers.length > 0 && existingUsers[0].id !== session.user.id) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Update user's handle and set handleChangedAt
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        handle: cleanUsername,
        handleChangedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, username: cleanUsername });
  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json(
      { error: 'Failed to update username' },
      { status: 500 }
    );
  }
}
