import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// Response type for user info
interface UserInfoResponse {
  id: string;
  email: string | null;
  handle: string | null;
  handleChangedAt: Date | null;
  fullName: string | null;
  country: string | null;
  allowFriendRequests: boolean;
  allowMessages: boolean;
  allowGameMessages: boolean;
  allowChallenges: string;
  allowTakebacks: boolean;
  pushNotifications: boolean;
  gameNotifications: boolean;
  tournamentNotifications: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  hasPassword: boolean;
  hasActiveSubscription: boolean;
  authProviders: string[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user data in parallel for better performance
    const [user, accounts, activeSubscription] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          handle: true,
          handleChangedAt: true,
          fullName: true,
          country: true,
          allowFriendRequests: true,
          allowMessages: true,
          allowGameMessages: true,
          allowChallenges: true,
          allowTakebacks: true,
          pushNotifications: true,
          gameNotifications: true,
          tournamentNotifications: true,
          twoFactorEnabled: true,
          createdAt: true,
          password: true, // Only to check if exists
        },
      }),
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: { provider: true },
      }),
      prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Separate password check - never include it in response
    const hasPassword = !!user.password;
    const { password: _password, ...userWithoutPassword } = user;

    // Build response with safe data
    const responseData: UserInfoResponse = {
      ...userWithoutPassword,
      hasPassword,
      hasActiveSubscription: !!activeSubscription,
      authProviders: accounts.map((acc) => acc.provider),
    };

    // Create response with appropriate headers
    const response = NextResponse.json(responseData);

    // Add cache control header (cache for 5 minutes, revalidate in background)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Fetch user info error:', error);

    // Check if it's a database error
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}
