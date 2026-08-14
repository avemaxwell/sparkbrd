"use client";

import { useRef } from "react";

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      // Clicking a toolbar button normally steals focus from the textarea
      // before onClick fires, collapsing the selection we need to read —
      // preventing default on mousedown keeps the textarea (and its
      // selection) focused throughout the click.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-8 h-8 rounded-lg hover:bg-ink/10 flex items-center justify-center text-ink/70 transition-colors"
    >
      {children}
    </button>
  );
}

// Minimal formatting toolbar over a plain textarea — inserts/toggles
// Markdown syntax around the current selection rather than rendering a full
// WYSIWYG editor. Pairs with FormattedBody.tsx, which renders the same
// Markdown subset (headings, bold, italic) back out.
export default function MarkdownEditor({
  value,
  onChange,
  rows = 12,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  autoFocus?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (marker: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    // Toggle off if the selection is already wrapped in this marker.
    const alreadyWrapped = selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2;
    const nextSelected = alreadyWrapped ? selected.slice(marker.length, selected.length - marker.length) : `${marker}${selected}${marker}`;
    const next = value.slice(0, selectionStart) + nextSelected + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionStart + nextSelected.length);
    });
  };

  const toggleHeading = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const nextBreak = value.indexOf("\n", selectionEnd);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const block = value.slice(lineStart, lineEnd);
    const toggled = block
      .split("\n")
      .map((line) => (line.startsWith("## ") ? line.slice(3) : `## ${line}`))
      .join("\n");
    const next = value.slice(0, lineStart) + toggled + value.slice(lineEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + toggled.length);
    });
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 pb-2 border-b border-ink/10">
        <ToolbarButton label="Heading" onClick={toggleHeading}>
          <span className="font-serif font-bold text-sm">H</span>
        </ToolbarButton>
        <ToolbarButton label="Bold" onClick={() => wrapSelection("**")}>
          <span className="font-bold text-sm">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => wrapSelection("*")}>
          <span className="italic text-sm">I</span>
        </ToolbarButton>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        autoFocus={autoFocus}
        className="w-full px-4 py-3 bg-ink/5 border border-ink/10 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm leading-relaxed resize-y"
      />
    </div>
  );
}
