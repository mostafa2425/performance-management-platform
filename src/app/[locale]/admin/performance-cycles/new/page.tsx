import { AppShell } from "@/components/layout/app-shell";
import ApiPerformanceCycleWorkspace from "@/features/api/performance-cycle-workspace";
export default function Page(){return <AppShell role="admin" title="Create performance cycle" subtitle="Set cycle dates, stage deadlines and employee scope."><ApiPerformanceCycleWorkspace mode="create"/></AppShell>;}
