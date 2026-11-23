import { AppShell } from "@/components/layout/app-shell";
import ApiAdminFinalReviewWorkspace from "@/features/api/admin-final-review-workspace";
export default function Page(){return <AppShell role="admin" title="Final group review" subtitle="Review manager groups and approve or return submitted evaluations."><ApiAdminFinalReviewWorkspace/></AppShell>;}
