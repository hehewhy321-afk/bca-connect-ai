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
import { AppDownloadSection } from "@/components/ui/app-download-section";
import { Bell, Network, Layout, Zap, ShieldCheck, Smartphone, Cloud } from "lucide-react";

const Index = () => {
  const appDownloadProps = {
    title: 'Download BCA Connect App',
    subtitle: 'Stay connected with the BCA community anytime, anywhere. Get real-time updates on events, connectivity, and resources right at your fingertips.',
    features: [
      { icon: <Zap size={24} />, title: 'Exclusive Tools' },
      { icon: <Network size={24} />, title: 'Community' },
      { icon: <Layout size={24} />, title: 'Clean UI' },
      { icon: <Smartphone size={24} />, title: 'Future-Ready' },
    ],
    benefits: [
      { icon: <Zap size={18} />, title: 'Finance Tracker & Pomodoro' },
      { icon: <ShieldCheck size={18} />, title: 'Secure & Private' },
      { icon: <Cloud size={18} />, title: 'More Tools Coming Soon' },
    ],
    qrCodeUrl: 'https://ik.imagekit.io/fpxbgsota/Untitled.png',
    qrCodeAlt: 'BCA Connect App QR Code',
    mainImageUrl: 'https://ik.imagekit.io/otherhope/7fc616f24c9.png',
    mainImageAlt: 'BCA Connect Mobile App Interface',
    githubDownloadUrl: 'https://github.com/hehewhy321-afk/bca-connect-ai/releases',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <AppDownloadSection {...appDownloadProps} />
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
