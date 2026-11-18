import PerformanceCycleWorkspace from "@/features/admin/performance-cycle-workspace";

type Props = { params: Promise<{ cycleId: string }> };
export default async function Page({ params }: Props) {
  const { cycleId } = await params;
  return <PerformanceCycleWorkspace mode="detail" cycleId={cycleId} />;
}
