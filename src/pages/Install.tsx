import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Smartphone,
  Monitor,
  Check,
  Share,
  Plus,
  Wifi,
  WifiOff,
  Bell,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant loading and smooth performance",
    },
    {
      icon: WifiOff,
      title: "Works Offline",
      description: "Access content even without internet",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Get updates on events and announcements",
    },
    {
      icon: Smartphone,
      title: "Native Feel",
      description: "Full-screen app experience on your device",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Download className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Install BCA Association App
            </h1>
            <p className="text-lg text-muted-foreground">
              Get the full experience on your device. Install our app for faster
              access, offline support, and notifications.
            </p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md mx-auto mb-12"
          >
            <Card className={isInstalled ? "border-green-500/30 bg-green-500/5" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isInstalled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {isInstalled ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Download className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {isInstalled ? "App Installed!" : "Ready to Install"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isInstalled
                        ? "You're using the installed app"
                        : "Install for the best experience"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {isOnline ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400">Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {!isInstalled && (
                  <div className="mt-6">
                    {deferredPrompt ? (
                      <Button onClick={handleInstall} className="w-full" size="lg">
                        <Download className="w-5 h-5 mr-2" />
                        Install App
                      </Button>
                    ) : isIOS ? (
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-sm font-medium mb-3">
                          To install on iOS:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                              1
                            </span>
                            <span>
                              Tap the <Share className="w-4 h-4 inline" /> Share
                              button
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                              2
                            </span>
                            <span>
                              Select <Plus className="w-4 h-4 inline" /> "Add to
                              Home Screen"
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                              3
                            </span>
                            <span>Tap "Add" to confirm</span>
                          </li>
                        </ol>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted text-center">
                        <p className="text-sm text-muted-foreground">
                          Use Chrome, Edge, or Safari to install this app
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="font-heading text-2xl font-bold text-center mb-8">
              Why Install?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <Card key={idx} className="hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Device Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mt-12 text-center"
          >
            <h2 className="font-heading text-xl font-bold mb-4">
              Works on All Devices
            </h2>
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Smartphone className="w-8 h-8 text-primary" />
                <span className="text-sm text-muted-foreground">Mobile</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Monitor className="w-8 h-8 text-primary" />
                <span className="text-sm text-muted-foreground">Desktop</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
