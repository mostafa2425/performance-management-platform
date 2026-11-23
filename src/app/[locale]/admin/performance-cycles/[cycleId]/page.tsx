import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import ApiPerformanceCycleWorkspace from "@/features/api/performance-cycle-workspace";

type Props = { params: Promise<{ cycleId: string }> };

export default async function Page({ params }: Props) {
  const { cycleId } = await params;
  const t = await getTranslations("PerformanceCycles");
  return (
    <AppShell
      role="admin"
      title={t("pages.detailTitle")}
      subtitle={t("pages.detailSubtitle")}
      backHref="/admin/performance-cycles"
    >
      <ApiPerformanceCycleWorkspace mode="detail" cycleId={cycleId} />
    </AppShell>
  );
}
