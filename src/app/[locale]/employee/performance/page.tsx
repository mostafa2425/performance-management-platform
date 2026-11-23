import { AppShell } from "@/components/layout/app-shell";
import ApiEmployeeResultsWorkspace from "@/features/api/employee-results-workspace";
export default function Page(){return <AppShell role="employee" title="My performance" subtitle="View your finalized and published performance results."><ApiEmployeeResultsWorkspace/></AppShell>;}
