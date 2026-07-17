import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import SubjectPageClient from "@/components/subjects/SubjectPageClient";
import { getSubject } from "@/lib/subjects";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subject = getSubject(slug);
  return {
    title: `${subject.name} — Sparkurio`,
    description: subject.description,
  };
}

export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-cork-warm pb-20 lg:pb-0">
      <Header />
      <SubjectPageClient slug={slug} />
      <BottomNav />
    </main>
  );
}
