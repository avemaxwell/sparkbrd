import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import BoardsSection from "@/components/home/BoardsSection";

export default function BoardsPage() {
  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20 lg:pb-0">
      <Header />
      <div className="pt-24 md:pt-28">
        <BoardsSection showAll />
      </div>
      <BottomNav />
    </main>
  );
}
