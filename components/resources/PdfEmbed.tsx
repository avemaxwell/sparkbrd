"use client";

import { useEffect, useState } from "react";

export default function PdfEmbed({ name, resolveSrc }: { name: string; resolveSrc: () => Promise<string> }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setError(false);
    resolveSrc()
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 bg-ink/5 rounded-2xl text-sm text-ink/50">
        Couldn&rsquo;t load {name}.
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex items-center justify-center h-40 bg-ink/5 rounded-2xl">
        <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <iframe src={src} title={name} className="w-full rounded-2xl border border-black/5" style={{ height: "75vh" }} />
      <a href={src} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-ink/40 hover:text-papaya transition-colors">
        Open in new tab
      </a>
    </div>
  );
}
