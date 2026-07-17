"use client";

import { useState } from "react";

export default function TagListInput({
  items,
  onChange,
  placeholder,
  variant = "chip",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  variant?: "chip" | "numbered";
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="px-5 py-3 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-30"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink/30">Nothing added yet.</p>
      ) : variant === "chip" ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-papaya/10 text-papaya text-sm rounded-full">
              {item}
              <button type="button" onClick={() => removeAt(i)} className="w-4 h-4 rounded-full hover:bg-papaya/20 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </span>
          ))}
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 bg-ink/5 rounded-xl p-3">
              <span className="w-6 h-6 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm text-ink/80 pt-0.5">{item}</span>
              <button type="button" onClick={() => removeAt(i)} className="w-6 h-6 rounded-full hover:bg-ink/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 stroke-ink/50 stroke-[2.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
