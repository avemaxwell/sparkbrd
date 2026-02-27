"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import Link from "next/link";
import ColorPicker from "@/components/ui/ColorPicker";

export default function NewBoardPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bgStyle, setBgStyle] = useState("gradient");
  const [color1, setColor1] = useState("#fef3e2");
  const [color2, setColor2] = useState("#fce7f3");
  const [creating, setCreating] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const { canCreateBoard, boardsRemaining, isFreePlan, planDetails } = usePlan();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthed(!!session);
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !canCreateBoard) return;

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
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating board:", error);
      setCreating(false);
      return;
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
            <stop offset="0%" stopColor="#fce7f3"/>
            <stop offset="100%" stopColor="#dbeafe"/>
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
          <h1 className="font-serif text-2xl mb-2">Sign in to create a board</h1>
          <p className="text-ink-soft mb-6">You need an account to start tacking your inspiration.</p>
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

  if (!canCreateBoard) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-ink/5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-papaya/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 stroke-papaya stroke-2 fill-none" viewBox="0 0 24 24">
                <path d="M12 9v4M12 17h.01"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <h1 className="font-serif text-2xl mb-2">You&apos;ve hit your board limit</h1>
            <p className="text-ink-soft">
              Your {planDetails.name} plan includes {planDetails.limits.max_boards} boards. 
              Upgrade to Pro for unlimited boards!
            </p>
          </div>

          <div className="bg-ink/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Pro Plan</span>
              <span className="text-papaya font-bold">$8/month</span>
            </div>
            <ul className="text-sm text-ink-soft space-y-1">
              <li>Unlimited boards</li>
              <li>200 tacks per board</li>
              <li>Custom background colors</li>
              <li>No branding on shared boards</li>
            </ul>
          </div>

          <Link
            href="/settings/billing"
            className="block w-full py-3 bg-papaya text-white rounded-full font-medium text-center hover:bg-papaya/90 transition-colors mb-3"
          >
            Upgrade to Pro
          </Link>
          
          <Link
            href="/"
            className="block w-full py-3 bg-ink/5 text-ink rounded-full font-medium text-center hover:bg-ink/10 transition-colors"
          >
            Back to home
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
          radial-gradient(ellipse at 0% 0%, #fce7f3 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, #dbeafe 0%, transparent 50%),
          white
        `
      }} />
      
      <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full border border-ink/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl">Create a new board</h1>
          <Link href="/" className="w-10 h-10 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </Link>
        </div>

        {isFreePlan && boardsRemaining <= 3 && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              <strong>{boardsRemaining}</strong> board{boardsRemaining !== 1 ? 's' : ''} remaining on your free plan.{' '}
              <Link href="/settings/billing" className="underline">Upgrade for unlimited</Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Board Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-ink mb-2">Board name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Inspiration Board"
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-2">Description <span className="text-ink-soft font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this board about?"
              rows={2}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-ink/10 my-6" />

          {/* Background Section */}
          <div className="mb-6">
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
            {creating ? "Creating..." : "Create board"}
          </button>
        </form>
      </div>
    </div>
  );
}