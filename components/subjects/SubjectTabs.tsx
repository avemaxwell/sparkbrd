"use client";

import type { Subcategory } from "@/lib/subjects";

export default function SubjectTabs({
  subcategories,
  active,
  onChange,
}: {
  subcategories: Subcategory[];
  active: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="border-b border-ink/5 bg-white">
      <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 py-2" style={{ width: "max-content" }}>
          {subcategories.map((s) => (
            <button
              key={s.slug}
              onClick={() => onChange(s.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                active === s.slug ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
