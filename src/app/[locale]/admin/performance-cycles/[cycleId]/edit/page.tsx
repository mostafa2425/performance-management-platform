import PerformanceCycleWorkspace from "@/features/admin/performance-cycle-workspace";

export default async function EditPerformanceCyclePage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  return <PerformanceCycleWorkspace mode="edit" cycleId={cycleId} />;
}
