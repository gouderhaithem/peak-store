import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import NewArrivals from "@/components/home/NewArrivals";
import LifestyleSections from "@/components/home/LifestyleSection";
import FeaturesSection from "@/components/home/FeaturesSection";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <NewArrivals />
        <LifestyleSections />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  );
}
