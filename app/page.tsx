import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import BoardsSection from "@/components/home/BoardsSection";
import DiscoverySection from "@/components/home/DiscoverySection";
import FloatingTackButton from "@/components/home/FloatingTackButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFCFB]">
      <Header />
      <HeroSection />
      <BoardsSection />
      <DiscoverySection />
      <FloatingTackButton />
      <BottomNav />
    </main>
  );
}