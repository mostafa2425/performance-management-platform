import { AppShell } from "@/components/layout/app-shell";
import ApiPerformanceCycleWorkspace from "@/features/api/performance-cycle-workspace";
type Props={params:Promise<{cycleId:string}>};
export default async function Page({params}:Props){const {cycleId}=await params;return <AppShell role="admin" title="Manage performance cycle" subtitle="Review cycle status, scope and eligibility before activation."><ApiPerformanceCycleWorkspace mode="detail" cycleId={cycleId}/></AppShell>;}
