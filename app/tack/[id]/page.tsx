"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import RetackButton from "@/components/tacks/RetackButton";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { tackDetail, tackThumb } from "@/lib/image-transform";

interface TackData {
  id: string;
  content_url: string;
  title: string | null;
  source: string | null;
  note: string | null;
  tags: string[] | null;
  board_id: string | null;
  board: { id: string; name: string; is_public: boolean } | null;
}

interface RelatedTack {
  id: string;
  content_url: string;
  title: string | null;
  board_id: string | null;
}

export default function TackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useUser();
  const supabase = createClient();

  const [tack, setTack] = useState<TackData | null>(null);
  const [related, setRelated] = useState<RelatedTack[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("tacks")
        .select("id, content_url, title, source, note, tags, board_id, resource_id, boards(id, name, is_public)")
        .eq("id", id)
        .maybeSingle();

      // A saved resource's canonical page is /resources/[id] — it has no
      // concept of the old standalone tack view, so send it there instead.
      if (data?.resource_id) {
        router.replace(`/resources/${data.resource_id}`);
        return;
      }

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const tackData: TackData = {
        ...data,
        board: Array.isArray(data.boards) ? (data.boards[0] ?? null) : (data.boards as TackData['board'] ?? null),
      };
      setTack(tackData);

      // Fetch related tacks by tag overlap from public boards
      const tags: string[] = Array.isArray(data.tags) ? data.tags : [];
      if (tags.length > 0) {
        const { data: relatedData } = await supabase
          .from("tacks")
          .select("id, content_url, title, board_id, boards!inner(is_public)")
          .eq("boards.is_public", true)
          .not("id", "eq", id)
          .not("content_url", "ilike", "%.svg%")
          .overlaps("tags", tags)
          .limit(12);

        setRelated(relatedData ?? []);
      }

      setLoading(false);
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const boardExists = tack?.board !== null && tack?.board_id !== null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F6F6] pb-20 lg:pb-0">
        <Header />
        <div className="flex justify-center items-center pt-40">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (notFound || !tack) {
    return (
      <main className="min-h-screen bg-[#F6F6F6] pb-20 lg:pb-0">
        <Header />
        <div className="pt-32 text-center px-6">
          <p className="text-ink/40 text-sm">This resource doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="inline-block mt-4 text-sm text-papaya hover:underline">Go home</Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F6F6] pb-20 lg:pb-0">
      <Header />

      <div className="pt-24 md:pt-28 max-w-5xl mx-auto px-4 md:px-6">

        {/* Main tack */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-16">
          {/* Image */}
          <div className="flex-shrink-0 md:w-1/2 lg:w-2/5">
            <div className="relative group rounded-2xl overflow-hidden bg-ink/5 shadow-xl">
              <img
                src={tackDetail(tack.content_url)}
                alt={tack.title || ""}
                className="w-full h-auto block"
              />
              {profile && (
                <button
                  className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-red-50"
                  title="Report as AI-generated"
                  onClick={() => { setReportOpen(true); setReportMsg(null); }}
                >
                  <svg className="w-3.5 h-3.5 stroke-red-400 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-center">
            {tack.title && (
              <h1 className="font-serif text-2xl md:text-3xl text-ink mb-3 leading-snug">{tack.title}</h1>
            )}
            {tack.note && (
              <p className="text-sm text-ink/60 mb-4 leading-relaxed">{tack.note}</p>
            )}
            {tack.source && (
              <p className="text-xs text-ink/40 mb-6">Source: {tack.source}</p>
            )}

            {/* Board status */}
            {boardExists ? (
              <Link
                href={`/board/${tack.board_id}`}
                className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink transition-colors mb-6 group"
              >
                <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none flex-shrink-0" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span className="group-hover:underline underline-offset-2">{tack.board?.name}</span>
                <svg className="w-3.5 h-3.5 stroke-current stroke-[1.5] fill-none opacity-50" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm text-ink/30 mb-6">
                <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                The collection this resource was on is no longer available.
              </div>
            )}

            <RetackButton tackId={tack.id} />
          </div>
        </div>

        {/* Related tacks */}
        {related.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-xl text-ink mb-6">
              {boardExists ? "More like this" : "You might also like…"}
            </h2>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-x-2">
              {related.map(r => (
                <div key={r.id} className="group relative break-inside-avoid mb-2">
                  <Link href={`/tack/${r.id}`} className="block relative">
                    <img
                      src={tackThumb(r.content_url)}
                      alt={r.title || ""}
                      className="w-full h-auto block rounded-lg max-h-[400px] object-cover object-top"
                      loading="lazy"
                      onError={e => {
                        const el = e.currentTarget.parentElement?.parentElement as HTMLElement | null;
                        if (el) el.style.display = "none";
                      }}
                    />
                  </Link>
                  <RetackButton tackId={r.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setReportOpen(false); setReportMsg(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-serif text-xl mb-2">Report this image?</h3>
            <p className="text-sm text-ink/60 mb-5">Flag this image if you believe it was generated by an AI tool. It will be reviewed by our team.</p>
            {reportMsg && <p className="text-sm text-ink/70 mb-4 p-3 bg-ink/5 rounded-xl">{reportMsg}</p>}
            {!reportMsg && (
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setReporting(true);
                    const res = await fetch(`/api/tacks/${tack.id}/report-ai`, { method: 'POST' });
                    const d = await res.json();
                    setReporting(false);
                    if (res.status === 429) setReportMsg("You've reached the daily flag limit.");
                    else if (d.alreadyReported) setReportMsg("You've already flagged this image.");
                    else if (d.hidden) setReportMsg("This image has been removed. Thanks!");
                    else if (d.flagged) setReportMsg("Reported — our team will take a look. Thanks!");
                    else setReportMsg(d.error ?? "Something went wrong. Please try again.");
                  }}
                  disabled={reporting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {reporting ? 'Reporting…' : 'Yes, report it'}
                </button>
                <button onClick={() => { setReportOpen(false); setReportMsg(null); }} className="flex-1 px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">Cancel</button>
              </div>
            )}
            {reportMsg && <button onClick={() => { setReportOpen(false); setReportMsg(null); }} className="w-full px-4 py-2.5 bg-ink/5 rounded-full text-sm font-medium hover:bg-ink/10 transition-colors">Close</button>}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
