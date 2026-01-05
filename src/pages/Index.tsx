import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { AIAssistantSection } from "@/components/sections/AIAssistantSection";
import { EventsSection } from "@/components/sections/EventsSection";
import { FeaturedAlumniSection } from "@/components/sections/FeaturedAlumniSection";
import { FoundingMembersSection } from "@/components/sections/FoundingMembersSection";
import { CommunitySection } from "@/components/sections/CommunitySection";
import { CTASection } from "@/components/sections/CTASection";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <AIAssistantSection />
        <EventsSection />
        <FeaturedAlumniSection />
        <FoundingMembersSection />
        <CommunitySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
