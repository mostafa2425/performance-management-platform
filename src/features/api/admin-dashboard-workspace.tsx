"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { adminApi, cyclesApi, employeesApi, resultsApi } from "@/lib/api/endpoints";
import type { ApiEmployee } from "@/lib/api/types";

type AnyRecord = {
  [key: string]: unknown;
  id?: number | string;
  employee_id?: number | string;
  manager_id?: number | string;
  current_manager_id?: number | string | null;
  plan_id?: number | string | null;
  status?: string | { key?: string; label?: string };
  finalized_at?: string | null;
  cycle_id?: number | string;
  employee?: {
    id?: number | string;
    code?: string;
    name?: string;
    full_name?: string;
    department_id?: number | string;
    line_manager_id?: number | string | null;
  };
  manager?: { id?: number | string };
  cycle?: { id?: number | string; status?: string };
  reason?: unknown;
};
type StatusKey =
  | "not_started"
  | "no_plan_yet"
  | "draft"
  | "pending_admin_approval"
  | "pending_employee_review"
  | "returned_to_manager"
  | "goals_approved"
  | "active_performance"
  | "evaluation_in_progress"
  | "pending_final_approval"
  | "finalized";

type CycleApiRecord = AnyRecord & {
  id: number;
  name: unknown;
  performance_year: number;
  start_date: string;
  end_date: string;
  status: string;
  current_stage?: string | null;
  activated_at?: string | null;
};

type ExclusionRecord = {
  employee: ApiEmployee;
  cycle: DashboardCycle;
  joiningDate: string;
  eligibleFrom: string;
};

type DashboardCycle = {
  id: number;
  name: unknown;
  performance_year: number;
  start_date: string;
  end_date: string;
  activated_at?: string | null;
  current_stage?: string | null;
  members: AnyRecord[];
  groups: AnyRecord[];
  evaluations: Map<number, string>;
  evaluationRestricted: boolean;
  evaluationFailed?: boolean;
};

type ManagerRow = {
  key: number;
  manager: ApiEmployee | null;
  managerId: number;
  employees: ApiEmployee[];
  counts: Record<StatusKey, number>;
  total: number;
};

type DashboardData = {
  employees: ApiEmployee[];
  cycles: DashboardCycle[];
  results: AnyRecord[];
  exclusions: ExclusionRecord[];
  evaluationIncomplete: boolean;
  eligibilityIncomplete: boolean;
};

const STATUS_KEYS: StatusKey[] = [
  "not_started",
  "no_plan_yet",
  "draft",
  "pending_admin_approval",
  "pending_employee_review",
  "returned_to_manager",
  "goals_approved",
  "active_performance",
  "evaluation_in_progress",
  "pending_final_approval",
  "finalized",
];

function rowsFrom<T = AnyRecord>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

async function fetchAllPages<T>(
  request: (page: number) => Promise<unknown>,
): Promise<T[]> {
  const first = await request(1);
  const all = rowsFrom<T>(first);
  const meta = first && typeof first === "object" && "meta" in first
    ? (first as { meta?: { last_page?: unknown } }).meta
    : undefined;
  const lastPage = Math.max(1, Number(meta?.last_page || 1));
  if (lastPage <= 1) return all;
  const remaining = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) => request(index + 2)),
  );
  return all.concat(...remaining.map((page) => rowsFrom<T>(page)));
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function asId(value: unknown): number | null {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function bilingual(value: unknown, locale: string): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record[locale] || record.en || record.ar || "—");
  }
  return String(value);
}

function emptyCounts(): Record<StatusKey, number> {
  return {
    not_started: 0,
    no_plan_yet: 0,
    draft: 0,
    pending_admin_approval: 0,
    pending_employee_review: 0,
    returned_to_manager: 0,
    goals_approved: 0,
    active_performance: 0,
    evaluation_in_progress: 0,
    pending_final_approval: 0,
    finalized: 0,
  };
}

