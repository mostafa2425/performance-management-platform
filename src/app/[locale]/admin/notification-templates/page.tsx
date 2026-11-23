import { AppShell } from "@/components/layout/app-shell";
import { ApiNotificationTemplatesWorkspace } from "@/features/api/notification-templates-workspace";
export default function Page(){return <AppShell role="admin" title="Notification templates" subtitle="Manage predefined bilingual notification content."><ApiNotificationTemplatesWorkspace/></AppShell>;}
