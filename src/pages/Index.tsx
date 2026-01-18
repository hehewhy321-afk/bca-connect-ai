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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: settings } = useQuery({
    queryKey: ["website-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_settings")
        .select("*");
      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data.forEach((s) => {
        settingsMap[s.setting_key] = s.setting_value || "";
      });
      return settingsMap;
    },
  });

  const ensureProtocol = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

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
    mainImageUrl: 'https://ik.imagekit.io/otherhope/7fc616f24c9.png',
    mainImageAlt: 'BCA Connect Mobile App Interface',
    githubDownloadUrl: settings?.app_download_link
      ? ensureProtocol(settings.app_download_link)
      : 'https://github.com/hehewhy321-afk/bca-connect-ai-app/releases/download/v1.2.0/BCA-Association-v1.2.0.apk',
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
