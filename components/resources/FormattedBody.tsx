// Renders extracted lesson-plan text (from the "upload an existing lesson
// plan" flow) with real paragraph/heading structure instead of one flat
// blob — the source text has no markup, just layout-driven line breaks, so
// headings are inferred: a short standalone ALL-CAPS line (e.g. "ANSWER
// KEY") reads as a heading in the original document too.
const PAGE_MARKER_REGEX = /--\s*\d+\s*of\s*\d+\s*--/gi;

function isHeadingLine(line: string): boolean {
  if (line.length === 0 || line.length > 70) return false;
  if (!/[A-Za-z]/.test(line)) return false;
  return line === line.toUpperCase();
}

type Block = { type: "heading" | "paragraph"; content: string };

// A heading line in the source PDF usually sits right up against the body
// text that follows it (single newline, no blank-line gap) — pdf-parse's
// line-preservation is layout-driven, not paragraph-aware — so headings
// have to be detected per-line while streaming, not by isolating blocks
// that happen to be surrounded by blank lines.
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];

  const flush = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", content: paragraphLines.join("\n") });
      paragraphLines = [];
    }
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) { flush(); continue; }
    if (isHeadingLine(line)) {
      flush();
      blocks.push({ type: "heading", content: line });
    } else {
      paragraphLines.push(rawLine);
    }
  }
  flush();
  return blocks;
}

export default function FormattedBody({ text }: { text: string }) {
  // Defensive strip for resources published before pageJoiner was fixed at
  // the extraction source (see app/api/resources/extract-text/route.ts).
  const cleaned = text.replace(PAGE_MARKER_REGEX, "").trim();
  const blocks = toBlocks(cleaned);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <h3 key={i} className="font-serif font-bold text-lg text-ink pt-2 first:pt-0">
            {block.content}
          </h3>
        ) : (
          <p key={i} className="text-ink/70 leading-relaxed whitespace-pre-line">
            {block.content}
          </p>
        )
      )}
    </div>
  );
}
