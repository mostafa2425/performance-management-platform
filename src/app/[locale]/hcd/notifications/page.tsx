import { AppShell } from "@/components/layout/app-shell";
import { NotificationsWorkspace } from "@/features/notifications/notification-workspaces";
export default function Page(){return <AppShell role="hcd" title="Notifications" subtitle="Organization-wide performance governance updates."><NotificationsWorkspace role="hcd"/></AppShell>}