import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Globe, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube, Loader2, Save } from "lucide-react";

interface SettingsMap {
  [key: string]: string;
}

const AdminWebsiteSettings = () => {
  const queryClient = useQueryClient();
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
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["website-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_settings")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      const mapped: SettingsMap = {};
      settingsData.forEach((s) => {
        mapped[s.setting_key] = s.setting_value || "";
      });
      setSettings((prev) => ({ ...prev, ...mapped }));
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: SettingsMap) => {
      const updates = Object.entries(newSettings).map(([key, value]) =>
        supabase
          .from("website_settings")
          .update({ setting_value: value })
          .eq("setting_key", key)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Website Settings</h1>
            <p className="text-muted-foreground">Configure your website's global settings</p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Site name and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => handleChange("site_name", e.target.value)}
                  placeholder="BCA Association"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_logo">Logo URL</Label>
                <Input
                  id="site_logo"
                  value={settings.site_logo}
                  onChange={(e) => handleChange("site_logo", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                {settings.site_logo && (
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <img
                      src={settings.site_logo}
                      alt="Logo Preview"
                      className="max-h-16 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Phone and email addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+977-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_primary">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Primary Email
                </Label>
                <Input
                  id="email_primary"
                  type="email"
                  value={settings.email_primary}
                  onChange={(e) => handleChange("email_primary", e.target.value)}
                  placeholder="info@bcaassociation.edu.np"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_secondary">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Secondary Email
                </Label>
                <Input
                  id="email_secondary"
                  type="email"
                  value={settings.email_secondary}
                  onChange={(e) => handleChange("email_secondary", e.target.value)}
                  placeholder="support@bcaassociation.edu.np"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>Connect your social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="facebook_url" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook_url"
                    value={settings.facebook_url}
                    onChange={(e) => handleChange("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter_url"
                    value={settings.twitter_url}
                    onChange={(e) => handleChange("twitter_url", e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram_url"
                    value={settings.instagram_url}
                    onChange={(e) => handleChange("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin_url"
                    value={settings.linkedin_url}
                    onChange={(e) => handleChange("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" />
                    YouTube
                  </Label>
                  <Input
                    id="youtube_url"
                    value={settings.youtube_url}
                    onChange={(e) => handleChange("youtube_url", e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWebsiteSettings;
