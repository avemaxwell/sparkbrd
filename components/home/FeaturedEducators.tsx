import { IconMedal } from "@/components/icons";

interface Educator {
  name: string;
  initials: string;
  subjects: string;
  years: number;
  downloads: string;
  proven: number;
  color: string;
}

const EDUCATORS: Educator[] = [
  { name: "Sarah Malone",    initials: "SM", subjects: "Visual Art, Ceramics",       years: 12, downloads: "8.2k", proven: 14, color: "from-blush to-papaya"   },
  { name: "Mike Delgado",    initials: "MD", subjects: "Technology, AI Literacy",    years: 7,  downloads: "6.4k", proven: 9,  color: "from-papaya to-lavender" },
  { name: "Ashley Reyes",    initials: "AR", subjects: "Graphic Design",             years: 5,  downloads: "5.1k", proven: 11, color: "from-mustard to-blush"  },
  { name: "Rachel Tanaka",   initials: "RT", subjects: "Digital Citizenship, ELA",   years: 15, downloads: "9.7k", proven: 18, color: "from-aqua to-lime"      },
  { name: "Jordan Kim",      initials: "JK", subjects: "Science, STEM",              years: 9,  downloads: "4.3k", proven: 7,  color: "from-lavender to-aqua"  },
];

export default function FeaturedEducators() {
  return (
    <section className="py-16 md:py-20 px-6 bg-cork-warm">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">Featured educators</h2>
          <p className="text-ink/50 mt-2">Real teachers, sharing what actually works.</p>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-5 pb-2">
          {EDUCATORS.map((e) => (
            <div key={e.name} className="flex-shrink-0 w-56 lg:w-auto bg-white rounded-3xl p-5 shadow-sm border border-black/5 hover:shadow-lg transition-shadow duration-300">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${e.color} flex items-center justify-center text-white font-semibold mb-4`}>
                {e.initials}
              </div>
              <h3 className="font-serif font-semibold text-ink text-base leading-snug">{e.name}</h3>
              <p className="text-xs text-ink/50 mt-1 mb-3">{e.subjects}</p>
              <div className="flex items-center gap-1 text-[11px] font-medium text-aqua bg-aqua/10 px-2 py-1 rounded-full w-fit mb-3">
                <IconMedal className="w-3.5 h-3.5" />
                {e.proven} Classroom Proven
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink/40 border-t border-ink/5 pt-3">
                <span>{e.years} yrs teaching</span>
                <span>{e.downloads} downloads</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
