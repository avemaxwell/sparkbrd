"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-cork-warm border-t border-ink/5 px-2 pb-[env(safe-area-inset-bottom)] flex justify-around z-50 lg:hidden">
      <NavItem href="/"        icon="home"    label="Home"    active={pathname === "/"} />
      <NavItem href="/explore" icon="explore" label="Explore" active={pathname === "/explore"} />
      <NavItem href="/boards"  icon="boards"  label="Boards"  active={pathname === "/boards"} />
      <NavItem href="/search"  icon="search"  label="Search"  active={pathname === "/search"} />
      <NavItem href="/profile" icon="profile" label="Profile" active={pathname === "/profile" || pathname === "/settings"} />
    </nav>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    home:    <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    search:  <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    explore: <><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></>,
    boards:  <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    profile: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  };

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${active ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
    >
      <svg className={`w-6 h-6 fill-none stroke-current ${active ? 'stroke-[2]' : 'stroke-[1.5]'}`} viewBox="0 0 24 24">
        {icons[icon]}
      </svg>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
