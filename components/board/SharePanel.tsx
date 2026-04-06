"use client";

import { useState, useEffect, useCallback } from "react";

interface Member {
  id: string;
  user_id: string;
  role: 'editor' | 'viewer';
  created_at: string;
  profile: { id: string; name: string | null; avatar_url: string | null; email: string | null };
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  expires_at: string;
  token: string;
}

interface Props {
  boardId: string;
  onClose: () => void;
}

export default function SharePanel({ boardId, onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error ?? 'Failed to send invitation');
        return;
      }

      // Copy the invite link to clipboard automatically.
      copyToClipboard(data.invite_url, data.invitation.token);

      setInviteEmail('');
      await fetchMembers();
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      // Clipboard API unavailable — silently ignore.
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    try {
      await fetch(`/api/boards/${boardId}/members/${userId}`, { method: 'DELETE' });
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } finally {
      setRemovingId(null);
    }
  };

  const handleRevokeInvitation = async (token: string) => {
    setRevokingToken(token);
    try {
      await fetch(`/api/invitations/${token}`, { method: 'DELETE' });
      setInvitations(prev => prev.filter(i => i.token !== token));
    } finally {
      setRevokingToken(null);
    }
  };

  const roleLabel = (role: string) =>
    role === 'editor' ? 'Can edit' : 'View only';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-ink/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-ink">Share board</h2>
              <p className="text-sm text-ink-soft mt-0.5">
                Invite people to collaborate
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Invite form */}
          <section>
            <h3 className="text-sm font-medium text-ink mb-3">Invite by email</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setInviteError(null); }}
                placeholder="colleague@example.com"
                required
                className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30"
              />

              <div className="flex gap-2">
                {(['editor', 'viewer'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      inviteRole === r
                        ? 'bg-ink text-white'
                        : 'bg-ink/5 text-ink hover:bg-ink/10'
                    }`}
                  >
                    {r === 'editor' ? 'Can edit' : 'View only'}
                  </button>
                ))}
              </div>

              {inviteError && (
                <p className="text-xs text-red-500">{inviteError}</p>
              )}

              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="w-full py-2.5 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {inviting ? 'Sending…' : 'Send invite link'}
              </button>

              <p className="text-xs text-ink-soft text-center">
                The invite link is copied to your clipboard automatically.
                Share it with your collaborator.
              </p>
            </form>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Current members */}
              {members.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-ink mb-3">
                    Members{' '}
                    <span className="text-ink-soft font-normal">({members.length})</span>
                  </h3>
                  <ul className="space-y-2">
                    {members.map(member => (
                      <li
                        key={member.id}
                        className="flex items-center gap-3 py-2"
                      >
                        {/* Avatar */}
                        {member.profile.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt={member.profile.name ?? ''}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EB6E80] to-[#E9B000] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {member.profile.name?.[0]?.toUpperCase() ??
                              member.profile.email?.[0]?.toUpperCase() ??
                              '?'}
                          </div>
                        )}

                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            {member.profile.name ?? member.profile.email ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-ink-soft">{roleLabel(member.role)}</p>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={removingId === member.user_id}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink/30 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Remove member"
                        >
                          {removingId === member.user_id ? (
                            <div className="w-3.5 h-3.5 border border-ink/30 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pending invitations */}
              {invitations.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-ink mb-3">
                    Pending invites{' '}
                    <span className="text-ink-soft font-normal">({invitations.length})</span>
                  </h3>
                  <ul className="space-y-2">
                    {invitations.map(inv => (
                      <li
                        key={inv.id}
                        className="flex items-center gap-3 py-2"
                      >
                        {/* Email initial */}
                        <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-ink/40 text-xs font-semibold flex-shrink-0">
                          {inv.email[0]?.toUpperCase()}
                        </div>

                        {/* Email + role */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink truncate">{inv.email}</p>
                          <p className="text-xs text-ink-soft">{roleLabel(inv.role)} · Pending</p>
                        </div>

                        {/* Copy link */}
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/invite/${inv.token}`,
                              inv.token
                            )
                          }
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink/30 hover:text-ink hover:bg-ink/5 transition-colors"
                          title="Copy invite link"
                        >
                          {copiedToken === inv.token ? (
                            <svg className="w-4 h-4 stroke-green-500 stroke-2 fill-none" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          )}
                        </button>

                        {/* Revoke */}
                        <button
                          onClick={() => handleRevokeInvitation(inv.token)}
                          disabled={revokingToken === inv.token}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink/30 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Revoke invitation"
                        >
                          {revokingToken === inv.token ? (
                            <div className="w-3.5 h-3.5 border border-ink/30 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {members.length === 0 && invitations.length === 0 && (
                <p className="text-sm text-ink-soft text-center py-4">
                  No members yet. Invite someone above.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
