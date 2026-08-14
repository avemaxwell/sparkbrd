import Link from "next/link";
import FormattedBody from "@/components/resources/FormattedBody";
import { BLOCK_TYPES, type LessonBlocksData, totalMinutes } from "@/lib/lesson-blocks";

// Read-only render of a published lesson plan built with LessonBlockCanvas —
// same block metadata (icons/colors), just cards instead of an editor.
export default function LessonBlocksView({ data }: { data: LessonBlocksData }) {
  const total = totalMinutes(data.items);
  const barDenominator = Math.max(total, data.periodMinutes, 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-2 flex-1 rounded-full bg-ink/5 overflow-hidden flex">
          {data.items.filter((b) => b.minutes).map((b) => (
            <div
              key={b.id}
              className={BLOCK_TYPES[b.type].bg}
              style={{ width: `${((b.minutes ?? 0) / barDenominator) * 100}%` }}
            />
          ))}
        </div>
        <span className="text-xs text-ink/40 flex-shrink-0">{total} / {data.periodMinutes} min</span>
      </div>

      <div className="space-y-3">
        {data.items.map((block) => {
          const meta = BLOCK_TYPES[block.type];
          const Icon = meta.icon;
          return (
            <div key={block.id} className="bg-white rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-full ${meta.bgSoft} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${meta.stroke}`} />
                </div>
                <h3 className="font-serif font-semibold text-ink flex-1">{block.title}</h3>
                {block.minutes !== null && (
                  <span className="text-xs font-medium text-ink/40 bg-ink/5 px-2.5 py-1 rounded-full flex-shrink-0">{block.minutes} min</span>
                )}
              </div>
              {block.content.trim() && <FormattedBody text={block.content} />}
              {block.linkedResourceId && (
                <Link
                  href={`/resources/${block.linkedResourceId}`}
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-papaya/8 text-papaya rounded-full text-xs font-medium hover:bg-papaya/15 transition-colors"
                >
                  <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                  {block.linkedResourceTitle ?? "View linked resource"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
