"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canCreatePrivateCollection, Plan } from "@/lib/plan-limits";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

export default function NewBoardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin"/></div>}>
      <NewBoardForm />
    </Suspense>
  );
}

const LABEL_SUGGESTIONS = ["Class", "Unit", "Lesson", "Project"];

function NewBoardForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [parentBoard, setParentBoard] = useState<{ id: string; name: string; team_id: string | null; is_public: boolean } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  const parentId = searchParams.get('parent');
  const supabase = createClient();
  const { profile } = useUser();
  const plan = profile?.plan as Plan | undefined;
  const canGoPrivate = canCreatePrivateCollection(plan);
  const effectiveTeamId = teamId || parentBoard?.team_id || null;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthed(!!session);
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  // Sub-collections inherit their parent's team/visibility as defaults —
  // a copy at creation time, not live inheritance (see nesting RLS notes).
  useEffect(() => {
    if (!parentId) return;
    (async () => {
      const { data } = await supabase.from("boards").select("id, name, team_id, is_public").eq("id", parentId).single();
      if (data) { setParentBoard(data); setIsPublic(data.is_public); }
    })();
  }, [parentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("boards")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        owner_id: session.user.id,
        board_type: 'collection',
        is_public: canGoPrivate ? isPublic : true,
        kind: label.trim() || null,
        ...(parentId ? { parent_id: parentId } : {}),
        ...(effectiveTeamId ? { team_id: effectiveTeamId } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating board:", error);
      setCreating(false);
      return;
    }

    // Log to team activity feed if this is a team board
    if (effectiveTeamId) {
      fetch(`/api/teams/${effectiveTeamId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'board_created',
          board_id: data.id,
          board_name: data.name,
        }),
      }).catch(() => {});
    }

    router.push(`/board/${data.id}`);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin"/>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-ink/5">
          <div className="w-16 h-16 bg-papaya/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 stroke-papaya stroke-2 fill-none" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl mb-2">Sign in to create a collection</h1>
          <p className="text-ink-soft mb-6">You need an account to start saving your inspiration.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Subtle background */}
      <div className="fixed inset-0 opacity-40" style={{
        background: `
          radial-gradient(ellipse at 0% 0%, #FFD6F2 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, #DCDCFF 0%, transparent 50%),
          white
        `
      }} />

      <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full border border-ink/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl">{parentId ? "Create a sub-collection" : "Create a new collection"}</h1>
            {parentBoard && (
              <p className="text-xs text-ink/50 mt-1">Nested inside <span className="font-medium text-ink/70">{parentBoard.name}</span>.</p>
            )}
            {!parentId && teamId && (
              <p className="text-xs text-ink/50 mt-1">This collection will be added to your team workspace.</p>
            )}
          </div>
          <Link href="/" className="w-10 h-10 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Collection Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-ink mb-2">Collection name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 5th Grade Fractions Unit"
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
              required
            />
          </div>

          {/* Label — freeform, purely cosmetic (Class/Unit/Lesson/Project or anything) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-2">Label <span className="text-ink-soft font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {LABEL_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLabel(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${label === s ? 'bg-papaya text-white' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Class, Unit, Lesson — or your own"
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
            />
            <p className="text-[11px] text-ink/40 mt-1.5">A tag to help organize — freeform, doesn&apos;t change how the collection works.</p>
          </div>

          {/* Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-3">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${isPublic ? 'border-papaya bg-papaya/5' : 'border-ink/10 hover:border-ink/20'}`}
              >
                <p className="font-semibold text-xs text-ink">Public</p>
                <p className="text-[10px] text-ink/40 mt-0.5 leading-tight">Anyone can find and view it</p>
              </button>
              <button
                type="button"
                onClick={() => canGoPrivate ? setIsPublic(false) : undefined}
                className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                  !canGoPrivate ? 'border-ink/10 opacity-60 cursor-default' :
                  !isPublic ? 'border-papaya bg-papaya/5' : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                {!canGoPrivate && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-ink/10 text-ink/40 px-1 py-0.5 rounded-full">Plus</span>
                )}
                <p className="font-semibold text-xs text-ink">Private</p>
                <p className="text-[10px] text-ink/40 mt-0.5 leading-tight">Only you can see it</p>
              </button>
            </div>
            {!canGoPrivate && (
              <p className="text-xs text-ink/50 mt-2">
                <Link href="/settings/billing" className="text-papaya underline">Upgrade to Sparkurio Plus</Link> for unlimited private collections.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-2">Description <span className="text-ink-soft font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              rows={2}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || creating}
            className="w-full py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create collection"}
          </button>
        </form>
      </div>
    </div>
  );
}