function addMonths(dateValue: string, months: number): string {
  const date = new Date(dateValue + "T12:00:00");
  date.setMonth(date.getMonth() + months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getCycleName(cycle: DashboardCycle, locale: string): string {
  return bilingual(cycle.name, locale);
}

function managerIdForGroup(group: AnyRecord): number | null {
  return asId(group?.manager?.id ?? group?.manager_id);
}

function getMemberEmployeeId(member: AnyRecord): number | null {
  return asId(member?.employee?.id ?? member?.employee_id);
}

function getEmployeeStatus(
  employeeId: number,
  membership: { cycle: DashboardCycle; member: AnyRecord } | undefined,
  finalizedEmployeeIds: Set<number>,
): StatusKey {
  if (!membership) return "not_started";
  const { cycle, member } = membership;
  const displayStatus = typeof member?.status === "object" ? member.status?.key || "" : String(member?.status || "");
  const managerId = asId(member?.current_manager_id ?? member?.manager_id);
  const group = cycle.groups.find((item) => managerIdForGroup(item) === managerId);
  const groupStatus = String(group?.status || "");
  const evaluationStatus = cycle.evaluations.get(employeeId);

  if (finalizedEmployeeIds.has(employeeId) || groupStatus === "approved") return "finalized";
  if (groupStatus === "pending_admin") return "pending_final_approval";

  if (displayStatus === "not_started" || !member?.plan_id) return "no_plan_yet";
  if (displayStatus === "draft") return "draft";
  if (displayStatus === "pending_admin") return "pending_admin_approval";
  if (displayStatus === "pending_employee") return "pending_employee_review";
  if (displayStatus === "returned") return "returned_to_manager";

  if (displayStatus === "approved") {
    if (cycle.current_stage === "active_performance") return "active_performance";
    if (
      cycle.current_stage === "manager_evaluation" ||
      cycle.current_stage === "admin_final_review"
    ) {
      if (evaluationStatus === "complete" && groupStatus === "pending_admin") {
        return "pending_final_approval";
      }
      return "evaluation_in_progress";
    }
    return "goals_approved";
  }

  if (evaluationStatus === "complete") return "evaluation_in_progress";
  return "no_plan_yet";
}

function stageLabel(stage: string | null | undefined, t: (key: string) => string): string {
  const key = String(stage || "").toLowerCase();
  const map: Record<string, string> = {
    goal_setting: "stageGoalSetting",
    employee_review: "stageEmployeeReview",
    active_performance: "stageActivePerformance",
    manager_evaluation: "stageManagerEvaluation",
    admin_final_review: "stageAdminFinalReview",
  };
  return map[key] ? t(map[key]) : stage || "—";
}

function progressForCycle(cycle: DashboardCycle, finalizedIds: Set<number>) {
  const total = cycle.members.length;
  if (!total) return { percent: 0, done: 0, total: 0, labelKey: "cycleProgress" };

  let done = 0;
  let labelKey = "cycleProgress";
  if (cycle.current_stage === "goal_setting") {
    labelKey = "plansSubmitted";
    done = cycle.members.filter((member) =>
      ["pending_admin", "pending_employee", "approved"].includes(
        typeof member.status === "object" ? member.status?.key || "" : String(member.status || ""),
      ),
    ).length;
  } else if (cycle.current_stage === "employee_review") {
    labelKey = "plansApproved";
    done = cycle.members.filter((member) => (typeof member.status === "object" ? member.status?.key : member.status) === "approved").length;
  } else if (cycle.current_stage === "active_performance") {
    labelKey = "approvedPlans";
    done = cycle.members.filter((member) => (typeof member.status === "object" ? member.status?.key : member.status) === "approved").length;
  } else if (cycle.current_stage === "manager_evaluation") {
    labelKey = "evaluationsCompleted";
    done = cycle.members.filter((member) => {
      const employeeId = getMemberEmployeeId(member);
      const managerId = asId(member.current_manager_id ?? member.manager_id);
      const group = cycle.groups.find((item) => managerIdForGroup(item) === managerId);
      return (
        (employeeId != null && cycle.evaluations.get(employeeId) === "complete") ||
        group?.status === "pending_admin" ||
        group?.status === "approved" ||
        (employeeId != null && finalizedIds.has(employeeId))
      );
    }).length;
  } else if (cycle.current_stage === "admin_final_review") {
    labelKey = "submittedForFinalReview";
    done = cycle.members.filter((member) => {
      const employeeId = getMemberEmployeeId(member);
      const managerId = asId(member.current_manager_id ?? member.manager_id);
      const group = cycle.groups.find((item) => managerIdForGroup(item) === managerId);
      return (
        group?.status === "pending_admin" ||
        group?.status === "approved" ||
        (employeeId != null && finalizedIds.has(employeeId))
      );
    }).length;
  }

  return {
    percent: Math.round((done / total) * 100),
    done,
    total,
    labelKey,
  };
}

async function loadAdminDashboard(): Promise<DashboardData> {
  const [employees, activeCycles, results] = await Promise.all([
    fetchAllPages<ApiEmployee>((page) =>
      employeesApi.list({ page, per_page: 100, sort: "id" }),
    ),
    fetchAllPages<CycleApiRecord>((page) =>
      cyclesApi.adminList({ page, per_page: 100, "filter[status]": "active" }),
    ),
    resultsApi.list(),
  ]);

  const cycleDetails = await mapConcurrent(activeCycles, 5, async (cycle) => {
    const [detail, members, groups] = await Promise.all([
      cyclesApi.adminGet(cycle.id).catch(() => cycle),
      fetchAllPages<AnyRecord>((page) =>
        cyclesApi.planStatus(cycle.id, { page, per_page: 100 }),
      ),
      fetchAllPages<AnyRecord>((page) =>
        adminApi.groups(cycle.id, { page, per_page: 100 }),
      ),
    ]);

    const normalizedMembers = members.map((member) => ({
      ...member,
      current_manager_id:
        member.current_manager_id ?? member.manager_id ?? member.employee?.line_manager_id ?? null,
    }));
    const managerIds = Array.from(
      new Set(
        normalizedMembers
          .map((member) => asId(member.current_manager_id))
          .filter((id): id is number => id != null),
      ),
    );

    const evaluations = new Map<number, string>();
    let evaluationRestricted = false;
    let evaluationFailed = false;
    const stage = detail.current_stage || cycle.current_stage;

    if (stage === "manager_evaluation" || stage === "admin_final_review") {
      await mapConcurrent(managerIds, 6, async (managerId) => {
        try {
          const response = await cyclesApi.teamEvaluations(cycle.id, managerId);
          for (const row of rowsFrom<AnyRecord>(response)) {
            const employeeId = getMemberEmployeeId(row);
            if (employeeId != null && row.status) evaluations.set(employeeId, String(row.status));
          }
        } catch (error: unknown) {
          const apiError = error as { status?: number; response?: { status?: number } };
          if (apiError?.status === 403 || apiError?.response?.status === 403) {
            evaluationRestricted = true;
          } else {
            evaluationFailed = true;
          }
        }
      });
    }

    return {
      ...detail,
      ...cycle,
      current_stage: detail.current_stage || cycle.current_stage || null,
      activated_at: detail.activated_at || cycle.activated_at || null,
      members: normalizedMembers,
      groups,
      evaluations,
      evaluationRestricted,
      evaluationFailed,
    } as DashboardCycle & { evaluationFailed?: boolean };
  });

  const activeCycleIds = new Set(cycleDetails.map((cycle) => Number(cycle.id)));
  const finalizedEmployeeIds = new Set<number>();
  for (const result of rowsFrom<AnyRecord>(results)) {
    const cycleId = asId(result?.cycle?.id ?? result?.cycle_id);
    const employeeId = asId(result?.employee?.id ?? result?.employee_id);
    if (
      employeeId != null &&
      cycleId != null &&
      activeCycleIds.has(cycleId) &&
      result.finalized_at
    ) {
      finalizedEmployeeIds.add(employeeId);
    }
  }

  const memberships = new Map<number, { cycle: DashboardCycle; member: AnyRecord }>();
  for (const cycle of cycleDetails) {
    for (const member of cycle.members) {
      const employeeId = getMemberEmployeeId(member);
      if (employeeId != null && !memberships.has(employeeId)) {
        memberships.set(employeeId, { cycle, member });
      }
    }
  }

  const exclusionCandidates: Array<{ cycle: DashboardCycle; employee: ApiEmployee }> = [];
  for (const cycle of cycleDetails) {
    if (!cycle.activated_at) continue;
    const referenceDate = String(cycle.activated_at).slice(0, 10);
    const sixMonthCutoff = addMonths(referenceDate, -6);
    const memberIds = new Set(cycle.members.map(getMemberEmployeeId).filter(Boolean));
    for (const employee of employees) {
      if (!employee.joining_date || memberIds.has(Number(employee.id))) continue;
      if (employee.joining_date > sixMonthCutoff && employee.joining_date <= referenceDate) {
        exclusionCandidates.push({ cycle, employee });
      }
    }
  }

  let eligibilityIncomplete = false;
  const exclusions = (
    await mapConcurrent(exclusionCandidates, 6, async ({ cycle, employee }): Promise<ExclusionRecord | null> => {
      try {
        const referenceDate = String(cycle.activated_at).slice(0, 10);
        const eligibility = await adminApi.employeeEligibility(Number(employee.id), referenceDate);
        if (eligibility?.status !== "under_6_months") return null;
        const reasonValue = eligibility.reason;
        const reason = (Array.isArray(reasonValue)
          ? reasonValue[0]
          : reasonValue) as Record<string, unknown> | null | undefined;
        return {
          employee,
          cycle,
          joiningDate:
            (typeof reason?.joining_date === "string" ? reason.joining_date : employee.joining_date) || "",
          eligibleFrom:
            typeof reason?.eligible_from === "string"
              ? reason.eligible_from
              : addMonths(employee.joining_date || referenceDate, 6),
        };
      } catch {
        eligibilityIncomplete = true;
        return null;
      }
    })
  ).filter((row): row is ExclusionRecord => row !== null);

  return {
    employees,
    cycles: cycleDetails,
    results: rowsFrom<AnyRecord>(results),
    exclusions,
    evaluationIncomplete: cycleDetails.some((cycle) => cycle.evaluationRestricted || cycle.evaluationFailed),
    eligibilityIncomplete,
  };
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return '"' + text.replace(/"/g, '""') + '"';
}

function downloadCsv(filename: string, rows: Array<Array<unknown>>) {
  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminDashboardWorkspace() {
  const locale = useLocale();
  const t = useTranslations("AdminDashboard");
  const { user, isReady, isAuthenticated } = useAuthSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [businessUnitId, setBusinessUnitId] = useState<number | undefined>();
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [status, setStatus] = useState<StatusKey | undefined>();
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);

  const dashboard = useQuery({
    queryKey: ["admin", "dashboard", locale],
    queryFn: loadAdminDashboard,
    enabled: isReady && isAuthenticated && Boolean(user?.roles?.admin),
    staleTime: 30_000,
  });

  const data = dashboard.data;
  const employees = useMemo(() => data?.employees || [], [data?.employees]);
  const cycles = useMemo(() => data?.cycles || [], [data?.cycles]);
  const finalizedEmployeeIds = useMemo(() => {
    const cycleIds = new Set(cycles.map((cycle) => Number(cycle.id)));
    const ids = new Set<number>();
    for (const result of data?.results || []) {
      const resultCycleId = asId(result?.cycle?.id ?? result?.cycle_id);
      const employeeId = asId(result?.employee?.id ?? result?.employee_id);
      if (employeeId != null && resultCycleId != null && cycleIds.has(resultCycleId) && result.finalized_at) {
        ids.add(employeeId);
      }
    }
    return ids;
  }, [cycles, data?.results]);

  const membershipByEmployee = useMemo(() => {
    const map = new Map<number, { cycle: DashboardCycle; member: AnyRecord }>();
    for (const cycle of cycles) {
      for (const member of cycle.members) {
        const employeeId = getMemberEmployeeId(member);
        if (employeeId != null && !map.has(employeeId)) map.set(employeeId, { cycle, member });
      }
    }
    return map;
  }, [cycles]);

  const statusByEmployee = useMemo(() => {
    const map = new Map<number, StatusKey>();
    for (const employee of employees) {
      map.set(
        Number(employee.id),
        getEmployeeStatus(
          Number(employee.id),
          membershipByEmployee.get(Number(employee.id)),
          finalizedEmployeeIds,
        ),
      );
    }
    return map;
  }, [employees, membershipByEmployee, finalizedEmployeeIds]);

  const summary = useMemo(() => {
    const counts = emptyCounts();
    for (const employee of employees) {
      const statusKey = statusByEmployee.get(Number(employee.id));
      if (statusKey) counts[statusKey] += 1;
    }
    return counts;
  }, [employees, statusByEmployee]);

  const businessUnitOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const employee of employees) {
      const id = asId(employee.business_unit?.id);
      if (id != null) map.set(id, employee.business_unit?.name || "#" + id);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [employees]);

  const departmentOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const employee of employees) {
      const id = asId(employee.department?.id);
      if (id != null) map.set(id, employee.department?.name || "#" + id);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [employees]);

  const managerRows = useMemo(() => {
    const employeeById = new Map(employees.map((employee) => [Number(employee.id), employee]));
    const byManager = new Map<number, ApiEmployee[]>();

    for (const employee of employees) {
      const managerId = asId(employee.line_manager_id);
      if (managerId == null) continue;
      const employeeCycle = membershipByEmployee.get(Number(employee.id));
      if (cycleId != null && Number(employeeCycle?.cycle.id) !== cycleId) continue;
      if (businessUnitId != null && Number(employee.business_unit?.id) !== businessUnitId) continue;
      if (departmentId != null && Number(employee.department?.id) !== departmentId) continue;

      const employeeStatus = statusByEmployee.get(Number(employee.id));
      if (status && employeeStatus !== status) continue;

      const current = byManager.get(managerId) || [];
      current.push(employee);
      byManager.set(managerId, current);
    }

    const rows: ManagerRow[] = [];
    for (const [managerId, managerEmployees] of byManager) {
      const manager = employeeById.get(managerId) || null;
      const counts = emptyCounts();
      for (const employee of managerEmployees) {
        const key = statusByEmployee.get(Number(employee.id));
        if (key) counts[key] += 1;
      }
      rows.push({
        key: managerId,
        manager,
        managerId,
        employees: managerEmployees,
        counts,
        total: managerEmployees.length,
      });
    }

    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (!query) return true;
        const manager = row.manager;
        const haystack = [
          manager?.full_name,
          manager?.code,
          manager?.email,
          manager?.id,
          row.managerId,
        ]
          .filter((value) => value != null)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) =>
        String(a.manager?.full_name || a.managerId).localeCompare(
          String(b.manager?.full_name || b.managerId),
        ),
      );
  }, [
    employees,
    membershipByEmployee,
    statusByEmployee,
    cycleId,
    businessUnitId,
    departmentId,
    status,
    search,
  ]);

  const selectedManager = managerRows.find((row) => row.managerId === selectedManagerId);
  const selectedManagerEmployees = selectedManager?.employees || [];

  const cycleOptions = cycles.map((cycle) => ({
    value: Number(cycle.id),
    label: getCycleName(cycle, locale) + " · " + cycle.performance_year,
  }));

  const statusOptions = STATUS_KEYS.map((key) => ({
    value: key,
    label: t("status." + key),
  }));

  const exportManagerProgress = () => {
    const headers = [
      t("managerName"),
      t("managerEmployeeId"),
      t("jobTitle"),
      t("businessUnit"),
      t("department"),
      t("totalEmployees"),
      ...STATUS_KEYS.map((key) => t("status." + key)),
    ];
    const body = managerRows.map((row) => [
      row.manager?.full_name || "—",
      row.manager?.code || row.managerId,
      row.manager?.job_title?.name || "—",
      row.manager?.business_unit?.name || "—",
      row.manager?.department?.name || "—",
      row.total,
      ...STATUS_KEYS.map((key) => row.counts[key]),
    ]);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv("admin-manager-progress-" + date + ".csv", [headers, ...body]);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value.slice(0, 10) + "T00:00:00");
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };

  const statusColor: Record<StatusKey, string> = {
    not_started: "default",
    no_plan_yet: "default",
    draft: "blue",
    pending_admin_approval: "gold",
    pending_employee_review: "purple",
    returned_to_manager: "orange",
    goals_approved: "cyan",
    active_performance: "green",
    evaluation_in_progress: "processing",
    pending_final_approval: "warning",
    finalized: "success",
  };

  const employeeColumns = [
    {
      title: t("employeeName"),
      render: (_: unknown, employee: ApiEmployee) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{employee.full_name}</Typography.Text>
          <Typography.Text type="secondary">{employee.email || "—"}</Typography.Text>
        </Space>
      ),
    },
    { title: t("employeeId"), dataIndex: "code", width: 120, render: (value: string) => value || "—" },
    { title: t("jobTitle"), render: (_: unknown, employee: ApiEmployee) => employee.job_title?.name || "—" },
    { title: t("department"), render: (_: unknown, employee: ApiEmployee) => employee.department?.name || "—" },
    {
      title: t("statusLabel"),
      render: (_: unknown, employee: ApiEmployee) => {
        const key = statusByEmployee.get(Number(employee.id)) || "not_started";
        return <Tag color={statusColor[key]}>{t("status." + key)}</Tag>;
      },
    },
  ];

  const loading = !isReady || dashboard.isLoading;
  const error = dashboard.error as Error | null;

  return (
    <AppShell role="admin">
      <Space orientation="vertical" size={20} style={{ width: "100%" }}>
        <Row justify="end"><Col><Button icon={<ReloadOutlined />} onClick={() => dashboard.refetch()} loading={dashboard.isFetching}>{t("refresh")}</Button></Col></Row>

        {loading ? (
          <Card><div style={{ minHeight: 180, display: "grid", placeItems: "center" }}><Skeleton active /></div></Card>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            title={t("loadFailed")}
            description={error.message}
            action={<Button size="small" onClick={() => dashboard.refetch()}>{t("retry")}</Button>}
          />
        ) : (
          <>
            {(data?.evaluationIncomplete || data?.eligibilityIncomplete) && (
              <Alert
                type="warning"
                showIcon
                title={t("partialDataTitle")}
                description={
                  <Space orientation="vertical" size={2}>
                    {data?.evaluationIncomplete && <span>{t("evaluationPartial")}</span>}
                    {data?.eligibilityIncomplete && <span>{t("eligibilityPartial")}</span>}
                  </Space>
                }
              />
            )}

            {(summary.no_plan_yet > 0 || summary.goals_approved > 0) && (
              <Card style={{ borderRadius: 12, borderColor: "#e2e8f0" }}>
                {(() => {
                  const noPlan = summary.no_plan_yet;
                  const approved = summary.goals_approved;
                  const total = noPlan + approved;
                  const noPlanAngle = total ? (noPlan / total) * 360 : 0;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
                      <div role="img" aria-label={t("noPlanYetNote", { count: noPlan }) + ". " + t("goalsApprovedNote", { count: approved })}
                        style={{ width: 156, height: 156, flex: "0 0 156px", borderRadius: "50%", background: `conic-gradient(#d97706 0deg ${noPlanAngle}deg, #163366 ${noPlanAngle}deg 360deg)`, display: "grid", placeItems: "center" }}>
                        <div style={{ width: 104, height: 104, borderRadius: "50%", background: "#fff", display: "grid", placeContent: "center", textAlign: "center" }}>
                          <Typography.Text strong style={{ fontSize: 25, lineHeight: 1.1 }}>{total.toLocaleString(locale)}</Typography.Text>
                        </div>
                      </div>
                      <Space orientation="vertical" size={12}>
                        <Space align="center" size={9}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#d97706" }} /><Typography.Text>{t("status.no_plan_yet")}</Typography.Text><Typography.Text strong>{noPlan.toLocaleString(locale)}</Typography.Text></Space>
                        <Space align="center" size={9}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#163366" }} /><Typography.Text>{t("status.goals_approved")}</Typography.Text><Typography.Text strong>{approved.toLocaleString(locale)}</Typography.Text></Space>
                      </Space>
                    </div>
                  );
                })()}
              </Card>
            )}

            <Card
              title={<Typography.Text strong style={{ fontSize: 15 }}>{t("activeCycles")}</Typography.Text>}
              extra={<Tag color="blue" style={{ borderRadius: 20, paddingInline: 10 }}>{cycles.length} · {t("active")}</Tag>}
              style={{ borderRadius: 12, borderColor: "#e2e8f0", overflow: "hidden" }}
              styles={{ header: { minHeight: 54, paddingInline: 18, borderBottomColor: "#e8edf3" }, body: { padding: 0 } }}
            >
              {cycles.length ? (
                <DataTable
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 900 }}
                  dataSource={cycles}
                  onRow={(cycle) => ({ onClick: () => router.push("/" + locale + "/admin/performance-cycles/" + cycle.id), style: { cursor: "pointer" } })}
                  columns={[
                    {
                      title: t("cycleName"),
                      render: (_: unknown, cycle: DashboardCycle) => (
                        <Space orientation="vertical" size={0}>
                          <Typography.Text strong>{getCycleName(cycle, locale)}</Typography.Text>
                          <Typography.Text type="secondary">{cycle.performance_year}</Typography.Text>
                        </Space>
                      ),
                    },
                    {
                      title: t("cycleDateRange"),
                      render: (_: unknown, cycle: DashboardCycle) =>
                        formatDate(cycle.start_date) + " – " + formatDate(cycle.end_date),
                    },
                    {
                      title: t("currentStage"),
                      render: (_: unknown, cycle: DashboardCycle) => (
                        <Tag color="processing">{stageLabel(cycle.current_stage, t)}</Tag>
                      ),
                    },
                    {
                      title: t("employeesInScope"),
                      render: (_: unknown, cycle: DashboardCycle) => cycle.members.length.toLocaleString(locale),
                    },
                    {
                      title: t("managersInScope"),
                      render: (_: unknown, cycle: DashboardCycle) =>
                        new Set(cycle.members.map((member) => asId(member.current_manager_id)).filter(Boolean)).size.toLocaleString(locale),
                    },
                    {
                      title: t("cycleProgress"),
                      render: (_: unknown, cycle: DashboardCycle) => {
                        const progress = progressForCycle(cycle, finalizedEmployeeIds);
                        return (
                          <Space orientation="vertical" size={2} style={{ minWidth: 150 }}>
                            <Progress percent={progress.percent} size="small" />
                          </Space>
                        );
                      },
                    },

                  ]}
                />
              ) : (
                <Empty description={t("noActiveCycles")} />
              )}
            </Card>

            <Card
              title={
                <div>
                  <Typography.Text strong style={{ fontSize: 15 }}>{t("managerProgress")}</Typography.Text>
                  <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("managerProgressSubtitle")}</Typography.Text></div>
                </div>
              }
              extra={
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportManagerProgress}
                  disabled={!managerRows.length}
                >
                  {t("export")}
                </Button>
              }
              style={{ borderRadius: 12, borderColor: "#e2e8f0", overflow: "hidden" }}
              styles={{ header: { minHeight: 58, paddingInline: 18, borderBottomColor: "#e8edf3" }, body: { padding: 0 } }}
            >
              <div style={{ padding: 14, background: "#f8fafc", borderBottom: "1px solid #e8edf3" }}>
              <Row gutter={[10, 10]}>
                <Col xs={24} md={8}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("managerSearch")}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    value={cycleId}
                    onChange={setCycleId}
                    options={cycleOptions}
                    placeholder={t("filterCycle")}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    value={businessUnitId}
                    onChange={setBusinessUnitId}
                    options={businessUnitOptions}
                    placeholder={t("filterBusinessUnit")}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    value={departmentId}
                    onChange={setDepartmentId}
                    options={departmentOptions}
                    placeholder={t("filterDepartment")}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    value={status}
                    onChange={setStatus}
                    options={statusOptions}
                    placeholder={t("filterStatus")}
                  />
                </Col>
              </Row>
              </div>

              <DataTable
                rowKey="managerId"
                size="small"
                dataSource={managerRows}
                onRow={(row) => ({ onClick: () => setSelectedManagerId(row.managerId), style: { cursor: "pointer" } })}
                scroll={{ x: 1250 }}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => t("managerCount", { count: total }) }}
                locale={{ emptyText: t("noManagers") }}
                columns={[
                  {
                    title: t("managerName"),
                    fixed: "start",
                    width: 190,
                    render: (_: unknown, row: ManagerRow) => (
                      <Typography.Text strong>{row.manager?.full_name || t("unknownManager")}</Typography.Text>
                    ),
                  },
                  {
                    title: t("managerEmail"),
                    width: 220,
                    render: (_: unknown, row: ManagerRow) => row.manager?.email || "—",
                  },
                  {
                    title: t("managerEmployeeId"),
                    width: 120,
                    render: (_: unknown, row: ManagerRow) => row.manager?.code || row.managerId,
                  },
                  { title: t("jobTitle"), width: 160, render: (_: unknown, row: ManagerRow) => row.manager?.job_title?.name || "—" },
                  { title: t("businessUnit"), width: 160, render: (_: unknown, row: ManagerRow) => row.manager?.business_unit?.name || "—" },
                  { title: t("department"), width: 150, render: (_: unknown, row: ManagerRow) => row.manager?.department?.name || "—" },
                  { title: t("totalEmployees"), width: 105, align: "center" as const, render: (_: unknown, row: ManagerRow) => <Typography.Text strong>{row.total}</Typography.Text> },
                  { title: t("status.no_plan_yet"), width: 105, align: "center" as const, render: (_: unknown, row: ManagerRow) => <Typography.Text type={row.counts.no_plan_yet ? "danger" : "secondary"}>{row.counts.no_plan_yet}</Typography.Text> },
                  { title: t("status.not_started"), width: 105, align: "center" as const, render: (_: unknown, row: ManagerRow) => row.counts.not_started },
                ]}
              />
            </Card>

            <Card
              title={<Typography.Text strong style={{ fontSize: 15 }}>{t("eligibilityExclusions")}</Typography.Text>}
              extra={<Tag color="warning" style={{ borderRadius: 20 }}>{(data?.exclusions || []).length}</Tag>}
              style={{ borderRadius: 12, borderColor: "#e2e8f0", overflow: "hidden" }}
              styles={{ header: { minHeight: 54, paddingInline: 18, borderBottomColor: "#e8edf3" }, body: { padding: 0 } }}
            >
              {(data?.exclusions || []).length ? (
                <DataTable<ExclusionRecord>
                  rowKey={(row) => String(row.employee.id) + "-" + String(row.cycle.id)}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 700 }}
                  dataSource={data?.exclusions || []}
                  columns={[
                    {
                      title: t("employeeName"),
                      render: (_: unknown, row: ExclusionRecord) => row.employee.full_name,
                    },
                    {
                      title: t("employeeId"),
                      render: (_: unknown, row: ExclusionRecord) => row.employee.code || row.employee.id,
                    },
                    {
                      title: t("cycleName"),
                      render: (_: unknown, row: ExclusionRecord) => getCycleName(row.cycle, locale),
                    },
                    {
                      title: t("joiningDate"),
                      dataIndex: "joiningDate",
                      render: (value: string) => formatDate(value),
                    },
                    {
                      title: t("eligibleFrom"),
                      dataIndex: "eligibleFrom",
                      render: (value: string) => formatDate(value),
                    },
                    {
                      title: t("eligibilityStatus"),
                      render: () => <Tag color="warning">{t("underSixMonths")}</Tag>,
                    },
                  ]}
                />
              ) : (
                <Empty description={t("noExclusions")} />
              )}
            </Card>
          </>
        )}
      </Space>

      <Drawer
        open={selectedManagerId != null}
        onClose={() => setSelectedManagerId(null)}
        size={900}
        styles={{ wrapper: { maxWidth: "100vw" } }}
        title={
          selectedManager?.manager?.full_name
            ? t("managerEmployeesTitle", { name: selectedManager.manager.full_name })
            : t("managerEmployeesTitleFallback", { id: selectedManagerId || "" })
        }
        destroyOnHidden
      >
        {selectedManager ? (
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Statistic title={t("totalEmployees")} value={selectedManager.total} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={t("managerEmployeeId")} value={selectedManager.manager?.code || selectedManager.managerId} />
              </Col>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary">{selectedManager.manager?.job_title?.name || "—"} · {selectedManager.manager?.department?.name || "—"}</Typography.Text>
              </Col>
            </Row>
            <DataTable
              rowKey="id"
              size="small"
              dataSource={selectedManagerEmployees}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 650 }}
              columns={employeeColumns}
            />
          </Space>
        ) : (
          <Empty description={t("noManagerDetails")} />
        )}
      </Drawer>
    </AppShell>
  );
}
