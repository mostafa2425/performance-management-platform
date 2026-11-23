import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import ApiPerformanceCycleWorkspace from "@/features/api/performance-cycle-workspace";

export default async function EditPerformanceCyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const t = await getTranslations("PerformanceCycles");
  return (
    <AppShell
      role="admin"
      title={t("pages.editTitle")}
      subtitle={t("pages.editSubtitle")}
      backHref={`/admin/performance-cycles/${cycleId}`}
    >
      <ApiPerformanceCycleWorkspace mode="edit" cycleId={cycleId} />
    </AppShell>
  );
}
