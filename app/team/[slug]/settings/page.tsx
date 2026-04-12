"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useUser } from "@/hooks/useUser";

const AVATAR_COLORS = [
  '#E24E42', '#E9B000', '#4CAF50', '#2196F3',
  '#9C27B0', '#FF5722', '#00BCD4', '#795548',
  '#607D8B', '#E91E63', '#3F51B5', '#009688',
];

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface TeamData {
  team: {
    id: string;
    name: string;
    slug: string;
    avatar_color: string;
    owner_id: string;
    owner_profile: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null;
  };
  members: TeamMember[];
  invitations: Invitation[];
  boards: { id: string; name: string }[];
  current_user_role: string;
}

function AvatarCircle({ name, avatar_url }: { name: string | null | undefined; avatar_url: string | null | undefined }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  if (avatar_url) {
    return <img src={avatar_url} alt={name ?? ''} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-papaya to-blush flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

export default function TeamSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { profile } = useUser();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [teamName, setTeamName] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Danger zone
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);

  const loadData = async () => {
    const teamsRes = await fetch('/api/teams');
    if (!teamsRes.ok) { setError('Could not load teams'); setLoading(false); return; }
    const { teams } = await teamsRes.json();
    const team = teams.find((t: any) => t.slug === slug);
    if (!team) { setError('Team not found'); setLoading(false); return; }

    const detailRes = await fetch(`/api/teams/${team.id}`);
    if (!detailRes.ok) { setError('Could not load team'); setLoading(false); return; }
    const teamData: TeamData = await detailRes.json();
    setData(teamData);
    setTeamName(teamData.team.name);
    setAvatarColor(teamData.team.avatar_color);
    setAvatarUrl((teamData.team as any).avatar_url ?? null);
    setLoading(false);
  };

  useEffect(() => { if (slug) loadData(); }, [slug]);

  const canManage = data?.current_user_role === 'owner' || data?.current_user_role === 'admin';
  const isOwner = data?.current_user_role === 'owner';

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    setUploading(true);
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${data.team.id}/logo.${ext}`;
    const { error } = await supabase.storage.from('team-avatars').upload(path, file, { upsert: true });
    if (error) {
      setSaveMsg('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('team-avatars').getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleRemoveLogo = () => {
    setAvatarUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaveMsg('');
    const res = await fetch(`/api/teams/${data.team.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName, avatar_color: avatarColor, avatar_url: avatarUrl }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg('Saved!');
      await loadData();
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      const d = await res.json();
      setSaveMsg(d.error ?? 'Failed to save');
    }
  };

  const handleInvite = async () => {
    if (!data || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg('');
    const res = await fetch(`/api/teams/${data.team.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    setInviting(false);
    const d = await res.json();
    if (res.ok) {
      setInviteMsg('Invitation sent!');
      setInviteEmail('');
      await loadData();
      setTimeout(() => setInviteMsg(''), 4000);
    } else {
      setInviteMsg(d.error ?? 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (memberId: string, userId: string, newRole: string) => {
    if (!data) return;
    await fetch(`/api/teams/${data.team.id}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    await loadData();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!data) return;
    await fetch(`/api/teams/${data.team.id}/members/${userId}`, { method: 'DELETE' });
    await loadData();
  };

  const handleRevokeInvite = async (invId: string) => {
    if (!data) return;
    await fetch(`/api/teams/${data.team.id}/invitations/${invId}`, { method: 'DELETE' });
    await loadData();
  };

  const handleLeave = async () => {
    if (!data || !profile) return;
    setDangerLoading(true);
    const res = await fetch(`/api/teams/${data.team.id}/members/${profile.id}`, { method: 'DELETE' });
    setDangerLoading(false);
    if (res.ok) router.push('/');
  };

  const handleDeleteTeam = async () => {
    if (!data || deleteConfirmName !== data.team.name) return;
    setDangerLoading(true);
    const res = await fetch(`/api/teams/${data.team.id}`, { method: 'DELETE' });
    setDangerLoading(false);
    if (res.ok) router.push('/');
  };

  const allDisplayMembers = data ? [
    { user_id: data.team.owner_id, role: 'owner', profile: data.team.owner_profile },
    ...data.members.filter(m => m.user_id !== data.team.owner_id),
  ] : [];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
        <Header />
        <div className="pt-24 px-6 text-center">
          <p className="text-ink-soft">{error ?? 'Something went wrong'}</p>
          <Link href="/" className="mt-4 inline-block text-papaya text-sm">Go home</Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
      <Header />
      <div className="pt-24 md:pt-28 px-6 pb-16">
        <div className="max-w-2xl mx-auto space-y-10">

          {/* Back link */}
          <Link href={`/team/${slug}`} className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors">
            <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to {data.team.name}
          </Link>

          <div>
            <h1 className="font-serif text-3xl text-ink/90">Team Settings</h1>
          </div>

          {/* ── Team profile ── */}
          {canManage && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-ink/5">
              <h2 className="font-medium text-ink mb-5">Team profile</h2>

              <div className="flex items-center gap-4 mb-6">
                {/* Avatar preview */}
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={teamName}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {teamName[0]?.toUpperCase() ?? 'T'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-ink/50 mb-1">Team name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-papaya transition-colors"
                  />
                </div>
              </div>

              {/* Logo upload */}
              <div className="mb-6">
                <label className="block text-xs text-ink/50 mb-2">Team logo</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-2 text-sm border border-ink/15 rounded-xl hover:bg-ink/5 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading…' : avatarUrl ? 'Change logo' : 'Upload logo'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-sm text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-ink/30">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-ink/50 mb-2">Avatar color {avatarUrl ? '(used as fallback)' : ''}</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${avatarColor === c ? 'ring-2 ring-offset-2 ring-ink/40' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-ink text-white text-sm rounded-full hover:bg-ink/90 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {saveMsg && (
                  <span className={`text-sm ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}>{saveMsg}</span>
                )}
              </div>
            </section>
          )}

          {/* ── Members ── */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-ink/5">
            <h2 className="font-medium text-ink mb-5">Members</h2>
            <div className="space-y-3">
              {allDisplayMembers.map((m: any) => {
                const isMe = m.user_id === profile?.id;
                const isThisOwner = m.role === 'owner';
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <AvatarCircle name={m.profile?.name} avatar_url={m.profile?.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink leading-none truncate">
                        {m.profile?.name ?? m.profile?.email ?? 'Unknown'}
                        {isMe && <span className="ml-1.5 text-xs text-ink/40">(you)</span>}
                      </p>
                      <p className="text-xs text-ink/40 mt-0.5 truncate">{m.profile?.email}</p>
                    </div>
                    {isThisOwner ? (
                      <span className="text-xs font-medium text-ink/40 px-2 py-1 bg-ink/5 rounded-full capitalize">Owner</span>
                    ) : canManage && !isMe ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m.id, m.user_id, e.target.value)}
                          className="text-xs border border-ink/15 rounded-lg px-2 py-1 text-ink bg-transparent focus:outline-none focus:border-papaya"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-ink/40 px-2 py-1 bg-ink/5 rounded-full capitalize">{m.role}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Invite ── */}
          {canManage && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-ink/5">
              <h2 className="font-medium text-ink mb-5">Invite a member</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="Email address"
                  className="flex-1 border border-ink/15 rounded-xl px-3 py-2 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-papaya transition-colors"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="border border-ink/15 rounded-xl px-3 py-2 text-sm text-ink bg-transparent focus:outline-none focus:border-papaya"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-papaya text-white text-sm rounded-xl hover:bg-papaya/90 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
              </div>
              {inviteMsg && (
                <p className={`text-sm ${inviteMsg === 'Invitation sent!' ? 'text-green-600' : 'text-red-500'}`}>{inviteMsg}</p>
              )}

              {/* Pending invitations */}
              {data.invitations.length > 0 && (
                <div className="mt-5 pt-5 border-t border-ink/5">
                  <p className="text-xs text-ink/50 mb-3">Pending invitations</p>
                  <div className="space-y-2">
                    {data.invitations.map(inv => (
                      <div key={inv.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink truncate">{inv.email}</p>
                          <p className="text-xs text-ink/40 capitalize">{inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Danger zone ── */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
            <h2 className="font-medium text-red-500 mb-5">Danger zone</h2>
            <div className="space-y-4">
              {!isOwner && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">Leave team</p>
                    <p className="text-xs text-ink/50">You will lose access to all team boards.</p>
                  </div>
                  {showLeaveConfirm ? (
                    <div className="flex gap-2">
                      <button onClick={() => setShowLeaveConfirm(false)} className="text-sm text-ink/50 hover:text-ink px-3 py-1.5">Cancel</button>
                      <button
                        onClick={handleLeave}
                        disabled={dangerLoading}
                        className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                      >
                        {dangerLoading ? 'Leaving…' : 'Confirm leave'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowLeaveConfirm(true)} className="text-sm text-red-500 hover:text-red-600 px-3 py-1.5 border border-red-200 rounded-lg transition-colors">
                      Leave team
                    </button>
                  )}
                </div>
              )}

              {isOwner && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-ink">Delete team</p>
                      <p className="text-xs text-ink/50">Permanently delete this team. Boards will be detached but not deleted.</p>
                    </div>
                    <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="text-sm text-red-500 hover:text-red-600 px-3 py-1.5 border border-red-200 rounded-lg transition-colors">
                      Delete team
                    </button>
                  </div>
                  {showDeleteConfirm && (
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-sm text-red-600 mb-3">
                        Type <strong>{data.team.name}</strong> to confirm deletion.
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmName}
                        onChange={e => setDeleteConfirmName(e.target.value)}
                        placeholder={data.team.name}
                        className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-red-400"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }} className="text-sm text-ink/50 hover:text-ink px-3 py-1.5">Cancel</button>
                        <button
                          onClick={handleDeleteTeam}
                          disabled={dangerLoading || deleteConfirmName !== data.team.name}
                          className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          {dangerLoading ? 'Deleting…' : 'Delete permanently'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
      <BottomNav />
    </main>
  );
}
