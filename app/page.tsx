import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedResources from "@/components/home/FeaturedResources";
import SparkurioLabs from "@/components/home/SparkurioLabs";
import FeaturedCollections from "@/components/home/FeaturedCollections";
import FeaturedEducators from "@/components/home/FeaturedEducators";
import CommunityActivity from "@/components/home/CommunityActivity";
import WhySparkurio from "@/components/home/WhySparkurio";
import FooterCTA from "@/components/home/FooterCTA";
import FloatingTackButton from "@/components/home/FloatingTackButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F6F6] pb-20 lg:pb-0">
      <Header />
      <HeroSection />
      <FeaturedCategories />
      <FeaturedResources />
      <SparkurioLabs />
      <FeaturedCollections />
      <FeaturedEducators />
      <CommunityActivity />
      <WhySparkurio />
      <FooterCTA />
      <FloatingTackButton />
      <BottomNav />
    </main>
  );
}
