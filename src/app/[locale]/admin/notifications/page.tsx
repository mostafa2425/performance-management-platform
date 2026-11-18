import { AppShell } from "@/components/layout/app-shell";
import { NotificationsWorkspace } from "@/features/notifications/notification-workspaces";
export default function Page(){return <AppShell role="admin" title="Notifications" subtitle="Administration alerts and workflow actions."><NotificationsWorkspace role="admin"/></AppShell>}