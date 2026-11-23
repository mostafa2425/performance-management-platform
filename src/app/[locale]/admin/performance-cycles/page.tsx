import { AppShell } from "@/components/layout/app-shell";
import ApiPerformanceCycleWorkspace from "@/features/api/performance-cycle-workspace";
export default function Page(){return <AppShell role="admin" title="Performance cycles" subtitle="Configure and manage annual performance cycles."><ApiPerformanceCycleWorkspace mode="list"/></AppShell>;}
