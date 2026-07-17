import { IconVase, IconPencil, IconCamera, IconAtom, IconLaptop, IconGlobe, IconCubes } from "@/components/icons";

const COLLECTIONS = [
  { name: "Middle School Ceramics",     count: 24, color: "bg-gradient-to-br from-mustard/70 to-blush/40",   icon: IconVase,   tall: true  },
  { name: "Canva Classroom Projects",   count: 41, color: "bg-gradient-to-br from-papaya/70 to-lavender/40", icon: IconPencil, tall: false },
  { name: "Photography",                count: 18, color: "bg-gradient-to-br from-aqua/70 to-lime/40",       icon: IconCamera, tall: false },
  { name: "Elementary STEM",            count: 33, color: "bg-gradient-to-br from-lime/80 to-aqua/40",       icon: IconAtom,   tall: true  },
  { name: "AI Literacy",                count: 15, color: "bg-gradient-to-br from-blush/70 to-papaya/40",    icon: IconLaptop, tall: false },
  { name: "Digital Citizenship",        count: 22, color: "bg-gradient-to-br from-lavender/80 to-blush/40",  icon: IconGlobe,  tall: false },
  { name: "Project-Based Learning",     count: 29, color: "bg-gradient-to-br from-papaya/70 to-lime/40",     icon: IconCubes,  tall: true  },
];

export default function FeaturedCollections() {
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">Featured collections</h2>
          <p className="text-ink/50 mt-2">Curated bundles of resources, ready to teach.</p>
        </div>

        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
          {COLLECTIONS.map((c) => (
            <a
              key={c.name}
              href={`/search?q=${encodeURIComponent(c.name)}`}
              className={`group relative block mb-4 break-inside-avoid rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${c.color} ${c.tall ? "aspect-[3/4]" : "aspect-square"}`}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <c.icon className="w-8 h-8 text-white drop-shadow-sm" />
                <div>
                  <h3 className="font-serif font-semibold text-white text-lg leading-snug drop-shadow-sm">{c.name}</h3>
                  <p className="text-white/80 text-xs mt-1">{c.count} resources</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
