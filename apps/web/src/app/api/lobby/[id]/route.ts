import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@chess960/db';

// DELETE /api/lobby/[id] - Delete a lobby
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the lobby
    const lobby = await prisma.lobby.findUnique({
      where: { id },
    });

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Check if user is the host
    if (lobby.hostId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Only the host can delete this lobby' },
        { status: 403 }
      );
    }

    // Delete the lobby
    await prisma.lobby.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lobby:', error);
    return NextResponse.json(
      { error: 'Failed to delete lobby' },
      { status: 500 }
    );
  }
}
