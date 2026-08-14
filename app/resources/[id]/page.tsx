"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { getSubject, slugify } from "@/lib/subjects";
import { IconDownload, IconFlag, IconWrench, IconBook, IconShieldCheck, IconCamera, IconTestTube, IconClock, IconLock, IconChevronDown } from "@/components/icons";
import RetackButton from "@/components/tacks/RetackButton";
import ResourceComments from "@/components/resources/ResourceComments";
import { DEFAULT_SECTION_ORDER, SECTION_LABELS } from "@/components/resources/SectionOrderPicker";
import { useUser } from "@/hooks/useUser";
import FileUploadList from "@/components/resources/FileUploadList";
import PdfEmbed from "@/components/resources/PdfEmbed";
import StandardsPicker from "@/components/resources/StandardsPicker";
import FormattedBody from "@/components/resources/FormattedBody";
import MarkdownEditor from "@/components/resources/MarkdownEditor";
import type { LessonBlocksData } from "@/lib/lesson-blocks";
import LessonBlocksView from "@/components/resources/LessonBlocksView";

interface ResourceRecord {
  id: string;
  title: string;
  subject: string;
  grade_band: string;
  resource_type: string;
  state: string | null;
  duration: string | null;
  standards: string[];
  materials: string[];
  learning_targets: string[];
  directions: string[];
  body: string | null;
  blocks: LessonBlocksData | null;
  photos: string[];
  attachments: { name: string; url: string }[];
  section_order: string[] | null;
  status: string;
  created_at: string;
  is_starter: boolean;
  classroom_proven: boolean;
  upvotes: number;
  downvotes: number;
  netScore: number;
  myVote: 1 | -1 | null;
  price_cents: number | null;
  purchased: boolean;
  owner_id: string | null;
  owner: { name: string | null; avatar_url: string | null; is_official?: boolean; is_founding_educator?: boolean } | null;
}

// Attachments from the "upload a lesson plan" flow are stored with a
// generic display name ("Original Lesson Plan"), not the real filename —
// the URL/storage path is the only reliable place the .pdf extension survives.
const isPdf = (attachment: { name: string; url: string }) =>
  attachment.name.toLowerCase().endsWith(".pdf") || attachment.url.toLowerCase().split("?")[0].endsWith(".pdf");

const SECTION_ICONS: Record<string, typeof IconFlag> = {
  learning_targets: IconFlag,
  materials: IconWrench,
  directions: IconBook,
  body: IconBook,
  standards: IconShieldCheck,
  photos: IconCamera,
  attachments: IconDownload,
};

function SectionHeading({ sectionKey }: { sectionKey: string }) {
  const Icon = SECTION_ICONS[sectionKey];
  return (
    <h2 className="font-serif font-bold text-xl text-ink mb-4 flex items-center gap-2.5">
      {Icon && (
        <span className="w-8 h-8 rounded-full bg-papaya/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 stroke-papaya" />
        </span>
      )}
      {SECTION_LABELS[sectionKey] ?? sectionKey}
    </h2>
  );
}

function ResourcePageContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { profile } = useUser();
  const [resource, setResource] = useState<ResourceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [savingAttachments, setSavingAttachments] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [savingStandards, setSavingStandards] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyDraft, setBodyDraft] = useState("");
  const [savingBody, setSavingBody] = useState(false);

  const loadResource = () => {
    fetch(`/api/resources/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setResource(data.resource))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResource();
    // Just back from Stripe Checkout — the webhook that records the purchase
    // can lag the redirect slightly, so re-check once after a short delay
    // instead of leaving the buyer stuck looking at a stale "Buy" button.
    if (searchParams.get("purchase") === "success") {
      const timer = setTimeout(loadResource, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const buyResource = async () => {
    setBuying(true);
    setBuyError(null);
    try {
      const res = await fetch(`/api/resources/${id}/purchase`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setBuyError(data.error ?? "Something went wrong."); setBuying(false); return; }
      window.location.href = data.url;
    } catch {
      setBuyError("Something went wrong. Please try again.");
      setBuying(false);
    }
  };

  const castVote = async (vote: 1 | -1) => {
    if (!profile) { window.location.href = `/login?redirect=/resources/${id}`; return; }
    try {
      const res = await fetch(`/api/resources/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setResource((prev) => prev ? {
        ...prev,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        netScore: data.netScore,
        myVote: data.myVote,
        status: data.status,
        classroom_proven: data.classroom_proven,
      } : prev);
    } catch {
      // Non-fatal — leave the vote UI as-is, user can retry.
    }
  };

  const saveAttachments = async (attachments: { name: string; url: string }[]) => {
    setSavingAttachments(true);
    setResource((prev) => (prev ? { ...prev, attachments } : prev));
    try {
      await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments }),
      });
    } finally {
      setSavingAttachments(false);
    }
  };

  // Gives a PDF-only resource a real cover image (instead of the generic
  // placeholder "Save to collection" falls back to) — never overwrites a
  // photo the teacher actually uploaded.
  const savePhotoThumbnail = async (thumbnail: { name: string; url: string }) => {
    if (!resource || resource.photos.length > 0) return;
    const photos = [thumbnail.url];
    setResource((prev) => (prev ? { ...prev, photos } : prev));
    await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    });
  };

  // Photos and standards are skippable at creation time (the minimal upload
  // flow at /resources/new doesn't ask for them at all) — the owner adds
  // them here instead, same pattern as saveAttachments above.
  const savePhotos = async (photos: string[]) => {
    setSavingPhotos(true);
    setResource((prev) => (prev ? { ...prev, photos } : prev));
    try {
      await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
      });
    } finally {
      setSavingPhotos(false);
    }
  };

  const saveBody = async () => {
    if (!bodyDraft.trim()) return;
    setSavingBody(true);
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: bodyDraft.trim() }),
      });
      if (res.ok) {
        setResource((prev) => (prev ? { ...prev, body: bodyDraft.trim() } : prev));
        setEditingBody(false);
      }
    } finally {
      setSavingBody(false);
    }
  };

  const saveStandards = async (standards: string[]) => {
    setSavingStandards(true);
    setResource((prev) => (prev ? { ...prev, standards } : prev));
    try {
      await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standards }),
      });
    } finally {
      setSavingStandards(false);
    }
  };

  const downloadAttachment = async (path: string, name: string) => {
    setDownloadingPath(path);
    try {
      const res = await fetch(`/api/resources/${id}/download?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Couldn't download this file."); return; }
      const a = document.createElement("a");
      a.href = data.url;
      a.download = name;
      a.click();
    } catch {
      alert("Couldn't download this file. Please try again.");
    } finally {
      setDownloadingPath(null);
    }
  };

  // A resource whose content lives in an attached PDF (any Worksheet) has
  // almost nothing to show on the page itself — printing "the page" would
  // print a near-blank sheet. Print the actual file instead whenever one is
  // accessible; only fall back to the page for resources that genuinely
  // hold their content in-page (materials/learning targets/directions).
  const printResource = async () => {
    if (!resource) return;
    const attachment = resource.attachments.find((a) => a.url);
    if (!attachment) { window.print(); return; }

    const isPaid = !!resource.price_cents && resource.price_cents > 0;
    let fileUrl = attachment.url;

    setPrinting(true);
    try {
      if (isPaid) {
        const res = await fetch(`/api/resources/${id}/download?path=${encodeURIComponent(attachment.url)}`);
        const data = await res.json();
        if (!res.ok) { alert(data.error ?? "Couldn't print this file."); return; }
        fileUrl = data.url;
      }

      // The attachment is served from a different origin (Supabase Storage),
      // and contentWindow.print() on a cross-origin iframe throws a
      // SecurityError — fetch it as a blob and print from a same-origin
      // blob: URL instead.
      const fileRes = await fetch(fileUrl);
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = blobUrl;

      const cleanup = () => { iframe.remove(); URL.revokeObjectURL(blobUrl); };
      const fallbackTimer = setTimeout(cleanup, 60000);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        iframe.contentWindow?.addEventListener("afterprint", () => { clearTimeout(fallbackTimer); cleanup(); });
      };
      document.body.appendChild(iframe);
    } catch {
      alert("Couldn't print this file. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  if (notFound) {
    return (
      <main className="min-h-screen bg-cork-warm flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-serif text-2xl text-ink mb-2">Resource not found</h1>
          <Link href="/explore" className="text-papaya font-medium hover:underline">Back to Discover</Link>
        </div>
      </main>
    );
  }

  const subject = resource ? getSubject(slugify(resource.subject)) : null;
  const bg = subject?.color ?? "#B9AEFF";
  const textOn = subject?.textOn === "white" ? "text-white" : "text-ink";
  const order = resource?.section_order && resource.section_order.length > 0 ? resource.section_order : DEFAULT_SECTION_ORDER;
  const isOwner = !!profile && !!resource && profile.id === resource.owner_id;
  const blocksData = resource?.blocks?.items && resource.blocks.items.length > 0 ? resource.blocks : null;

  const renderSection = (key: string) => {
    if (!resource) return null;
    const isOwner = !!profile && profile.id === resource.owner_id;
    switch (key) {
      case "photos": {
        if (resource.photos.length === 0 && !isOwner) return null;
        if (isOwner) {
          return (
            <section key={key}>
              <div className="flex items-center justify-between mb-4">
                <SectionHeading sectionKey={key} />
                {savingPhotos && <span className="text-xs text-ink/40">Saving…</span>}
              </div>
              <FileUploadList
                bucket="resource-photos"
                files={resource.photos.map((url) => ({ name: "Photo", url }))}
                onChange={(files) => savePhotos(files.map((f) => f.url))}
                accept="image/*"
                label="Click to upload photos"
              />
            </section>
          );
        }
        return (
          <section key={key}>
            <SectionHeading sectionKey={key} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {resource.photos.map((url, i) => (
                <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-2xl" />
              ))}
            </div>
          </section>
        );
      }

      case "learning_targets":
        return resource.learning_targets.length > 0 ? (
          <section key={key}>
            <SectionHeading sectionKey={key} />
            <ul className="space-y-2">
              {resource.learning_targets.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 stroke-papaya stroke-2 fill-none flex-shrink-0 mt-0.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-ink/70">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null;

      case "materials":
        return resource.materials.length > 0 ? (
          <section key={key}>
            <SectionHeading sectionKey={key} />
            <ul className="flex flex-wrap gap-2">
              {resource.materials.map((m, i) => (
                <li key={i} className="px-3.5 py-1.5 bg-white border border-black/5 rounded-full text-sm text-ink/70">{m}</li>
              ))}
            </ul>
          </section>
        ) : null;

      case "directions":
        return resource.directions.length > 0 ? (
          <section key={key}>
            <SectionHeading sectionKey={key} />
            <ol className="space-y-3">
              {resource.directions.map((d, i) => (
                <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-black/5">
                  <span className="w-7 h-7 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-ink/70 pt-0.5">{d}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null;

      case "body": {
        if (!resource.body) return null;
        return (
          <section key={key}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading sectionKey={key} />
              {isOwner && !editingBody && (
                <button
                  onClick={() => { setBodyDraft(resource.body ?? ""); setEditingBody(true); }}
                  className="text-xs text-ink/40 hover:text-ink transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-black/5">
              {editingBody ? (
                <div>
                  <MarkdownEditor value={bodyDraft} onChange={setBodyDraft} rows={16} autoFocus />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={saveBody}
                      disabled={savingBody || !bodyDraft.trim()}
                      className="px-4 py-2 bg-papaya text-white rounded-full text-xs font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
                    >
                      {savingBody ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingBody(false)}
                      className="text-xs text-ink/40 hover:text-ink transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <FormattedBody text={resource.body} />
              )}
            </div>
          </section>
        );
      }

      case "standards": {
        if (resource.standards.length === 0 && !isOwner) return null;
        if (isOwner) {
          return (
            <section key={key}>
              <div className="flex items-center justify-between mb-4">
                <SectionHeading sectionKey={key} />
                {savingStandards && <span className="text-xs text-ink/40">Saving…</span>}
              </div>
              <StandardsPicker items={resource.standards} onChange={saveStandards} subject={resource.subject} gradeBand={resource.grade_band} />
            </section>
          );
        }
        return (
          <section key={key}>
            <SectionHeading sectionKey={key} />
            <ul className="flex flex-wrap gap-2">
              {resource.standards.map((s, i) => (
                <li key={i} className="px-3.5 py-1.5 bg-ink/5 rounded-full text-xs font-medium text-ink/60">{s}</li>
              ))}
            </ul>
          </section>
        );
      }

      case "attachments": {
        if (resource.attachments.length === 0 && !isOwner) return null;
        const isPaid = !!resource.price_cents && resource.price_cents > 0;
        const locked = isPaid && !resource.purchased && !isOwner;

        // Free attachments are already public URLs; paid ones store a raw
        // storage path and need a short-lived signed URL (same endpoint
        // downloadAttachment/printResource already use).
        const resolveAttachmentSrc = async (url: string) => {
          if (!isPaid) return url;
          const res = await fetch(`/api/resources/${id}/download?path=${encodeURIComponent(url)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Couldn't load file");
          return data.url as string;
        };

        if (isOwner) {
          const pdfAttachments = resource.attachments.filter(isPdf);
          return (
            <section key={key}>
              <div className="flex items-center justify-between mb-4">
                <SectionHeading sectionKey={key} />
                {savingAttachments && <span className="text-xs text-ink/40">Saving…</span>}
              </div>
              <p className="text-xs text-ink/40 mb-3 -mt-2">
                Accompanying files for this lesson — worksheets, organizers, rubrics, and the like.
              </p>
              {pdfAttachments.length > 0 && (
                <div className="space-y-4 mb-4">
                  {pdfAttachments.map((a, i) => (
                    <PdfEmbed key={i} name={a.name} resolveSrc={() => resolveAttachmentSrc(a.url)} />
                  ))}
                </div>
              )}
              <FileUploadList
                bucket={isPaid ? "resource-attachments-paid" : "resource-attachments"}
                files={resource.attachments}
                onChange={saveAttachments}
                onThumbnail={savePhotoThumbnail}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                label="Click to upload files"
              />
            </section>
          );
        }

        return (
          <section key={key}>
            <SectionHeading sectionKey={key} />
            <ul className="space-y-2">
              {resource.attachments.map((a, i) => (
                <li key={i}>
                  {locked ? (
                    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-black/5">
                      <IconLock className="w-4 h-4 text-ink/30 flex-shrink-0" />
                      <span className="text-sm text-ink/50 truncate">{a.name}</span>
                    </div>
                  ) : isPdf(a) ? (
                    <PdfEmbed name={a.name} resolveSrc={() => resolveAttachmentSrc(a.url)} />
                  ) : isPaid ? (
                    <button
                      type="button"
                      onClick={() => downloadAttachment(a.url, a.name)}
                      disabled={downloadingPath === a.url}
                      className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border border-black/5 hover:border-black/10 transition-colors disabled:opacity-50 text-left"
                    >
                      <IconDownload className="w-4 h-4 text-papaya flex-shrink-0" />
                      <span className="text-sm text-ink/80 truncate">{downloadingPath === a.url ? "Preparing download…" : a.name}</span>
                    </button>
                  ) : (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-black/5 hover:border-black/10 transition-colors"
                    >
                      <IconDownload className="w-4 h-4 text-papaya flex-shrink-0" />
                      <span className="text-sm text-ink/80 truncate">{a.name}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
            {locked && (
              <div className="mt-4 bg-papaya/5 border border-papaya/15 rounded-2xl p-5 text-center">
                <p className="text-sm text-ink/70 mb-3">
                  Unlock the file{resource.attachments.length !== 1 ? "s" : ""} above for ${((resource.price_cents ?? 0) / 100).toFixed(2)}.
                </p>
                {buyError && <p className="text-xs text-papaya mb-3">{buyError}</p>}
                {profile ? (
                  <button
                    onClick={buyResource}
                    disabled={buying}
                    className="px-6 py-3 bg-papaya text-white rounded-full font-semibold hover:bg-papaya/90 transition-colors disabled:opacity-50"
                  >
                    {buying ? "Redirecting…" : `Buy for $${((resource.price_cents ?? 0) / 100).toFixed(2)}`}
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=/resources/${id}`}
                    className="inline-block px-6 py-3 bg-papaya text-white rounded-full font-semibold hover:bg-papaya/90 transition-colors"
                  >
                    Sign in to buy
                  </Link>
                )}
              </div>
            )}
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-cork-warm pb-20 lg:pb-0 print:pb-0">
      <style>{`
        @media print {
          header, nav, #resource-feedback { display: none !important; }
          main { background: white !important; }
          a[href]:after { content: none !important; }
        }
      `}</style>

      <div className="print:hidden"><Header /></div>

      {loading || !resource ? (
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-20 md:pt-36">
          <div className="h-48 bg-white/60 rounded-3xl animate-pulse mb-6" />
          <div className="h-32 bg-white/60 rounded-3xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="relative pt-20 print:pt-0 overflow-hidden print:!bg-white" style={{ backgroundColor: bg }}>
            <img
              src="/shapes/quatrefoil-white.png"
              alt=""
              className="absolute -top-8 -right-8 w-56 h-56 opacity-20 pointer-events-none print:hidden"
              draggable={false}
            />
            <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-14 print:py-4">
              <div className="flex flex-wrap items-center gap-2 mb-5 print:mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 print:!bg-ink/5 print:!text-ink ${textOn}`}>{resource.resource_type}</span>
                <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 print:!bg-ink/5 print:!text-ink ${textOn}`}>{resource.subject}</span>
                <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 print:!bg-ink/5 print:!text-ink ${textOn}`}>{resource.grade_band}</span>
                {resource.state && (
                  <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 print:!bg-ink/5 print:!text-ink ${textOn}`}>{resource.state}</span>
                )}
                {resource.duration && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-black/10 print:!bg-ink/5 print:!text-ink ${textOn}`}>
                    <IconClock className="w-3 h-3" />
                    {resource.duration}
                  </span>
                )}
                {!!resource.price_cents && resource.price_cents > 0 && (
                  <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-lime text-ink print:!bg-transparent print:!text-ink print:border print:border-ink/20">
                    ${(resource.price_cents / 100).toFixed(2)}
                  </span>
                )}
                {!resource.classroom_proven && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-ink/70 text-white print:!bg-transparent print:!text-ink print:border print:border-ink/20">
                    <IconTestTube className="w-3 h-3" />
                    Sparkurio Labs — untested
                  </span>
                )}
                {!resource.classroom_proven && (
                  <div className="flex items-center gap-1 bg-black/10 rounded-full print:hidden">
                    <button
                      type="button"
                      aria-label="Upvote"
                      onClick={() => castVote(1)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${resource.myVote === 1 ? "bg-lime text-ink" : `${textOn} hover:bg-black/10`}`}
                    >
                      <IconChevronDown className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <span className={`text-xs font-semibold min-w-[1.5em] text-center ${textOn}`}>{resource.netScore}</span>
                    <button
                      type="button"
                      aria-label="Downvote"
                      onClick={() => castVote(-1)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${resource.myVote === -1 ? "bg-lime text-ink" : `${textOn} hover:bg-black/10`}`}
                    >
                      <IconChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {!resource.is_starter && resource.owner?.is_official && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-ink/70 text-white print:!bg-transparent print:!text-ink print:border print:border-ink/20">
                    <IconShieldCheck className="w-3 h-3" />
                    Sparkurio Official
                  </span>
                )}
              </div>
              {/* Print-only masthead — the colored hero + white/light text combo
                  above is designed for screen; background color/images are
                  stripped by most browsers' print output (often off by
                  default even when "background graphics" exists as an
                  option), so print gets its own always-legible, ink-light header. */}
              <p className="hidden print:block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">Sparkurio</p>
              <h1 className={`font-serif font-bold text-3xl md:text-5xl leading-tight mb-6 print:!text-ink print:mb-3 ${textOn}`}>{resource.title}</h1>
              <div className="flex items-center justify-between flex-wrap gap-4">
                {resource.is_starter ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 print:hidden">
                      <IconTestTube className={`w-4 h-4 ${textOn}`} />
                    </div>
                    <div>
                      <p className={`text-sm opacity-80 print:!text-ink/60 print:!opacity-100 ${textOn}`}>Sparkurio Starter Library</p>
                      <p className={`text-xs opacity-60 print:!text-ink/40 ${textOn}`}>Not yet classroom-tested</p>
                    </div>
                  </div>
                ) : resource.owner?.is_official ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 print:hidden">
                      <IconShieldCheck className={`w-4 h-4 ${textOn}`} />
                    </div>
                    <div>
                      <p className={`text-sm opacity-80 print:!text-ink/60 print:!opacity-100 ${textOn}`}>Sparkurio</p>
                      <p className={`text-xs opacity-60 print:!text-ink/40 ${textOn}`}>Official Sparkurio resource</p>
                    </div>
                  </div>
                ) : resource.owner && (
                  <div className="flex items-center gap-2.5">
                    {resource.owner.avatar_url ? (
                      <img src={resource.owner.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover print:hidden" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs font-semibold flex-shrink-0 print:hidden">
                        {resource.owner.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <span className={`text-sm opacity-80 print:!text-ink/60 print:!opacity-100 flex items-center gap-1.5 ${textOn}`}>
                      <span>{resource.owner.name ?? "A Sparkurio educator"}</span>
                      {resource.owner.is_founding_educator && (
                        <img src="/icon.png" alt="" title="Founding Educator" className="w-4 h-4 flex-shrink-0 print:hidden" />
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={printResource}
                    disabled={printing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 text-ink rounded-full text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {printing ? (
                      <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
                        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                      </svg>
                    )}
                    {printing ? "Preparing…" : "Print"}
                  </button>
                  <RetackButton resourceId={resource.id} standalone />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-12 print:py-4 space-y-10 print:space-y-5">
            {blocksData ? (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif font-bold text-xl text-ink flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-papaya/10 flex items-center justify-center flex-shrink-0">
                        <IconBook className="w-4 h-4 stroke-papaya" />
                      </span>
                      Lesson Plan
                    </h2>
                    {isOwner && (
                      <Link
                        href={`/resources/${resource.id}/edit-builder`}
                        className="text-xs text-ink/40 hover:text-ink transition-colors print:hidden"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  <LessonBlocksView data={blocksData} />
                </section>
                {renderSection("standards")}
              </>
            ) : (
              order.map(renderSection)
            )}

            <div id="resource-feedback" className="print:hidden">
              <ResourceComments resourceId={resource.id} />
            </div>
          </div>
        </>
      )}

      <div className="print:hidden"><BottomNav /></div>
    </main>
  );
}

export default function ResourcePage() {
  return (
    <Suspense>
      <ResourcePageContent />
    </Suspense>
  );
}
