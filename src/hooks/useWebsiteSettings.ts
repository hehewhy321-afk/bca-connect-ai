import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WebsiteSettings {
  site_logo: string;
  site_name: string;
  site_subtitle: string;
  phone: string;
  email_primary: string;
  email_secondary: string;
  address: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  github_url: string;
  youtube_url: string;
  signup_enabled: string;
}

const defaultSettings: WebsiteSettings = {
  site_logo: "",
  site_name: "BCA Association",
  site_subtitle: "MMAMC Nepal",
  phone: "+977-9800923746",
  email_primary: "bca@mmamc.edu.np",
  email_secondary: "info@mmamc.edu.np",
  address: "MMAMC College, Biratnagar, Nepal",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  linkedin_url: "",
  github_url: "",
  youtube_url: "",
  signup_enabled: "true",
};

export function useWebsiteSettings() {
  return useQuery({
    queryKey: ["website-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settings = { ...defaultSettings };

      data?.forEach((item) => {
        const key = item.setting_key as keyof WebsiteSettings;
        if (key in settings && item.setting_value) {
          settings[key] = item.setting_value;
        }
      });

      return settings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
