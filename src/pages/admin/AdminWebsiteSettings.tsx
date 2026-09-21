import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Settings, Globe, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube, Loader2, Save, Upload, X, Image, Smartphone, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SettingsMap {
  [key: string]: string;
}

const LABEL =
  "text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1";
const FIELD =
  "h-10 rounded-md border-border bg-background/60 font-medium focus:border-primary/50 focus:ring-primary/20";

const AdminWebsiteSettings = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
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
    signup_enabled: "true",
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
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Settings className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-bold text-foreground">
                Website <span className="italic text-primary">settings</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Branding, contact details and links used across the public site
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-9 shrink-0 rounded-md bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="mr-1.5 h-4 w-4" aria-hidden />
            )}
            Save changes
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Identity */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30"
          >
            <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Globe className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Identity Profile</h2>
                <p className="text-xs text-muted-foreground">Name and logo shown to visitors</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="site_name" className={LABEL}>Platform Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => handleChange("site_name", e.target.value)}
                  placeholder="BCA Association"
                  className={FIELD}
                />
              </div>

              <div className="space-y-2">
                <Label className={LABEL}>Visual Signature (Logo)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {settings.site_logo ? (
                  <div className="rounded-md border border-border bg-background/60 p-4">
                    <img
                      src={settings.site_logo}
                      alt="Logo preview"
                      className="mx-auto max-h-20 object-contain"
                    />
                    <div className="mt-4 flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-8 rounded-md border-border px-3 text-xs"
                      >
                        {isUploading ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        )}
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="h-8 rounded-md border-border px-3 text-xs text-destructive hover:border-destructive/40 hover:text-destructive"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="group/upload w-full rounded-md border border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {isUploading ? (
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden />
                    ) : (
                      <Image className="mx-auto h-8 w-8 text-muted-foreground transition-colors group-hover/upload:text-primary" aria-hidden />
                    )}
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {isUploading ? "Uploading…" : "Upload a logo"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">PNG, SVG or JPG, up to 2MB</p>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_logo_url" className={LABEL}>Direct URI Link</Label>
                <Input
                  id="site_logo_url"
                  value={settings.site_logo}
                  onChange={(e) => handleChange("site_logo", e.target.value)}
                  placeholder="https://cdn.bca.ai/logo.png"
                  className={`${FIELD} font-mono text-xs`}
                />
              </div>
            </div>
          </motion.section>

          {/* Contact */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30"
          >
            <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Phone className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Nexus Terminals</h2>
                <p className="text-xs text-muted-foreground">How people reach the association</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { id: "phone", label: "Transmission Line", icon: Phone, placeholder: "+977-XXXXXXXXXX", type: "text" },
                { id: "email_primary", label: "Primary Archive Link", icon: Mail, placeholder: "info@bcaassociation.edu.np", type: "email" },
                { id: "email_secondary", label: "Emergency Frequency", icon: Mail, placeholder: "support@bcaassociation.edu.np", type: "email" },
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className={LABEL}>{field.label}</Label>
                  <div className="group relative">
                    <field.icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden />
                    <Input
                      id={field.id}
                      type={field.type}
                      value={settings[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={`${FIELD} pl-9`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* App distribution */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30"
          >
            <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Smartphone className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">App Distribution</h2>
                <p className="text-xs text-muted-foreground">Where the Get the app button points</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_download_link" className={LABEL}>APK / Download URL</Label>
              <div className="group relative">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden />
                <Input
                  id="app_download_link"
                  value={settings.app_download_link}
                  onChange={(e) => handleChange("app_download_link", e.target.value)}
                  placeholder="https://github.com/.../app-release.apk"
                  className={`${FIELD} pl-9`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Direct link to the APK file or an app store listing.
              </p>
            </div>
          </motion.section>

          {/* Access control */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30"
          >
            <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Lock className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Access Control</h2>
                <p className="text-xs text-muted-foreground">Who can create an account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 p-4">
                <div>
                  <Label className="text-sm font-bold text-foreground">Self Signup</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Let visitors create their own accounts
                  </p>
                </div>
                <Switch
                  checked={settings.signup_enabled === "true"}
                  onCheckedChange={(checked) => handleChange("signup_enabled", checked ? "true" : "false")}
                />
              </div>

              <p className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs leading-relaxed text-yellow-600 dark:text-yellow-500">
                Turning this off hides the signup form and blocks signups at the database
                level. Creating accounts from the admin still works.
              </p>
            </div>
          </motion.section>

          {/* Social links */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30 lg:col-span-2"
          >
            <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Settings className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Signal Matrix</h2>
                <p className="text-xs text-muted-foreground">Social profiles linked in the footer</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "facebook_url", icon: Facebook, label: "Facebook Node", color: "text-blue-500" },
                { key: "twitter_url", icon: Twitter, label: "X / Twitter Stream", color: "text-sky-400" },
                { key: "instagram_url", icon: Instagram, label: "Instagram Visuals", color: "text-pink-500" },
                { key: "linkedin_url", icon: Linkedin, label: "Professional Link", color: "text-blue-600" },
                { key: "youtube_url", icon: Youtube, label: "YouTube Broadcast", color: "text-red-500" },
              ].map((social) => (
                <div key={social.key} className="space-y-2">
                  <Label htmlFor={social.key} className={`${LABEL} flex items-center gap-1.5`}>
                    <social.icon className={`h-3 w-3 ${social.color}`} aria-hidden />
                    {social.label}
                  </Label>
                  <Input
                    id={social.key}
                    value={settings[social.key]}
                    onChange={(e) => handleChange(social.key, e.target.value)}
                    placeholder="https://..."
                    className={`${FIELD} text-xs`}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminWebsiteSettings;
