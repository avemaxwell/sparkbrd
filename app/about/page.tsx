import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { IconShieldCheck, IconUsers, IconRefresh, IconPersonCheck } from "@/components/icons";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ShapeCorner = getShapeCorner("about");

export const metadata = {
  title: "About — Sparkurio",
  description: "Sparkurio is a professional platform where educators discover, organize, share, improve, and validate classroom-proven instructional resources.",
};

const PRINCIPLES = [
  { icon: IconShieldCheck, title: "Trust over popularity", body: "A resource's value comes from real classroom results, not download counts." },
  { icon: IconPersonCheck, title: "Experience over aesthetics", body: "What matters is whether it works in a classroom, not how polished the cover looks." },
  { icon: IconUsers, title: "Community over marketplace", body: "Educators sharing with educators — not a storefront." },
  { icon: IconRefresh, title: "Improvement over perfection", body: "Resources get better over time through real classroom feedback." },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />
      <ShapeCorner className="absolute top-24 right-4 hidden lg:block" />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20 md:pt-36">
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-ink leading-tight mb-6">
          The most trusted place to find classroom-tested resources.
        </h1>
        <p className="text-lg text-ink/60 leading-relaxed mb-4">
          Sparkurio is a professional platform where educators discover, organize, share,
          improve, and validate instructional resources — built by educators, shared by
          educators, improved by educators.
        </p>
        <p className="text-lg text-ink/60 leading-relaxed mb-14">
          We believe teachers deserve resources they can trust: classroom-tested, peer
          reviewed, and honest about how they were made.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
              <p.icon className="w-6 h-6 text-papaya mb-3" />
              <h3 className="font-serif font-semibold text-ink mb-1.5">{p.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-ink rounded-3xl p-8 text-center">
          <p className="text-white text-lg font-serif font-semibold mb-5">Ready to share what works?</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-lime text-ink text-sm font-semibold rounded-full hover:bg-lime/90 transition-colors"
          >
            Join Sparkurio
          </Link>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
