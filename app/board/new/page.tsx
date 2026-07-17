"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasFeature, canCreatePrivateCollection, Plan } from "@/lib/plan-limits";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import ColorPicker from "@/components/ui/ColorPicker";

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
  const [boardKind, setBoardKind] = useState<'moodboard' | 'studio' | 'mosaic'>('moodboard');
  const [bgStyle, setBgStyle] = useState("gradient");
  const [color1, setColor1] = useState("#F0FFC2");
  const [color2, setColor2] = useState("#FFD6F2");
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
  const canUseStudio = hasFeature(plan, 'studio_boards');
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
        vibe: bgStyle,
        background_color: `${color1},${color2}`,
        owner_id: session.user.id,
        board_type: boardKind === 'mosaic' ? 'mosaic' : 'canvas',
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

    // Pre-populate Studio Board template sections
    if (boardKind === 'studio') {
      await fetch(`/api/board/${data.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: 'studio' }),
      });
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

  const getBackgroundStyle = (patternId: string, c1: string, c2: string) => {
    switch (patternId) {
      case "gradient":
        return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
      case "starburst":
        return { background: `repeating-conic-gradient(from 0deg, ${c1} 0deg 15deg, ${c2} 15deg 30deg)` };
      case "swirl":
        return { 
          background: `
            radial-gradient(ellipse at 20% 80%, ${c1} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, ${c2} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${c1} 0%, transparent 40%),
            linear-gradient(135deg, ${c1} 0%, ${c2} 100%)
          `
        };
      case "solid":
        return { backgroundColor: c1 };
      default:
        return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
    }
  };

  const bgPatterns = [
    { id: "gradient", label: "Gradient", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#grad1)"/>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD6F2"/>
            <stop offset="100%" stopColor="#DCDCFF"/>
          </linearGradient>
        </defs>
      </svg>
    )},
    { id: "starburst", label: "Starburst", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )},
    { id: "swirl", label: "Swirl", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 3c-1.5 0-3 1.5-3 3s1.5 3 3 3 3 1.5 3 3-1.5 3-3 3-3 1.5-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { id: "solid", label: "Solid", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )},
  ];

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
          {/* Board Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-ink mb-2">Collection name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Inspiration Collection"
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

          {/* Board type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-3">Collection type</label>
            <div className="grid grid-cols-3 gap-2">
              {/* Moodboard */}
              <button
                type="button"
                onClick={() => setBoardKind('moodboard')}
                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${boardKind === 'moodboard' ? 'border-papaya bg-papaya/5' : 'border-ink/10 hover:border-ink/20'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-ink/50 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <rect x="2" y="6" width="13" height="10" rx="1.5"/>
                    <rect x="9" y="3" width="13" height="10" rx="1.5" strokeOpacity="0.4"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-xs text-ink">Moodboard</p>
                  <p className="text-[10px] text-ink/40 mt-0.5 leading-tight">Freeform canvas</p>
                </div>
              </button>

              {/* Studio */}
              <button
                type="button"
                onClick={() => canUseStudio ? setBoardKind('studio') : undefined}
                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-2 relative ${
                  !canUseStudio ? 'border-ink/10 opacity-60 cursor-default' :
                  boardKind === 'studio' ? 'border-papaya bg-papaya/5' : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                {!canUseStudio && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-ink/10 text-ink/40 px-1 py-0.5 rounded-full">Plus</span>
                )}
                <div className="w-8 h-8 rounded-lg bg-papaya/10 flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-papaya stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-xs text-ink">Studio</p>
                  <p className="text-[10px] text-ink/40 mt-0.5 leading-tight">Creative briefs</p>
                </div>
              </button>

              {/* Mosaic */}
              <button
                type="button"
                onClick={() => setBoardKind('mosaic')}
                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${boardKind === 'mosaic' ? 'border-papaya bg-papaya/5' : 'border-ink/10 hover:border-ink/20'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-ink/50 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="8" height="8" rx="1"/>
                    <rect x="13" y="3" width="8" height="8" rx="1"/>
                    <rect x="3" y="13" width="8" height="8" rx="1"/>
                    <rect x="13" y="13" width="8" height="8" rx="1"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-xs text-ink">Mosaic</p>
                  <p className="text-[10px] text-ink/40 mt-0.5 leading-tight">Gallery grid</p>
                </div>
              </button>
            </div>
            {boardKind === 'studio' && (
              <p className="text-xs text-ink/50 mt-2 leading-relaxed">Drops in 5 section labels to structure your creative brief.</p>
            )}
            {boardKind === 'mosaic' && (
              <p className="text-xs text-ink/50 mt-2 leading-relaxed">Images arrange automatically in a masonry grid, newest first.</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-ink/10 my-6" />

          {/* Background Section — disabled for mosaic (always white) */}
          <div className={`mb-6 transition-opacity ${boardKind === 'mosaic' ? 'opacity-30 pointer-events-none select-none' : ''}`}>
            {boardKind === 'mosaic' && (
              <p className="text-xs text-ink/40 mb-3 italic">Background style doesn&apos;t apply to mosaic collections.</p>
            )}
            <h3 className="text-sm font-medium text-ink mb-4">Background</h3>
            
            {/* Pattern Selection */}
            <div className="mb-5">
              <p className="text-xs text-ink-soft uppercase tracking-wide mb-3">Pattern</p>
              <div className="flex gap-2">
                {bgPatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => setBgStyle(pattern.id)}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      bgStyle === pattern.id 
                        ? 'border-papaya bg-papaya/5 text-papaya' 
                        : 'border-ink/10 hover:border-ink/20 text-ink-soft hover:text-ink'
                    }`}
                  >
                    {pattern.icon}
                    <span className="text-xs font-medium">{pattern.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <p className="text-xs text-ink-soft uppercase tracking-wide mb-3">Colors</p>
              <div className="flex items-start gap-4">
                <ColorPicker 
                  color={color1} 
                  onChange={setColor1} 
                  label="Color 1"
                />
                {bgStyle !== "solid" && (
                  <ColorPicker 
                    color={color2} 
                    onChange={setColor2} 
                    label="Color 2"
                  />
                )}
                
                {/* Live Preview */}
                <div className="flex-1">
                  <p className="text-xs text-ink-soft mb-1">Preview</p>
                  <div 
                    className="w-full h-24 rounded-xl border border-ink/10 overflow-hidden"
                    style={getBackgroundStyle(bgStyle, color1, color2)}
                  />
                </div>
              </div>
            </div>
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