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

    const { username, fullName, country, allowFriendRequests, allowMessages, allowGameMessages, allowChallenges, allowTakebacks } = await request.json();

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        handle: true,
        handleChangedAt: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let usernameChanged = false;
    const updateData: any = {};

    // Handle username update if it's different and allowed
    if (username && username !== currentUser.handle) {
      if (currentUser.handleChangedAt) {
        return NextResponse.json(
          { error: 'Username can only be changed once' },
          { status: 403 }
        );
      }

      // Validate username
      if (typeof username !== 'string') {
        return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
      }

      const cleanUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');

      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 20 characters' },
          { status: 400 }
        );
      }

      // Check if username is already taken (case-insensitive)
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

      updateData.handle = cleanUsername;
      updateData.handleChangedAt = new Date();
      usernameChanged = true;
    }

    // Handle optional fields
    if (fullName !== undefined) {
      if (typeof fullName !== 'string') {
        return NextResponse.json({ error: 'Invalid full name' }, { status: 400 });
      }
      const trimmedFullName = fullName.trim();
      if (trimmedFullName.length > 100) {
        return NextResponse.json(
          { error: 'Full name must be less than 100 characters' },
          { status: 400 }
        );
      }
      updateData.fullName = trimmedFullName || null;
    }

    if (country !== undefined) {
      if (country && typeof country !== 'string') {
        return NextResponse.json({ error: 'Invalid country code' }, { status: 400 });
      }
      updateData.country = country || null;
    }

    // Handle privacy settings with validation
    if (allowFriendRequests !== undefined) {
      if (typeof allowFriendRequests !== 'boolean') {
        return NextResponse.json({ error: 'Invalid allowFriendRequests value' }, { status: 400 });
      }
      updateData.allowFriendRequests = allowFriendRequests;
    }

    if (allowMessages !== undefined) {
      if (typeof allowMessages !== 'boolean') {
        return NextResponse.json({ error: 'Invalid allowMessages value' }, { status: 400 });
      }
      updateData.allowMessages = allowMessages;
    }

    if (allowGameMessages !== undefined) {
      if (typeof allowGameMessages !== 'boolean') {
        return NextResponse.json({ error: 'Invalid allowGameMessages value' }, { status: 400 });
      }
      updateData.allowGameMessages = allowGameMessages;
    }

    if (allowTakebacks !== undefined) {
      if (typeof allowTakebacks !== 'boolean') {
        return NextResponse.json({ error: 'Invalid allowTakebacks value' }, { status: 400 });
      }
      updateData.allowTakebacks = allowTakebacks;
    }

    if (allowChallenges !== undefined) {
      const validChallengeSettings = ['NEVER', 'RATING_RANGE', 'FRIENDS_ONLY', 'REGISTERED', 'EVERYONE'];
      if (!validChallengeSettings.includes(allowChallenges)) {
        return NextResponse.json({ error: 'Invalid allowChallenges value' }, { status: 400 });
      }
      updateData.allowChallenges = allowChallenges;
    }

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      usernameChanged,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
