import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import BoardsSection from "@/components/home/BoardsSection";
import DiscoverySection from "@/components/home/DiscoverySection";
import FloatingTackButton from "@/components/home/FloatingTackButton";
import TeamsSidebar from "@/components/layout/TeamsSidebar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
      <Header />
      <HeroSection />
      <div className="lg:flex">
        <TeamsSidebar />
        <div className="flex-1 min-w-0">
          <BoardsSection />
          <DiscoverySection />
        </div>
      </div>
      <FloatingTackButton />
      <BottomNav />
    </main>
  );
}
