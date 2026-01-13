import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationSettings as NotificationSettingsComponent } from "@/components/notifications/NotificationSettings";

export default function NotificationSettings() {
  return (
    <DashboardLayout>
      <NotificationSettingsComponent />
    </DashboardLayout>
  );
}
