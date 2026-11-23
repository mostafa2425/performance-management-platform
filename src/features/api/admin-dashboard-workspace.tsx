"use client";

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
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { adminApi, cyclesApi, employeesApi, resultsApi } from "@/lib/api/endpoints";
import type { ApiEmployee } from "@/lib/api/types";

type AnyRecord = Record<string, any>;
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

type DashboardCycle = {
  id: number;
  name: any;
  performance_year: number;
  start_date: string;
  end_date: string;
  activated_at?: string | null;
  current_stage?: string | null;
  members: AnyRecord[];
  groups: AnyRecord[];
  evaluations: Map<number, string>;
  evaluationRestricted: boolean;
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
  exclusions: AnyRecord[];
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

const SUMMARY_KEYS: StatusKey[] = [
  "not_started",
  "draft",
  "pending_admin_approval",
  "pending_employee_review",
  "returned_to_manager",
  "active_performance",
  "evaluation_in_progress",
  "pending_final_approval",
  "finalized",
];

function rowsFrom<T = AnyRecord>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}

async function fetchAllPages<T>(
  request: (page: number) => Promise<any>,
): Promise<T[]> {
  const first = await request(1);
  const all = rowsFrom<T>(first);
  const lastPage = Math.max(1, Number(first?.meta?.last_page || 1));
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

function bilingual(value: any, locale: string): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    return String(value[locale] || value.en || value.ar || "—");
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
  const displayStatus = String(member?.display_status || "");
  const managerId = asId(member?.current_manager_id ?? member?.manager_id);
  const group = cycle.groups.find((item) => managerIdForGroup(item) === managerId);
  const groupStatus = String(group?.status || "");
  const evaluationStatus = cycle.evaluations.get(employeeId);

  if (finalizedEmployeeIds.has(employeeId) || groupStatus === "approved") return "finalized";
  if (groupStatus === "pending_admin") return "pending_final_approval";

  if (displayStatus === "not_started" || !member?.plan_id) return "no_plan_yet";
  if (displayStatus === "draft") return "draft";
  if (displayStatus === "pending_admin_approval") return "pending_admin_approval";
  if (displayStatus === "pending_employee_review") return "pending_employee_review";
  if (displayStatus === "returned_to_manager") return "returned_to_manager";

  if (displayStatus === "goals_approved") {
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
      ["pending_admin_approval", "pending_employee_review", "returned_to_manager", "goals_approved"].includes(
        String(member.display_status),
      ),
    ).length;
  } else if (cycle.current_stage === "employee_review") {
    labelKey = "plansApproved";
    done = cycle.members.filter((member) => member.display_status === "goals_approved").length;
  } else if (cycle.current_stage === "active_performance") {
    labelKey = "approvedPlans";
    done = cycle.members.filter((member) => member.display_status === "goals_approved").length;
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
    fetchAllPages<AnyRecord>((page) =>
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
        } catch (error: any) {
          if (error?.status === 403 || error?.response?.status === 403) {
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
    await mapConcurrent(exclusionCandidates, 6, async ({ cycle, employee }) => {
      try {
        const referenceDate = String(cycle.activated_at).slice(0, 10);
        const eligibility = await adminApi.employeeEligibility(Number(employee.id), referenceDate);
        if (eligibility?.status !== "under_6_months") return null;
        const reason = Array.isArray(eligibility.reason)
          ? eligibility.reason[0] || {}
          : eligibility.reason || {};
        return {
          employee,
          cycle,
          joiningDate: reason.joining_date || employee.joining_date,
          eligibleFrom: reason.eligible_from || addMonths(employee.joining_date || referenceDate, 6),
        };
      } catch {
        eligibilityIncomplete = true;
        return null;
      }
    })
  ).filter(Boolean) as AnyRecord[];

  return {
    employees,
    cycles: cycleDetails,
    results: rowsFrom<AnyRecord>(results),
    exclusions,
    evaluationIncomplete: cycleDetails.some((cycle: any) => cycle.evaluationRestricted || cycle.evaluationFailed),
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
  const ar = locale === "ar";
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
  const employees = data?.employees || [];
  const cycles = data?.cycles || [];
  const activeCycleIds = new Set(cycles.map((cycle) => Number(cycle.id)));
  const finalizedEmployeeIds = new Set<number>();
  for (const result of data?.results || []) {
    const resultCycleId = asId(result?.cycle?.id ?? result?.cycle_id);
    const employeeId = asId(result?.employee?.id ?? result?.employee_id);
    if (
      employeeId != null &&
      resultCycleId != null &&
      activeCycleIds.has(resultCycleId) &&
      result.finalized_at
    ) {
      finalizedEmployeeIds.add(employeeId);
    }
  }

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
  }, [employees, membershipByEmployee, data?.results]);

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

  const summaryCards = [
    { key: "total", label: "totalEmployees", value: employees.length, color: "#1677ff", icon: <TeamOutlined /> },
    { key: "not_started", label: "notStarted", value: summary.not_started, color: "#8c8c8c", icon: <UserOutlined /> },
    { key: "draft", label: "draft", value: summary.draft, color: "#1677ff" },
    { key: "pending_admin_approval", label: "pendingAdminApproval", value: summary.pending_admin_approval, color: "#d48806" },
    { key: "pending_employee_review", label: "pendingEmployeeReview", value: summary.pending_employee_review, color: "#722ed1" },
    { key: "returned_to_manager", label: "returnedForModification", value: summary.returned_to_manager, color: "#fa8c16" },
    { key: "active_performance", label: "activePerformance", value: summary.active_performance, color: "#389e0d" },
    { key: "evaluation_in_progress", label: "evaluationInProgress", value: summary.evaluation_in_progress, color: "#08979c" },
    { key: "pending_final_approval", label: "pendingFinalApproval", value: summary.pending_final_approval, color: "#d46b08" },
    { key: "finalized", label: "finalized", value: summary.finalized, color: "#237804" },
  ];

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
    <AppShell
      role="admin"
      title={t("text057")}
      subtitle={t("text058")}
    >
      <Space orientation="vertical" size={20} style={{ width: "100%" }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col>
            <Space orientation="vertical" size={2}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {t("text059")}
              </Typography.Title>
              <Typography.Text type="secondary">
                {t("text060")}
              </Typography.Text>
            </Space>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => dashboard.refetch()} loading={dashboard.isFetching}>
              {t("refresh")}
            </Button>
          </Col>
        </Row>

        {loading ? (
          <Card><div style={{ minHeight: 180, display: "grid", placeItems: "center" }}><Spin size="large" /></div></Card>
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
            <Row gutter={[12, 12]}>
              {summaryCards.map((item) => (
                <Col key={item.key} xs={12} sm={8} lg={6} xxl={item.key === "total" ? 6 : 4}>
                  <Card size="small" style={{ height: "100%", borderInlineStart: "3px solid " + item.color }}>
                    <Statistic
                      title={t(item.label)}
                      value={item.value}
                      valueStyle={{ fontSize: 25, fontWeight: 650, color: "rgba(0,0,0,.88)" }}
                      prefix={item.icon}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

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

            {summary.no_plan_yet > 0 && (
              <Typography.Text type="secondary">
                {t("noPlanYetNote", { count: summary.no_plan_yet })}
              </Typography.Text>
            )}
            {summary.goals_approved > 0 && (
              <Typography.Text type="secondary">
                {t("goalsApprovedNote", { count: summary.goals_approved })}
              </Typography.Text>
            )}

            <Card
              title={t("activeCycles")}
              extra={<Tag color="blue">{cycles.length} · {t("active")}</Tag>}
            >
              {cycles.length ? (
                <Table
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 900 }}
                  dataSource={cycles}
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
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {progress.done.toLocaleString(locale)} / {progress.total.toLocaleString(locale)} · {t(progress.labelKey)}
                            </Typography.Text>
                          </Space>
                        );
                      },
                    },
                    {
                      title: t("action"),
                      fixed: "end" as const,
                      render: (_: unknown, cycle: DashboardCycle) => (
                        <Button type="link" onClick={() => router.push("/" + locale + "/admin/performance-cycles/" + cycle.id)}>
                          {t("viewCycle")}
                        </Button>
                      ),
                    },
                  ]}
                />
              ) : (
                <Empty description={t("noActiveCycles")} />
              )}
            </Card>

            <Card
              title={t("managerProgress")}
              extra={
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportManagerProgress}
                  disabled={!managerRows.length}
                >
                  {t("export")}
                </Button>
              }
            >
              <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
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

              <Table
                rowKey="managerId"
                size="middle"
                dataSource={managerRows}
                scroll={{ x: 1800 }}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => t("managerCount", { count: total }) }}
                locale={{ emptyText: t("noManagers") }}
                columns={[
                  {
                    title: t("managerName"),
                    fixed: "start",
                    width: 220,
                    render: (_: unknown, row: ManagerRow) => (
                      <Space orientation="vertical" size={0}>
                        <Typography.Text strong>{row.manager?.full_name || t("unknownManager")}</Typography.Text>
                        <Typography.Text type="secondary">{row.manager?.email || "—"}</Typography.Text>
                      </Space>
                    ),
                  },
                  {
                    title: t("managerEmployeeId"),
                    width: 120,
                    render: (_: unknown, row: ManagerRow) => row.manager?.code || row.managerId,
                  },
                  { title: t("jobTitle"), width: 160, render: (_: unknown, row: ManagerRow) => row.manager?.job_title?.name || "—" },
                  { title: t("businessUnit"), width: 160, render: (_: unknown, row: ManagerRow) => row.manager?.business_unit?.name || "—" },
                  { title: t("department"), width: 150, render: (_: unknown, row: ManagerRow) => row.manager?.department?.name || "—" },
                  { title: t("totalEmployees"), width: 110, align: "center" as const, render: (_: unknown, row: ManagerRow) => row.total },
                  ...STATUS_KEYS.map((key) => ({
                    title: t("status." + key),
                    width: 125,
                    align: "center" as const,
                    render: (_: unknown, row: ManagerRow) => row.counts[key],
                  })),
                  {
                    title: t("action"),
                    fixed: "end" as const,
                    width: 110,
                    render: (_: unknown, row: ManagerRow) => (
                      <Button type="link" onClick={() => setSelectedManagerId(row.managerId)}>
                        {t("viewDetails")}
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>

            <Card
              title={t("eligibilityExclusions")}
              extra={<Tag color="warning">{(data?.exclusions || []).length}</Tag>}
            >
              {(data?.exclusions || []).length ? (
                <Table
                  rowKey={(row: AnyRecord) => String(row.employee.id) + "-" + String(row.cycle.id)}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 700 }}
                  dataSource={data?.exclusions || []}
                  columns={[
                    {
                      title: t("employeeName"),
                      render: (_: unknown, row: AnyRecord) => row.employee.full_name,
                    },
                    {
                      title: t("employeeId"),
                      render: (_: unknown, row: AnyRecord) => row.employee.code || row.employee.id,
                    },
                    {
                      title: t("cycleName"),
                      render: (_: unknown, row: AnyRecord) => getCycleName(row.cycle, locale),
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
        width={900}
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
            <Table
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
