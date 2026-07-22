"use client";

export const SECTION_LABELS: Record<string, string> = {
  learning_targets: "Learning targets",
  materials: "Materials",
  directions: "Directions",
  standards: "Standards",
  photos: "Photos",
  attachments: "Attachments",
};

export const DEFAULT_SECTION_ORDER = ["learning_targets", "materials", "directions", "standards", "photos", "attachments"];

// Plug-and-play sections: toggle which of the fixed section types appear on
// the published lesson plan, and reorder them. Arrow buttons rather than
// drag-and-drop — no new dependency, and just as usable for a 6-item list.
export default function SectionOrderPicker({
  order,
  onChange,
}: {
  order: string[];
  onChange: (order: string[]) => void;
}) {
  const disabled = DEFAULT_SECTION_ORDER.filter((key) => !order.includes(key));

  const toggle = (key: string) => {
    if (order.includes(key)) onChange(order.filter((k) => k !== key));
    else onChange([...order, key]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {order.map((key, i) => (
        <div key={key} className="flex items-center gap-3 bg-ink/5 rounded-xl px-4 py-3">
          <div className="flex flex-col -my-1">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-ink/40 hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="text-ink/40 hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <span className="flex-1 text-sm font-medium text-ink">{SECTION_LABELS[key] ?? key}</span>
          <button
            type="button"
            onClick={() => toggle(key)}
            className="text-xs font-medium text-ink/40 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
      ))}

      {disabled.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-ink/40 mb-2">Not included:</p>
          <div className="flex flex-wrap gap-2">
            {disabled.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-ink/15 text-ink/40 hover:border-papaya hover:text-papaya transition-colors"
              >
                + {SECTION_LABELS[key] ?? key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
