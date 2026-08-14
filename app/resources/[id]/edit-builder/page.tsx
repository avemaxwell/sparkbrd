"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import LessonBlockCanvas from "@/components/resources/LessonBlockCanvas";
import { EMPTY_BLOCKS_DATA, type LessonBlocksData } from "@/lib/lesson-blocks";
import Header from "@/components/layout/Header";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ShapeCorner = getShapeCorner("lesson-builder");

interface ResourceSummary {
  id: string;
  title: string;
  owner_id: string | null;
  blocks: LessonBlocksData | null;
  subject: string;
  grade_band: string;
  state: string | null;
}

// Re-editing a published block-canvas lesson plan — same LessonBlockCanvas
// as the create flow (app/resources/new/build/page.tsx), just loaded with
// the existing blocks and PATCHing back instead of POSTing new.
export default function EditBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const [resource, setResource] = useState<ResourceSummary | null>(null);
  const [blocks, setBlocks] = useState<LessonBlocksData>(EMPTY_BLOCKS_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/resources/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setResource(data.resource);
        // Spread over EMPTY_BLOCKS_DATA to backfill any field added to the
        // shape after this resource was first saved (e.g. `standards`).
        setBlocks({ ...EMPTY_BLOCKS_DATA, ...(data.resource.blocks ?? {}) });
      })
      .catch(() => setError("Couldn't load this resource."))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, standards: blocks.standards }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      router.push(`/resources/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" /></div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-ink/5">
            <h1 className="font-serif text-2xl mb-2">Sign in to edit this lesson</h1>
            <Link href={`/login?redirect=/resources/${id}/edit-builder`} className="inline-block px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!resource || resource.owner_id !== profile.id) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div>
            <h1 className="font-serif text-2xl text-ink mb-2">Can&rsquo;t edit this lesson</h1>
            <p className="text-ink-soft mb-6">{error ?? "You don't own this resource."}</p>
            <Link href={`/resources/${id}`} className="text-papaya font-medium hover:underline">Back to the resource</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-cork-warm relative overflow-hidden">
      <Header />
      <ShapeCorner className="hidden lg:block absolute top-24 right-6 pointer-events-none" />

      <div className="relative pt-24 md:pt-28 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 stroke-white stroke-[1.6] fill-none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-blush">Sparkurio Lesson Plan Builder</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Link href={`/resources/${id}`} className="text-sm text-ink/50 hover:text-ink transition-colors">Cancel</Link>
          <p className="text-xs text-ink/40 uppercase tracking-widest">Editing &ldquo;{resource.title}&rdquo;</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="font-serif font-bold text-2xl text-ink mb-2">Edit your lesson</h2>
          <p className="text-ink/50 mb-6">Add, remove, or reorder blocks, and update timing or attached resources.</p>

          <LessonBlockCanvas
            value={blocks}
            onChange={setBlocks}
            subject={resource.subject}
            gradeBand={resource.grade_band}
            state={resource.state ?? undefined}
          />

          {error && <div className="mt-6 p-3 bg-papaya/10 text-papaya text-sm rounded-xl">{error}</div>}

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-ink/5">
            <button
              onClick={save}
              disabled={saving || blocks.items.length === 0}
              className="px-7 py-3.5 bg-papaya text-white rounded-full font-semibold hover:bg-papaya/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <Link href={`/resources/${id}`} className="px-6 py-3.5 text-ink/60 font-medium hover:text-ink transition-colors">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
