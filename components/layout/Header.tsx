"use client";

import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { profile, loading, signOut } = useUser();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/explore');
  };

  const initials = profile?.name
    ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
        scrolled ? 'bg-[#FDFCFB]/90 backdrop-blur-md shadow-sm' : ''
      } ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl sm:text-3xl md:text-4xl tracking-tight leading-none flex-shrink-0">
          <span className="italic">Spark</span><span className="text-papaya">urio</span>
        </Link>

        {/* Search — desktop only, grows to fill center */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="flex items-center gap-2 w-full px-4 py-2 bg-ink/[0.06] hover:bg-ink/[0.09] rounded-full focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/10 transition-all cursor-text">
            <svg className="w-4 h-4 stroke-ink/40 stroke-[1.5] fill-none flex-shrink-0" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or explore…"
              className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink/30 min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-4 h-4 rounded-full bg-ink/10 flex items-center justify-center hover:bg-ink/20 transition-colors flex-shrink-0"
              >
                <svg className="w-2.5 h-2.5 stroke-ink/50 stroke-[2] fill-none" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search icon */}
          <button
            onClick={() => router.push('/explore')}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-ink/5 transition-colors"
            aria-label="Search"
          >
            <svg className="w-5 h-5 stroke-ink/60 stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {loading ? (
            <div className="w-10 h-10 rounded-full bg-ink/5 animate-pulse" />
          ) : profile ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full overflow-hidden transition-transform hover:scale-105"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-sm font-semibold">
                    {initials}
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-ink/5 z-50 overflow-hidden">
                    <div className="p-4 border-b border-ink/5">
                      <p className="font-medium text-ink">{profile.name}</p>
                      <p className="text-sm text-ink/50">{profile.email}</p>
                      <div className="mt-2 inline-block px-2 py-0.5 bg-ink/5 rounded-full">
                        <p className="text-xs text-ink/60 capitalize">{profile.plan} plan</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/boards"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink/70 hover:bg-ink/5 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                        </svg>
                        Your boards
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink/70 hover:bg-ink/5 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={() => { setDropdownOpen(false); setInviteOpen(true); setInviteSent(false); setInviteEmails(''); setInviteError(null); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-ink/70 hover:bg-ink/5 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
                          <path d="M14 2a4 4 0 0 1 4 4"/><path d="M14 6h4V2"/>
                        </svg>
                        Invite a friend
                      </button>
                    </div>
                    <div className="p-2 border-t border-ink/5">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-papaya hover:bg-papaya/5 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign out
                      </button>
                    </div>
                    <div className="px-4 pb-3 flex gap-3">
                      <Link
                        href="/terms"
                        onClick={() => setDropdownOpen(false)}
                        className="text-[11px] text-ink/30 hover:text-ink/50 transition-colors"
                      >
                        Terms
                      </Link>
                      <Link
                        href="/privacy"
                        onClick={() => setDropdownOpen(false)}
                        className="text-[11px] text-ink/30 hover:text-ink/50 transition-colors"
                      >
                        Privacy
                      </Link>
                      <Link
                        href="/ai-policy"
                        onClick={() => setDropdownOpen(false)}
                        className="text-[11px] text-ink/30 hover:text-ink/50 transition-colors"
                      >
                        AI Policy
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink/90 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            {inviteSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 stroke-green-600 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="font-serif text-xl text-ink mb-1">Invite sent!</p>
                <p className="text-sm text-ink/50 mb-5">Your friend should receive it shortly.</p>
                <button onClick={() => setInviteOpen(false)} className="px-5 py-2 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl mb-1">Invite a friend</h3>
                <p className="text-sm text-ink/50 mb-5">We&apos;ll send them a note letting them know you love Sparkurio.</p>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-ink/50 mb-1.5">
                    Friend&apos;s email <span className="font-normal text-ink/30">(separate multiple with commas)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm placeholder:text-ink/30"
                    autoFocus
                  />
                </div>
                {inviteError && <p className="text-xs text-red-500 mb-3">{inviteError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
                      if (!emails.length) { setInviteError('Please enter at least one email address.'); return; }
                      setInviteSending(true);
                      setInviteError(null);
                      const res = await fetch('/api/invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emails, senderName: profile?.name }),
                      });
                      setInviteSending(false);
                      if (res.ok) { setInviteSent(true); }
                      else { setInviteError('Something went wrong. Please try again.'); }
                    }}
                    disabled={inviteSending || !inviteEmails.trim()}
                    className="flex-1 py-2.5 bg-papaya text-white rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
                  >
                    {inviteSending ? 'Sending…' : 'Send invite'}
                  </button>
                  <button
                    onClick={() => setInviteOpen(false)}
                    className="flex-1 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
