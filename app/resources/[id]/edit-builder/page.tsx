"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import LessonBlockCanvas from "@/components/resources/LessonBlockCanvas";
import { EMPTY_BLOCKS_DATA, type LessonBlocksData } from "@/lib/lesson-blocks";

interface ResourceSummary {
  id: string;
  title: string;
  owner_id: string | null;
  blocks: LessonBlocksData | null;
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
        setBlocks(data.resource.blocks ?? EMPTY_BLOCKS_DATA);
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
        body: JSON.stringify({ blocks }),
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
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-ink/5">
          <h1 className="font-serif text-2xl mb-2">Sign in to edit this lesson</h1>
          <Link href={`/login?redirect=/resources/${id}/edit-builder`} className="inline-block px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!resource || resource.owner_id !== profile.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <h1 className="font-serif text-2xl text-ink mb-2">Can&rsquo;t edit this lesson</h1>
          <p className="text-ink-soft mb-6">{error ?? "You don't own this resource."}</p>
          <Link href={`/resources/${id}`} className="text-papaya font-medium hover:underline">Back to the resource</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cork-warm py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/resources/${id}`} className="text-sm text-ink/50 hover:text-ink transition-colors">Cancel</Link>
          <p className="text-xs text-ink/40 uppercase tracking-widest">Editing &ldquo;{resource.title}&rdquo;</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <h2 className="font-serif font-bold text-2xl text-ink mb-2">Edit your lesson</h2>
          <p className="text-ink/50 mb-6">Add, remove, or reorder blocks, and update timing or attached resources.</p>

          <LessonBlockCanvas value={blocks} onChange={setBlocks} />

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
