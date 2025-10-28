'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface TeamMember {
  id: string;
  userId: string;
  role: 'LEADER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  leaderId: string;
  isPublic: boolean;
  maxMembers: number | null;
  createdAt: string;
  members: TeamMember[];
  _count: {
    members: number;
    teamTournamentEntries: number;
  };
}

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setTeamId(id));
  }, [params]);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        throw new Error('Failed to load team');
      }
      const data = await res.json();
      setTeam(data.team);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join team');
      }

      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to leave team');
      }

      router.push('/teams');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading team...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-400 mb-4">{error || 'Team not found'}</div>
          <button
            onClick={() => router.push('/teams')}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  const currentUserMember = team.members.find(m => m.userId === session?.user?.id);
  const isLeader = currentUserMember?.role === 'LEADER';
  const isAdmin = currentUserMember?.role === 'ADMIN';
  const isMember = !!currentUserMember;
  
  // Display authentication status for debugging
  const authStatus = status === 'loading' ? 'Loading...' : 
                    status === 'unauthenticated' ? 'Not signed in' : 
                    'Signed in';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-6">
            <p className="text-sm text-gray-400">Auth Status: {authStatus}</p>
            {team.avatar ? (
              <img
                src={team.avatar}
                alt={team.name}
                className="w-24 h-24 rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-4xl font-bold">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
              {team.description && (
                <p className="text-gray-400 mb-3">{team.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{team._count.members} members</span>
                <span>{team._count.teamTournamentEntries} tournaments</span>
                {team.isPublic && (
                  <span className="text-green-400">Public</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {session && !isMember && team.isPublic && (
              <button
                onClick={handleJoinTeam}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
              >
                Join Team
              </button>
            )}
            {isMember && !isLeader && (
              <button
                onClick={handleLeaveTeam}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold"
              >
                Leave Team
              </button>
            )}
            {(isLeader || isAdmin) && (
              <button
                onClick={() => router.push(`/team-tournaments/create?teamId=${team.id}`)}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
              >
                Create Tournament
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Members</h2>
            <div className="space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-gray-750 rounded p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">User {member.userId.slice(0, 8)}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      member.role === 'LEADER'
                        ? 'bg-yellow-600'
                        : member.role === 'ADMIN'
                        ? 'bg-blue-600'
                        : 'bg-gray-600'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
