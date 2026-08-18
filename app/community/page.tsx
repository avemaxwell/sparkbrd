"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { relativeTime } from "@/lib/relativeTime";
import {
  IconChatBubble, IconShieldCheck, IconBook, IconLaptop, IconStar, IconUsers,
  IconHeart, IconFlag, IconBrain, IconGraduationCap, IconPersonCheck,
} from "@/components/icons";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ShapeCorner = getShapeCorner("community-hub");

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  chat: IconChatBubble,
  shield: IconShieldCheck,
  book: IconBook,
  laptop: IconLaptop,
  star: IconStar,
  heart: IconHeart,
  flag: IconFlag,
  brain: IconBrain,
  cap: IconGraduationCap,
  homeschool: IconPersonCheck,
  coaches: IconUsers,
};

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  actor_name: string | null;
  actor_avatar: string | null;
  created_at: string;
  category: { slug: string; name: string } | null;
  reply_count: number;
}

export default function CommunityPage() {
  const { profile } = useUser();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/community/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  const fetchThreads = () => {
    setLoading(true);
    const url = activeCategory ? `/api/community/threads?category=${activeCategory}` : '/api/community/threads';
    fetch(url)
      .then(r => r.json())
      .then(data => setThreads(data.threads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchThreads, [activeCategory]);

  const handleStartThread = () => {
    if (!profile) {
      router.push('/signup?intent=community&redirect=/community');
      return;
    }
    setComposerOpen(true);
  };

  return (
    <main className="relative min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />
      <ShapeCorner className="absolute top-24 right-4 hidden xl:block" />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20 md:pt-36">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-blush bg-blush/10 px-3 py-1.5 rounded-full mb-4">
              <IconUsers className="w-3.5 h-3.5" />
              Community
            </span>
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-ink leading-tight">
              Where educators talk shop.
            </h1>
            <p className="text-ink/60 mt-2">Ask questions, share what worked, and learn from other teachers.</p>
          </div>
          <button
            onClick={handleStartThread}
            className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors flex-shrink-0"
          >
            Start a thread
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null ? 'bg-ink text-white' : 'bg-white text-ink/60 hover:text-ink border border-black/5'
            }`}
          >
            All
          </button>
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon] ?? IconChatBubble;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === c.slug ? 'bg-ink text-white' : 'bg-white text-ink/60 hover:text-ink border border-black/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Mobile start-thread button */}
        <button
          onClick={handleStartThread}
          className="sm:hidden w-full mb-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blush text-white text-sm font-semibold rounded-full hover:bg-blush/90 transition-colors"
        >
          Start a thread
        </button>

        {/* Thread list */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-24 bg-white/60 rounded-2xl animate-pulse" />)}
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/5 p-10 text-center">
            <p className="text-ink/60">No threads yet in this category.</p>
            <p className="text-sm text-ink/40 mt-1">Be the first to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <Link
                key={t.id}
                href={`/community/${t.id}`}
                className="block bg-white rounded-2xl border border-black/5 p-5 hover:border-black/10 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {t.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-blush">{t.category.name}</span>
                    )}
                    <h3 className="font-serif font-semibold text-ink mt-0.5 truncate">{t.title}</h3>
                    <p className="text-sm text-ink/50 mt-1 line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink/40 text-sm flex-shrink-0">
                    <IconChatBubble className="w-4 h-4" />
                    {t.reply_count}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink/5">
                  {t.actor_avatar ? (
                    <img src={t.actor_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-[10px] font-semibold">
                      {t.actor_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span className="text-xs text-ink/50">{t.actor_name ?? 'A Sparkurio educator'}</span>
                  <span className="text-xs text-ink/30">· {relativeTime(t.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {composerOpen && (
        <ThreadComposer
          categories={categories}
          onClose={() => setComposerOpen(false)}
          onCreated={(id) => router.push(`/community/${id}`)}
        />
      )}

      <BottomNav />
    </main>
  );
}

function ThreadComposer({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/community/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, title, body }),
      });
      const data = await res.json();
      if (res.ok) onCreated(data.thread.id);
      else setError(data.error ?? 'Failed to post. Please try again.');
    } catch {
      setError('Failed to post. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="font-serif text-xl text-ink mb-5">Start a thread</h3>

        {error && <div className="mb-4 p-3 bg-papaya/10 text-papaya text-sm rounded-xl">{error}</div>}

        <div className="mb-4">
          <label className="block text-xs font-medium text-ink/50 mb-1.5">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-ink/50 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            maxLength={200}
            className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
            autoFocus
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-ink/50 mb-1.5">Details</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add context — what have you tried, what are you looking for?"
            rows={5}
            maxLength={5000}
            className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 resize-none transition-all text-sm"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-blush text-white rounded-full text-sm font-semibold hover:bg-blush/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post thread'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
