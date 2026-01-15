import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TestNotification() {
  const { permission, requestPermission, showNotification, isSupported } = usePushNotifications();
  const { toast } = useToast();

  const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
  const hasNotificationAPI = "Notification" in window;
  const hasServiceWorker = "serviceWorker" in navigator;

  const handleTestNotification = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      await showNotification("Test Notification", {
        body: "This is a test notification with sound and vibration!",
        tag: "test-notification",
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: false,
        data: {
          link: window.location.href,
        },
      });

      toast({
        title: "Notification Sent",
        description: "Check your device notification panel!",
      });
    } catch (error) {
      console.error("Test notification error:", error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Diagnostics */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {isSecureContext ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span>HTTPS: {isSecureContext ? "✓ Enabled" : "✗ Required"}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasNotificationAPI ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span>Notification API: {hasNotificationAPI ? "✓ Available" : "✗ Not Available"}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasServiceWorker ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span>Service Worker: {hasServiceWorker ? "✓ Supported" : "✗ Not Supported"}</span>
        </div>
        <div className="flex items-center gap-2">
          {permission === "granted" ? (
            <Bell className="w-4 h-4 text-green-500" />
          ) : (
            <BellOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span>Permission: <strong>{permission}</strong></span>
        </div>
      </div>

      {/* Warning for HTTP */}
      {!isSecureContext && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>HTTPS Required</AlertTitle>
          <AlertDescription>
            Notifications require a secure connection. Please access this site via HTTPS.
            <br />
            <span className="text-xs mt-1 block">
              Current: {window.location.protocol}//{window.location.host}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {isSupported ? (
        <>
          {permission === "granted" ? (
            <Button onClick={handleTestNotification} className="w-full">
              Send Test Notification
            </Button>
          ) : (
            <Button onClick={requestPermission} className="w-full">
              Enable Notifications
            </Button>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ Notification will appear in your device panel</p>
            <p>✓ Sound will play (if not muted)</p>
            <p>✓ Device will vibrate (on mobile)</p>
          </div>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Supported</AlertTitle>
          <AlertDescription>
            {!isSecureContext 
              ? "Please access this site via HTTPS to enable notifications."
              : "Your browser doesn't support notifications."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
