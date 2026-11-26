export const stageKeys = [
  "goal_setting",
  "employee_review",
  "active_performance",
  "manager_evaluation",
  "admin_final_review",
] as const;

export type StageKey = (typeof stageKeys)[number];

type TranslateFn = {
  (key: string, values?: Record<string, string | number>): string;
};

export function bilingual(value: unknown, ar: boolean): string {
  if (!value) return "—";
  if (typeof value === "object" && value !== null) {
    const v = value as { ar?: string; en?: string };
    return ar ? v.ar || v.en || "—" : v.en || v.ar || "—";
  }
  return String(value);
}

export function statusColor(status?: string) {
  if (status === "active") return "green";
  if (status === "draft") return "blue";
  if (status === "closed") return "default";
  return "default";
}

export function yearTagColor() {
  return "geekblue";
}

export function statusLabel(t: TranslateFn, status?: string | null) {
  if (!status) return t("status.unknown");
  if (status === "draft" || status === "active" || status === "closed") {
    return t(`status.${status}`);
  }
  return status;
}

export function stageLabel(t: TranslateFn, key: string) {
  if ((stageKeys as readonly string[]).includes(key)) {
    return t(`stages.${key as StageKey}.label`);
  }
  return key;
}

export function stageHint(t: TranslateFn, key: string) {
  if ((stageKeys as readonly string[]).includes(key)) {
    return t(`stages.${key as StageKey}.hint`);
  }
  return undefined;
}

export function yearBounds() {
  const current = new Date().getFullYear();
  return { min: current - 1, max: current + 2 };
}

/** Compare YYYY-MM-DD strings; returns negative / 0 / positive. */
export function compareDate(a?: string | null, b?: string | null) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

export const PLAN_DISPLAY_STATUS: Record<string, { color: string }> = {
  not_started: { color: "default" },
  draft: { color: "blue" },
  pending_admin_approval: { color: "gold" },
  returned_to_manager: { color: "orange" },
  pending_employee_review: { color: "purple" },
  goals_approved: { color: "green" },
};

export const planStatusKeys = Object.keys(PLAN_DISPLAY_STATUS);

export type StageTimelineStatus = "completed" | "current" | "upcoming";

export type StageRow = {
  stage: string;
  position?: number;
  deadline_date?: string | null;
  cutoff_at?: string | null;
  processed_at?: string | null;
};

function todayString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function stageIndex(stages: StageRow[], key?: string | null) {
  if (!key) return -1;
  return stages.findIndex((s) => s.stage === key);
}

export function stageTimelineStatus(
  stage: StageRow,
  stages: StageRow[],
  cycle?: { status?: string | null; current_stage?: string | null } | null,
): StageTimelineStatus {
  if (stage.processed_at) return "completed";
  if (cycle?.status === "closed") return "completed";
  if (cycle?.status !== "active") return "upcoming";

  const idx = stageIndex(stages, stage.stage);
  const currentIdx = stageIndex(stages, cycle?.current_stage);
  if (currentIdx >= 0) {
    if (idx < currentIdx) return "completed";
    if (idx === currentIdx) return "current";
    return "upcoming";
  }

  const today = todayString();
  const firstOpen = stages.findIndex(
    (s) => !s.processed_at && (!s.deadline_date || compareDate(s.deadline_date, today) >= 0),
  );
  if (firstOpen < 0) return "completed";
  if (idx < firstOpen) return "completed";
  return idx === firstOpen ? "current" : "upcoming";
}

export const timelineStatusColor: Record<StageTimelineStatus, string> = {
  completed: "green",
  current: "blue",
  upcoming: "default",
};

function isBilingual(value: unknown): value is { ar?: string; en?: string } {
  return (
    !!value &&
    typeof value === "object" &&
    ("ar" in (value as object) || "en" in (value as object)) &&
    !("cycle_id" in (value as object)) &&
    !("cycle_name" in (value as object))
  );
}

export function reasonText(reason: unknown, ar = false): string {
  if (reason == null || reason === "") return "—";
  if (typeof reason === "string") return reason;
  if (Array.isArray(reason)) {
    const parts = reason
      .map((r) => (r === "—" ? "" : reasonText(r, ar)))
      .filter((r) => r && r !== "—");
    return parts.length ? parts.join(", ") : "—";
  }
  if (typeof reason === "object") {
    const r = reason as Record<string, unknown>;
    if (r.category_name != null) {
      const categoryName = bilingual(r.category_name, ar);
      if (categoryName !== "—") return categoryName;
    }
    if (typeof r.message === "string") return r.message;
    if (typeof r.reason === "string") return r.reason;
    if (typeof r.code === "string") return r.code;
    if (r.cycle_name != null || r.cycle_id != null) {
      const name = bilingual(r.cycle_name, ar);
      if (name !== "—") return name;
      if (r.cycle_id != null) return `#${r.cycle_id}`;
    }
    if (isBilingual(reason)) return bilingual(reason, ar);
    const parts = Object.entries(r)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => {
        if (isBilingual(v)) return `${k}: ${bilingual(v, ar)}`;
        if (v && typeof v === "object") return `${k}: ${reasonText(v, ar)}`;
        return `${k}: ${String(v)}`;
      });
    return parts.length ? parts.join(", ") : "—";
  }
  return String(reason);
}

export function countFromScope(scope?: Record<string, unknown> | null) {
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return {
    departments: len(scope?.departments),
    jobTitles: len(scope?.job_titles),
    employees: len(scope?.employees),
    excluded: len(scope?.excluded_employees),
  };
}

/** Normalizes the various preview payload shapes into a candidate array. */
export function previewCandidates(preview: any): any[] {
  if (!preview) return [];
  const candidates = [
    preview.candidates,
    preview.data?.candidates,
    preview.members,
    preview.data?.members,
    preview.data,
    preview,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

export const previewQueryKey = (cycleId: string) => ["admin", "cycles", cycleId, "preview"] as const;

export function previewManagersCount(preview: any, rows: any[]): number | null {
  const summary = preview?.summary ?? preview?.data?.summary;
  const fromSummary = summary?.managers ?? summary?.managers_count ?? summary?.manager_count;
  if (typeof fromSummary === "number") return fromSummary;
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.status && r.status !== "included") continue;
    const id = r.manager_id ?? r.current_manager_id ?? r.manager?.id;
    if (id != null) ids.add(String(id));
  }
  return ids.size ? ids.size : null;
}

export function candidateName(row: any, ar: boolean) {
  return bilingual(row?.name || row?.employee?.name || row?.employee?.full_name || row?.full_name, ar);
}

export function candidateEmployeeId(row: any): number | undefined {
  const id = row?.employee_id ?? row?.employee?.id ?? row?.id;
  return id == null ? undefined : Number(id);
}

export const ELIGIBILITY_STATUS_COLOR: Record<string, string> = {
  included: "green",
  under_6_months: "orange",
  in_other_active_cycle: "red",
  excluded: "volcano",
  excluded_rule: "volcano",
  excluded_by_scope: "default",
  removed: "default",
  missed: "red",
};
