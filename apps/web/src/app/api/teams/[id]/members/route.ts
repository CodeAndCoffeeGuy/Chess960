import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// GET /api/teams/[id]/members - Get team members with ratings
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
    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // Get all team members with their ratings
    const members = await prisma.teamMember.findMany({
      where: {
        teamId: id,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        role: 'asc', // Leaders first, then admins, then members
      },
    });

    // Fetch user details and ratings separately
    const userIds = members.map(m => m.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        handle: true,
        name: true,
        image: true,
      },
    });

    // Combine member info with user details
    const membersWithDetails = members.map(member => {
      const user = users.find(u => u.id === member.userId);
      return {
        id: member.id,
        userId: member.userId,
        handle: user?.handle || 'Anonymous',
        name: user?.name,
        image: user?.image,
        rating: 1500, // Default rating, will be updated from actual rating data
        role: member.role,
        joinedAt: member.joinedAt,
      };
    });

    return NextResponse.json({
      members: membersWithDetails,
      team: members[0]?.team,
    });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/members - Join team
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

    const team = await prisma.team.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if team is full
    if (team.maxMembers && team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { error: 'Team is full' },
        { status: 400 }
      );
    }

    // Check if team is public or user is invited
    if (!team.isPublic) {
      return NextResponse.json(
        { error: 'This team is private' },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 400 }
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: session.user.id,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Failed to join team:', error);
    return NextResponse.json(
      { error: 'Failed to join team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/members - Leave team or remove member
export async function DELETE(
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
    const userIdToRemove = searchParams.get('userId') || session.user.id;

    const team = await prisma.team.findUnique({
      where: { id: id },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // If removing someone else, must be leader or admin
    if (userIdToRemove !== session.user.id) {
      const requestorMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: id,
            userId: session.user.id,
          },
        },
      });

      if (!requestorMember || (requestorMember.role !== 'LEADER' && requestorMember.role !== 'ADMIN')) {
        return NextResponse.json(
          { error: 'Only leaders and admins can remove members' },
          { status: 403 }
        );
      }
    }

    // Can't remove the leader
    if (team.leaderId === userIdToRemove) {
      return NextResponse.json(
        { error: 'Cannot remove team leader. Transfer leadership first or delete the team.' },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: id,
          userId: userIdToRemove,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id]/members - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: id },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Only leader can change roles
    if (team.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only team leader can change member roles' },
        { status: 403 }
      );
    }

    // Can't change leader role
    if (userId === team.leaderId) {
      return NextResponse.json(
        { error: 'Cannot change leader role. Transfer leadership first.' },
        { status: 400 }
      );
    }

    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
      data: {
        role,
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Failed to update member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}
