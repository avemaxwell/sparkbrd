import { Blob, PatternCornerAlt } from "./decor";

export default function SparkurioLabs() {
  return (
    <section className="relative overflow-hidden bg-papaya py-20 md:py-28 px-6">
      <Blob className="absolute -top-16 -right-10 w-56 h-56 bg-white/10 pointer-events-none" />
      <PatternCornerAlt className="absolute bottom-4 left-4 hidden lg:block" />

      <div className="relative max-w-3xl mx-auto text-center">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-lime bg-white/10 px-3 py-1.5 rounded-full mb-6">
          Sparkurio Labs
        </span>
        <h2 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight">
          Help shape tomorrow&rsquo;s best lessons.
        </h2>
        <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
          Volunteer to test new teaching resources and help them become Classroom Proven.
        </p>
        <a
          href="/labs"
          className="inline-flex items-center gap-2 mt-9 px-8 py-4 bg-lime text-ink text-sm font-semibold rounded-full hover:bg-lime/90 transition-colors"
        >
          Explore Labs
          <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
