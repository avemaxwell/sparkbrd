"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { getSubject, slugify } from "@/lib/subjects";
import { IconDownload } from "@/components/icons";

interface ResourceRecord {
  id: string;
  title: string;
  subject: string;
  grade_band: string;
  resource_type: string;
  standards: string[];
  materials: string[];
  learning_targets: string[];
  directions: string[];
  photos: string[];
  attachments: { name: string; url: string }[];
  status: string;
  created_at: string;
  owner: { name: string | null; avatar_url: string | null } | null;
}

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<ResourceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/resources/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setResource(data.resource))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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

  return (
    <main className="min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />

      {loading || !resource ? (
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-20 md:pt-36">
          <div className="h-48 bg-white/60 rounded-3xl animate-pulse mb-6" />
          <div className="h-32 bg-white/60 rounded-3xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="pt-20" style={{ backgroundColor: bg }}>
            <div className="max-w-3xl mx-auto px-6 pt-16 pb-14">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 ${textOn}`}>{resource.resource_type}</span>
                <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 ${textOn}`}>{resource.subject}</span>
                <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-black/10 ${textOn}`}>{resource.grade_band}</span>
              </div>
              <h1 className={`font-serif font-bold text-3xl md:text-5xl leading-tight mb-6 ${textOn}`}>{resource.title}</h1>
              {resource.owner && (
                <div className="flex items-center gap-2.5">
                  {resource.owner.avatar_url ? (
                    <img src={resource.owner.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {resource.owner.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className={`text-sm ${textOn} opacity-80`}>{resource.owner.name ?? "A Sparkurio educator"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
            {resource.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {resource.photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-2xl" />
                ))}
              </div>
            )}

            {resource.learning_targets.length > 0 && (
              <section>
                <h2 className="font-serif font-bold text-xl text-ink mb-4">Learning targets</h2>
                <ul className="space-y-2">
                  {resource.learning_targets.map((t, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 stroke-papaya stroke-2 fill-none flex-shrink-0 mt-0.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="text-ink/70">{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {resource.materials.length > 0 && (
              <section>
                <h2 className="font-serif font-bold text-xl text-ink mb-4">Materials</h2>
                <ul className="flex flex-wrap gap-2">
                  {resource.materials.map((m, i) => (
                    <li key={i} className="px-3.5 py-1.5 bg-white border border-black/5 rounded-full text-sm text-ink/70">{m}</li>
                  ))}
                </ul>
              </section>
            )}

            {resource.directions.length > 0 && (
              <section>
                <h2 className="font-serif font-bold text-xl text-ink mb-4">Directions</h2>
                <ol className="space-y-3">
                  {resource.directions.map((d, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-black/5">
                      <span className="w-7 h-7 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-ink/70 pt-0.5">{d}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {resource.standards.length > 0 && (
              <section>
                <h2 className="font-serif font-bold text-xl text-ink mb-4">Standards</h2>
                <ul className="flex flex-wrap gap-2">
                  {resource.standards.map((s, i) => (
                    <li key={i} className="px-3.5 py-1.5 bg-ink/5 rounded-full text-xs font-medium text-ink/60">{s}</li>
                  ))}
                </ul>
              </section>
            )}

            {resource.attachments.length > 0 && (
              <section>
                <h2 className="font-serif font-bold text-xl text-ink mb-4">Attachments</h2>
                <ul className="space-y-2">
                  {resource.attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-black/5 hover:border-black/10 transition-colors"
                      >
                        <IconDownload className="w-4 h-4 text-papaya flex-shrink-0" />
                        <span className="text-sm text-ink/80 truncate">{a.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}
