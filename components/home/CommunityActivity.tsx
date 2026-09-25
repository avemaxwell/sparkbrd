"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { relativeTime } from "@/lib/relativeTime";

interface Thread {
  id: string;
  title: string;
  actor_name: string | null;
  actor_avatar: string | null;
  created_at: string;
  category: { slug: string; name: string } | null;
}

// Real recent community threads — replaces a fully hardcoded fake activity
// feed (fictional names, timestamps that never moved) that was live on the
// homepage. Hides itself if the community has no threads yet rather than
// showing anything invented.
export default function CommunityActivity() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    fetch("/api/community/threads")
      .then((r) => r.json())
      .then((data) => setThreads((data.threads ?? []).slice(0, 5)))
      .catch(() => {});
  }, []);

  if (threads.length === 0) return null;

  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">The community, right now</h2>
          <p className="text-ink/50 mt-2">Educators sharing, testing, and improving lessons together.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-black/5 divide-y divide-ink/5">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/community/${t.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-ink/[0.02] transition-colors"
            >
              {t.actor_avatar ? (
                <img src={t.actor_avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blush to-papaya flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {t.actor_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <p className="text-sm text-ink/80 flex-1 truncate">
                <span className="font-medium text-ink">{t.actor_name ?? "A Sparkurio educator"}</span>{" "}
                {t.category ? `posted in ${t.category.name}: ` : "posted: "}
                <span className="text-ink/60">{t.title}</span>
              </p>
              <span className="text-xs text-ink/35 flex-shrink-0">{relativeTime(t.created_at)}</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/community" className="text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
            Join the conversation →
          </Link>
        </div>
      </div>
    </section>
  );
}
