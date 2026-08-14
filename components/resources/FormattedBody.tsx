import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

// Renders the lesson-plan body as Markdown (headings, bold, italic — see
// MarkdownEditor.tsx for the matching edit-side toolbar). remark-breaks
// turns single newlines into hard breaks rather than the default
// "collapse to a space" — extracted PDF/docx text is layout-driven, not
// paragraph-aware, and needs its line structure preserved (e.g. a numbered
// worksheet list where each number and answer sits on its own line).
const PAGE_MARKER_REGEX = /--\s*\d+\s*of\s*\d+\s*--/gi;

// Backward-compat for resources published before the editor supported real
// Markdown: a short standalone ALL-CAPS line (e.g. "ANSWER KEY") reads as a
// heading in the original document, so promote it to one here too. Skipped
// for lines that already carry Markdown syntax so freshly-edited content
// isn't double-processed.
function isPlainHeadingLine(line: string): boolean {
  if (line.length === 0 || line.length > 70) return false;
  if (!/[A-Za-z]/.test(line)) return false;
  if (/^#{1,6}\s/.test(line)) return false;
  if (line.includes("*")) return false;
  return line === line.toUpperCase();
}

function toMarkdown(text: string): string {
  const cleaned = text.replace(PAGE_MARKER_REGEX, "").trim();
  return cleaned
    .split("\n")
    .map((rawLine) => (isPlainHeadingLine(rawLine.trim()) ? `## ${rawLine.trim()}` : rawLine))
    .join("\n");
}

export default function FormattedBody({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          h1: ({ children }) => <h3 className="font-serif font-bold text-lg text-ink pt-2 first:pt-0">{children}</h3>,
          h2: ({ children }) => <h3 className="font-serif font-bold text-lg text-ink pt-2 first:pt-0">{children}</h3>,
          h3: ({ children }) => <h3 className="font-serif font-bold text-lg text-ink pt-2 first:pt-0">{children}</h3>,
          h4: ({ children }) => <h3 className="font-serif font-bold text-lg text-ink pt-2 first:pt-0">{children}</h3>,
          p: ({ children }) => <p className="text-ink/70 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside text-ink/70 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-ink/70 space-y-1">{children}</ol>,
        }}
      >
        {toMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}
