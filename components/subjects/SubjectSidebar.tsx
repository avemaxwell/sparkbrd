import type { SubjectDef } from "@/lib/subjects";
import { IconBlob } from "@/components/home/decor";
import { IconTrendingUp, IconChevronRight } from "@/components/icons";

export default function SubjectSidebar({ subject }: { subject: SubjectDef }) {
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

      {subject.trending.length > 0 && (
        <div className="bg-lavender/15 rounded-3xl p-5 border border-black/5">
          <h3 className="font-serif font-semibold text-ink mb-3">Trending Topics</h3>
          <ul className="space-y-2.5">
            {subject.trending.map((t) => (
              <li key={t} className="flex items-center justify-between text-sm">
                <span className="text-ink/70">{t}</span>
                <IconTrendingUp className="w-3.5 h-3.5 text-papaya" />
              </li>
            ))}
          </ul>
          <button className="mt-4 w-full py-2 text-sm font-medium text-ink bg-white rounded-full border border-black/10 hover:border-black/20 transition-colors">
            View all trends
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm">
        <h3 className="font-serif font-semibold text-ink mb-3">Top Resource Types</h3>
        <ul className="space-y-2.5">
          {subject.resourceTypes.map((rt) => (
            <li key={rt.label} className="flex items-center justify-between text-sm">
              <span className="text-ink/70">{rt.label}</span>
              <span className="text-ink/40">{rt.count}</span>
            </li>
          ))}
        </ul>
        <button className="mt-4 w-full py-2 text-sm font-medium text-ink bg-cork-warm rounded-full border border-black/10 hover:border-black/20 transition-colors">
          View all types
        </button>
      </div>

      <div className="bg-blush/10 rounded-3xl p-5 border border-black/5">
        <div className="flex items-center gap-3 mb-3">
          <IconBlob
            icon={<subject.icon className="w-full h-full" />}
            blobClassName=""
            blobStyle={{ backgroundColor: subject.color }}
            iconClassName={subject.textOn === "white" ? "text-white" : "text-ink"}
            size={44}
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">Curated Collection</span>
        </div>
        <h4 className="font-serif font-semibold text-ink mb-1">{subject.curated.title}</h4>
        <p className="text-sm text-ink/60 leading-relaxed mb-3">{subject.curated.description}</p>
        <a href="#resources" className="inline-flex items-center gap-1 text-sm font-medium text-papaya hover:text-papaya/70 transition-colors">
          Explore Collection
          <IconChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
}
