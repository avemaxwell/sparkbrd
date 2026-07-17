import { createClient } from "@/lib/supabase/server";

export default async function FooterCTA() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return null;

  return (
    <section className="px-6 pb-16 md:pb-20">
      <div className="relative max-w-6xl mx-auto rounded-[32px] overflow-hidden bg-papaya px-8 py-16 md:py-20 text-center">
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-lime/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-blush/30 blur-2xl pointer-events-none" />

        <div className="relative">
          <h2 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight">
            Ready to share what works?
          </h2>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-papaya text-sm font-semibold rounded-full hover:bg-lime hover:text-ink transition-colors"
          >
            Join Sparkurio
            <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
