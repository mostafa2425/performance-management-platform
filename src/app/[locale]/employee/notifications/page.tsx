import { AppShell } from "@/components/layout/app-shell";
import { NotificationsWorkspace } from "@/features/notifications/notification-workspaces";
export default function Page(){return <AppShell role="employee" title="Notifications" subtitle="Updates and actions related to your performance cycle."><NotificationsWorkspace role="employee"/></AppShell>}