import { AppShell } from "@/components/layout/app-shell";
import { NotificationsWorkspace } from "@/features/notifications/notification-workspaces";
export default function Page(){return <AppShell role="manager" title="Notifications" subtitle="Team workflow updates and pending actions."><NotificationsWorkspace role="manager"/></AppShell>}