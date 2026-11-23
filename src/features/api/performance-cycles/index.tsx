"use client";

import { CycleCreate } from "./cycle-create";
import { CycleDetail } from "./cycle-detail";
import { CycleList } from "./cycle-list";
import { CycleStageEditor } from "./cycle-stage-editor";

export default function ApiPerformanceCycleWorkspace({
  mode,
  cycleId,
}: {
  mode: "list" | "create" | "detail" | "edit";
  cycleId?: string;
}) {
  if (mode === "create") return <CycleCreate />;
  if (mode === "edit") return <CycleStageEditor cycleId={cycleId!} />;
  if (mode === "detail") return <CycleDetail cycleId={cycleId!} />;
  return <CycleList />;
}

export { CycleCreate } from "./cycle-create";
export { CycleDetail } from "./cycle-detail";
export { CycleList } from "./cycle-list";
export { CycleScopePanel } from "./cycle-scope-panel";
export { CycleEligibilityPreview, EligibilityStatusTag } from "./cycle-eligibility-preview";
export { CycleNotIncludedPanel } from "./cycle-not-included-panel";
export { CycleProgressPanel } from "./cycle-progress-panel";
export { CycleStageEditor } from "./cycle-stage-editor";
export { CycleTimeline } from "./cycle-timeline";
export { CycleStagesTable } from "./cycle-stages-table";
export { CycleStatusTag, CycleYearTag } from "./cycle-status-tag";
export { CycleScopeSummaryCards, CyclePreviewSummaryCards } from "./cycle-summary-cards";
export { OptionsMultiSelect } from "./options-multi-select";
