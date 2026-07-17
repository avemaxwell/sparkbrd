import { IconBlob } from "./decor";
import { SUBJECT_LIST } from "@/lib/subjects";

export default function FeaturedCategories() {
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">Browse by subject</h2>
            <p className="text-ink/50 mt-2">Find resources built for your classroom.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {SUBJECT_LIST.map((subject) => (
            <a
              key={subject.slug}
              href={`/subjects/${subject.slug}`}
              style={{ backgroundColor: subject.color }}
              className="group relative rounded-3xl aspect-square p-4 flex flex-col items-center justify-center gap-3 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <IconBlob
                icon={<subject.icon className="w-full h-full" />}
                size={60}
                blobClassName="bg-white/90 group-hover:scale-110 transition-transform duration-300"
              />
              <span className={`font-serif font-semibold text-sm text-center leading-tight ${subject.textOn === "white" ? "text-white" : "text-ink"}`}>
                {subject.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
