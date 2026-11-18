import { AppShell } from "@/components/layout/app-shell";
import { NotificationTemplatesWorkspace } from "@/features/notifications/notification-workspaces";
export default function Page(){return <AppShell role="admin" title="Notification templates" subtitle="Manage predefined bilingual notification content."><NotificationTemplatesWorkspace/></AppShell>}