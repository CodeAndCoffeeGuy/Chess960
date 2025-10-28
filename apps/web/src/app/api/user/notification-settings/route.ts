import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// Notification settings type
interface NotificationSettings {
  pushNotifications: boolean;
  gameNotifications: boolean;
  tournamentNotifications: boolean;
}

// Partial update type
type NotificationSettingsUpdate = Partial<NotificationSettings>;

// GET /api/user/notification-settings - Get user notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        pushNotifications: true,
        gameNotifications: true,
        tournamentNotifications: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure non-null values with defaults (Prisma returns nullable but DB has non-null)
    const settings: NotificationSettings = {
      pushNotifications: user.pushNotifications ?? true,
      gameNotifications: user.gameNotifications ?? true,
      tournamentNotifications: user.tournamentNotifications ?? true,
    };

    // Create response with caching
    const response = NextResponse.json(settings);
    response.headers.set('Cache-Control', 'private, max-age=300');

    return response;
  } catch (error) {
    console.error('Fetch notification settings error:', error);

    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/notification-settings - Update user notification preferences (partial updates allowed)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: NotificationSettingsUpdate = {};

    // Validate and build update data - allow partial updates
    const validKeys: (keyof NotificationSettings)[] = [
      'pushNotifications',
      'gameNotifications',
      'tournamentNotifications'
    ];

    let hasValidUpdate = false;

    for (const key of validKeys) {
      if (key in body) {
        if (typeof body[key] !== 'boolean') {
          return NextResponse.json(
            { error: `Invalid value for ${key}. Must be a boolean.` },
            { status: 400 }
          );
        }
        updateData[key] = body[key];
        hasValidUpdate = true;
      }
    }

    // Check if at least one valid field was provided
    if (!hasValidUpdate) {
      return NextResponse.json(
        { error: 'At least one notification setting must be provided' },
        { status: 400 }
      );
    }

    // Check for invalid keys
    const invalidKeys = Object.keys(body).filter(key => !validKeys.includes(key as keyof NotificationSettings));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid fields: ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Update user notification preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        pushNotifications: true,
        gameNotifications: true,
        tournamentNotifications: true,
      },
    });

    // Ensure non-null values with defaults
    const settings: NotificationSettings = {
      pushNotifications: updatedUser.pushNotifications ?? true,
      gameNotifications: updatedUser.gameNotifications ?? true,
      tournamentNotifications: updatedUser.tournamentNotifications ?? true,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);

    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

// POST /api/user/notification-settings - Update all notification preferences (deprecated, use PATCH)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate that all required fields are present for POST
    const requiredFields: (keyof NotificationSettings)[] = [
      'pushNotifications',
      'gameNotifications',
      'tournamentNotifications'
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}. Use PATCH for partial updates.` },
          { status: 400 }
        );
      }
      if (typeof body[field] !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid value for ${field}. Must be a boolean.` },
          { status: 400 }
        );
      }
    }

    // Update all notification preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushNotifications: body.pushNotifications,
        gameNotifications: body.gameNotifications,
        tournamentNotifications: body.tournamentNotifications,
      },
      select: {
        pushNotifications: true,
        gameNotifications: true,
        tournamentNotifications: true,
      },
    });

    // Ensure non-null values with defaults
    const settings: NotificationSettings = {
      pushNotifications: updatedUser.pushNotifications ?? true,
      gameNotifications: updatedUser.gameNotifications ?? true,
      tournamentNotifications: updatedUser.tournamentNotifications ?? true,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);

    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}



