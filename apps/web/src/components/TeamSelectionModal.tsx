'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  role: string;
  memberCount: number;
}

interface TeamMember {
  id: string;
  userId: string;
  handle: string;
  name: string | null;
  image: string | null;
  rating: number;
  role: string;
}

interface TeamSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teamId: string, playerIds: string[]) => Promise<void>;
  tournamentId: string | null;
  maxPlayers: number;
}

export function TeamSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  tournamentId: _tournamentId,
  maxPlayers,
}: TeamSelectionModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'team' | 'players'>('team');

  useEffect(() => {
    if (isOpen) {
      fetchUserTeams();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchUserTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teams/my-teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams);

        // Auto-select if only one team
        if (data.teams.length === 1) {
          setSelectedTeamId(data.teams[0].id);
          setStep('players');
        }
      } else {
        setError('Failed to load your teams');
      }
    } catch {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members);

        // Auto-select members up to maxPlayers (sorted by rating)
        const sorted = [...data.members].sort((a, b) => b.rating - a.rating);
        const autoSelected = sorted.slice(0, maxPlayers).map(m => m.userId);
        setSelectedPlayerIds(autoSelected);
      } else {
        setError('Failed to load team members');
      }
    } catch {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setStep('players');
  };

  const togglePlayer = (userId: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else if (prev.length < maxPlayers) {
        return [...prev, userId];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!selectedTeamId || selectedPlayerIds.length === 0) {
      setError('Please select a team and at least one player');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit(selectedTeamId, selectedPlayerIds);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join tournament');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('team');
    setSelectedTeamId('');
    setTeamMembers([]);
    setSelectedPlayerIds([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {step === 'team' ? 'Select Your Team' : 'Select Players'}
          </h2>
          {step === 'players' && (
            <p className="text-sm text-gray-400 mt-2">
              Select up to {maxPlayers} players for this tournament
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-400">Loading...</div>
            </div>
          ) : step === 'team' ? (
            <div className="space-y-3">
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">You are not a leader or admin of any team.</p>
                  <p className="text-sm text-gray-500">
                    Only team leaders and admins can join tournaments.
                  </p>
                </div>
              ) : (
                teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className="w-full bg-gray-750 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {team.avatar ? (
                        <img src={team.avatar} alt={team.name} className="w-12 h-12 rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xl font-bold">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{team.memberCount} members</span>
                          <span className="text-blue-400">{team.role}</span>
                        </div>
                      </div>
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => togglePlayer(member.userId)}
                  disabled={!selectedPlayerIds.includes(member.userId) && selectedPlayerIds.length >= maxPlayers}
                  className={`w-full border rounded-lg p-4 text-left transition-colors ${
                    selectedPlayerIds.includes(member.userId)
                      ? 'bg-blue-900 border-blue-500'
                      : 'bg-gray-750 border-gray-700 hover:bg-gray-700'
                  } ${
                    !selectedPlayerIds.includes(member.userId) && selectedPlayerIds.length >= maxPlayers
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {member.image ? (
                        <img src={member.image} alt={member.handle} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {member.handle.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-white truncate">{member.handle}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>Rating: {member.rating}</span>
                        {member.role !== 'MEMBER' && (
                          <span className="text-yellow-400">{member.role}</span>
                        )}
                      </div>
                    </div>
                    {selectedPlayerIds.includes(member.userId) && (
                      <svg
                        className="w-6 h-6 text-blue-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          {step === 'players' && (
            <button
              onClick={() => {
                setStep('team');
                setSelectedTeamId('');
                setTeamMembers([]);
                setSelectedPlayerIds([]);
              }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
          >
            Cancel
          </button>
          {step === 'players' && (
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedPlayerIds.length === 0}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Joining...' : `Join with ${selectedPlayerIds.length} player${selectedPlayerIds.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
