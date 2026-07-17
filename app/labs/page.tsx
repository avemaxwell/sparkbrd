import Link from "next/link";
import { getShapeCorner } from "@/components/decor/ShapeCorner";

const ShapeCorner = getShapeCorner("labs");

export const metadata = {
  title: "Sparkurio Labs — Coming soon",
  description: "Volunteer to classroom-test new resources and help them become Classroom Proven.",
};

export default function LabsPage() {
  return (
    <div className="relative min-h-screen bg-ink flex items-center justify-center px-6 text-center overflow-hidden">
      <ShapeCorner className="absolute top-24 left-4 hidden lg:block opacity-90" />
      <div className="max-w-lg">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-lime bg-lime/10 px-3 py-1.5 rounded-full mb-6">
          Sparkurio Labs
        </span>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight mb-4">
          Coming soon.
        </h1>
        <p className="text-white/60 text-lg leading-relaxed mb-9">
          We&rsquo;re building a home for educators to classroom-test new resources and help them
          earn Classroom Proven status. Check back soon.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-lime text-ink text-sm font-semibold rounded-full hover:bg-lime/90 transition-colors"
        >
          Back to Sparkurio
        </Link>
      </div>
    </div>
  );
}
