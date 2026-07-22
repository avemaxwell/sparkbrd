import type { SubjectDef } from "@/lib/subjects";
import { IconChevronRight } from "@/components/icons";

interface TypeCount {
  label: string;
  count: number;
}

export default function SubjectSidebar({ subject, typeCounts }: { subject: SubjectDef; typeCounts: TypeCount[] }) {
  return (
    <aside className="space-y-5">
      <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm">
        <h3 className="font-serif font-semibold text-ink mb-2">About {subject.name}</h3>
        <p className="text-sm text-ink/60 leading-relaxed mb-3">{subject.description}</p>
        <a href="#resources" className="inline-flex items-center gap-1 text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
          Learn more about this subject
          <IconChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {typeCounts.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm">
          <h3 className="font-serif font-semibold text-ink mb-3">Resource Types</h3>
          <ul className="space-y-2.5">
            {typeCounts.map((rt) => (
              <li key={rt.label} className="flex items-center justify-between text-sm">
                <span className="text-ink/70">{rt.label}</span>
                <span className="text-ink/40">{rt.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
