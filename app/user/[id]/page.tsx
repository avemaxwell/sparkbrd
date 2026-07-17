"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useUser } from "@/hooks/useUser";

interface PublicProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_verified_educator: boolean;
  verified_institution_name: string | null;
}

interface PublicBoard {
  id: string;
  name: string;
  description: string | null;
  background_color: string | null;
  vibe: string | null;
}

const BOARD_GRADIENTS = [
  "from-papaya/30 to-mustard/20",
  "from-aqua/25 to-blush/20",
  "from-blush/30 to-papaya/15",
  "from-mustard/25 to-aqua/20",
];

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile: me } = useUser();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [boards, setBoards] = useState<PublicBoard[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/users/${id}`).then(r => r.json()),
      fetch(`/api/users/${id}/follow`).then(r => r.json()),
    ]).then(([userData, followData]) => {
      if (userData.profile) setProfile(userData.profile);
      if (userData.boards) setBoards(userData.boards);
      setFollowing(followData.following ?? false);
      setFollowerCount(followData.followerCount ?? 0);
      setFollowingCount(followData.followingCount ?? 0);
      setLoading(false);
    });
  }, [id]);

  const handleFollow = async () => {
    if (!me) return;
    setFollowLoading(true);
    const res = await fetch(`/api/users/${id}/follow`, { method: 'POST' });
    const data = await res.json();
    setFollowing(data.following);
    setFollowerCount(c => data.following ? c + 1 : c - 1);
    setFollowLoading(false);
  };

  const isOwnProfile = me?.id === id;

  if (loading) {
    return (
      <div className="min-h-screen bg-cork-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cork-warm flex flex-col items-center justify-center gap-4">
        <p className="text-ink/50">User not found.</p>
        <Link href="/" className="text-sm text-papaya hover:text-papaya/70">Go home</Link>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-cork-warm pb-24 lg:pb-12">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-28">
        {/* Profile card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-2xl font-semibold">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-serif text-3xl text-ink/90 mb-1">{profile.name ?? "Anonymous"}</h1>
            {profile.is_verified_educator && profile.verified_institution_name && (
              <span className="inline-block mb-3 px-2.5 py-1 bg-lime/60 text-ink text-xs font-medium rounded-full">
                🏫 {profile.verified_institution_name}
              </span>
            )}
            {profile.bio && <p className="text-ink/50 text-sm mb-4 max-w-md">{profile.bio}</p>}

            {/* Counts */}
            <div className="flex items-center justify-center sm:justify-start gap-6 text-sm mb-5">
              <div className="text-center">
                <p className="font-semibold text-ink">{boards.length}</p>
                <p className="text-ink/40 text-xs">Public collections</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-ink">{followerCount}</p>
                <p className="text-ink/40 text-xs">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-ink">{followingCount}</p>
                <p className="text-ink/40 text-xs">Following</p>
              </div>
            </div>

            {/* Follow button */}
            {!isOwnProfile && me && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  following
                    ? 'bg-ink/8 text-ink/60 hover:bg-red-50 hover:text-red-500'
                    : 'bg-ink text-white hover:bg-ink/85'
                } disabled:opacity-50`}
              >
                {followLoading ? '...' : following ? 'Following' : 'Follow'}
              </button>
            )}
            {!me && (
              <Link
                href="/login"
                className="px-6 py-2 rounded-full text-sm font-medium bg-ink text-white hover:bg-ink/85 transition-colors inline-block"
              >
                Sign in to follow
              </Link>
            )}
          </div>
        </div>

        {/* Public boards */}
        <h2 className="font-serif text-xl text-ink/80 mb-5">Public collections</h2>
        {boards.length === 0 ? (
          <p className="text-ink/40 text-sm">No public collections yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {boards.map((board, i) => {
              const gradient = BOARD_GRADIENTS[i % BOARD_GRADIENTS.length];
              return (
                <Link
                  key={board.id}
                  href={`/board/${board.id}`}
                  className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 hover:shadow-md transition-shadow group`}
                >
                  <h3 className="font-serif text-lg text-ink/90 truncate group-hover:text-papaya transition-colors">
                    {board.name}
                  </h3>
                  {board.description && (
                    <p className="text-xs text-ink/50 mt-1 line-clamp-2">{board.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
