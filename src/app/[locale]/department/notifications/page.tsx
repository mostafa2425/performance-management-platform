import { AppShell } from "@/components/layout/app-shell";
import { NotificationsWorkspace } from "@/features/notifications/notification-workspaces";
export default function Page(){return <AppShell role="department" title="Notifications" subtitle="Performance cycle updates in your department scope."><NotificationsWorkspace role="department"/></AppShell>}