import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import MatchingPreview from "@/components/MatchingPreview";
import GiftSection from "@/components/GiftSection";
import PricingSection from "@/components/PricingSection";
import PaymentSection from "@/components/PaymentSection";
import FooterCTA from "@/components/FooterCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="features"><FeaturesSection /></div>
      <MatchingPreview />
      <div id="gifts"><GiftSection /></div>
      <div id="pricing"><PricingSection /></div>
      <div id="safety"><PaymentSection /></div>
      <FooterCTA />
    </div>
  );
};

export default Index;
