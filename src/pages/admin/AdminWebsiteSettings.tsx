import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Settings, Globe, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube, Loader2, Save, Upload, X, Image, Smartphone } from "lucide-react";

interface SettingsMap {
  [key: string]: string;
}

const AdminWebsiteSettings = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<SettingsMap>({
    site_name: "",
    site_logo: "",
    phone: "",
    email_primary: "",
    email_secondary: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: "",
    app_download_link: "",
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-website-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_settings")
        .select("*");
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnMount: true
  });

  useEffect(() => {
    if (settingsData && Array.isArray(settingsData)) {
      const mapped: SettingsMap = {};
      settingsData.forEach((s) => {
        mapped[s.setting_key] = s.setting_value || "";
      });
      setSettings((prev) => ({ ...prev, ...mapped }));
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: SettingsMap) => {
      // Use upsert to insert or update settings
      const updates = Object.entries(newSettings).map(async ([key, value]) => {
        const { error } = await supabase
          .from("website_settings")
          .upsert(
            { setting_key: key, setting_value: value },
            { onConflict: "setting_key" }
          );
        if (error) throw error;
      });
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-website-settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("website-assets")
        .upload(filePath, file, { upsert: true, cacheControl: "31536000", contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("website-assets")
        .getPublicUrl(filePath);

      handleChange("site_logo", publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      toast.error("Failed to upload logo: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    handleChange("site_logo", "");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-10 pb-20">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Global Config
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Core parameters and branding protocols
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-3 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-3" />
            )}
            Transmit Changes
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-[3rem] p-8 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Identity Profile</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Platform branding variables</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="site_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Platform Name</Label>
                <div className="relative group">
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => handleChange("site_name", e.target.value)}
                    placeholder="BCA Association"
                    className="h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual Signature (Logo)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {settings.site_logo ? (
                  <div className="relative p-6 glass rounded-[2rem] border border-white/5 group/logo">
                    <img
                      src={settings.site_logo}
                      alt="Logo Preview"
                      className="max-h-24 object-contain mx-auto transition-transform group-hover/logo:scale-105 duration-500"
                    />
                    <div className="flex gap-3 mt-6 justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="rounded-xl border border-white/5 hover:bg-white/5"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2 text-primary" />
                        )}
                        Update
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="rounded-xl border border-white/5 hover:bg-red-500/10 text-red-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Purge
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-[2rem] p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group/upload"
                  >
                    {isUploading ? (
                      <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                    ) : (
                      <div className="relative">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground group-hover/upload:text-primary transition-colors" />
                        <Upload className="absolute -right-2 -bottom-2 h-5 w-5 text-primary opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-muted-foreground group-hover/upload:text-foreground">
                      {isUploading ? "Uploading Protocol..." : "Upload Vector Data"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 font-bold mt-1">PNG, SVG, JPG | MAX 2MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="site_logo_url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Direct URI Link</Label>
                <Input
                  id="site_logo_url"
                  value={settings.site_logo}
                  onChange={(e) => handleChange("site_logo", e.target.value)}
                  placeholder="https://cdn.bca.ai/logo.png"
                  className="h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono text-[10px] opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-[3rem] p-8 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Nexus Terminals</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Communication link parameters</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transmission Line</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+977-XXXXXXXXXX"
                    className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_primary" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Archive Link</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email_primary"
                    type="email"
                    value={settings.email_primary}
                    onChange={(e) => handleChange("email_primary", e.target.value)}
                    placeholder="info@bcaassociation.edu.np"
                    className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_secondary" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Emergency Frequency</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email_secondary"
                    type="email"
                    value={settings.email_secondary}
                    onChange={(e) => handleChange("email_secondary", e.target.value)}
                    placeholder="support@bcaassociation.edu.np"
                    className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* App Config */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass-card rounded-[3rem] p-8 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">App Distribution</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mobile app parameters</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="app_download_link" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">APK / Download URL</Label>
                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="app_download_link"
                    value={settings.app_download_link}
                    onChange={(e) => handleChange("app_download_link", e.target.value)}
                    placeholder="https://github.com/.../app-release.apk"
                    className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">Direct link to the APK file or app store listing.</p>
              </div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-[3rem] p-8 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Signal Matrix</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">External node connections</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative z-10">
              {[
                { key: "facebook_url", icon: Facebook, label: "Facebook Node", color: "text-blue-500" },
                { key: "twitter_url", icon: Twitter, label: "X / Twitter Stream", color: "text-sky-400" },
                { key: "instagram_url", icon: Instagram, label: "Instagram Visuals", color: "text-pink-500" },
                { key: "linkedin_url", icon: Linkedin, label: "Professional Link", color: "text-blue-600" },
                { key: "youtube_url", icon: Youtube, label: "YouTube Broadcast", color: "text-red-500" },
              ].map((social) => (
                <div key={social.key} className="space-y-2">
                  <Label htmlFor={social.key} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <social.icon className={`h-3 w-3 ${social.color}`} />
                    {social.label}
                  </Label>
                  <Input
                    id={social.key}
                    value={settings[social.key]}
                    onChange={(e) => handleChange(social.key, e.target.value)}
                    placeholder="https://..."
                    className="h-11 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold text-xs"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWebsiteSettings;
