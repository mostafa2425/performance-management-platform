import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import ApiPerformanceCycleWorkspace from "@/features/api/performance-cycle-workspace";

export default async function Page() {
  const t = await getTranslations("PerformanceCycles");
  return (
    <AppShell role="admin" title={t("pages.listTitle")} subtitle={t("pages.listSubtitle")}>
      <ApiPerformanceCycleWorkspace mode="list" />
    </AppShell>
  );
}
