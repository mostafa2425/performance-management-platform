"use client";

import "./manager-dashboard-workspace.css";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthSession } from "@/lib/auth/session";
import { cyclesApi } from "@/lib/api/endpoints";

const labels: Record<string, [string, string]> = {
  not_started: ["Not started", "لم تبدأ"],
  draft: ["Draft", "مسودة"],
  pending_admin: ["Pending Admin approval", "بانتظار موافقة المسؤول"],
  pending_employee: ["Pending employee review", "بانتظار مراجعة الموظف"],
  returned: ["Returned", "مُعادة"],
  approved: ["Goals approved", "الأهداف معتمدة"],
  complete: ["Evaluation complete", "اكتمل التقييم"],
  missed: ["Missed", "لم يتم"],
  removed: ["Removed", "مستبعد"],
};

const rowsOf = (value: any) =>
  Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];

const nameOf = (value: any, ar: boolean) =>
  typeof value === "object"
    ? (ar ? value?.ar || value?.en : value?.en || value?.ar) || "—"
    : value || "—";

const statusColors: Record<string, string> = {
  draft: "gold",
  pending_admin: "processing",
  pending_employee: "processing",
  returned: "error",
  approved: "success",
  complete: "success",
  missed: "default",
  removed: "default",
  not_started: "default",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toLocaleUpperCase();
}

export default function ManagerDashboardWorkspace() {
  const ar = useLocale() === "ar";
  const locale = ar ? "ar" : "en";
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const { isReady, isAuthenticated } = useAuthSession();
  const queryClient = useQueryClient();

  const [cycleId, setCycleId] = useState<number | undefined>();
  const [status, setStatus] = useState<string>();
  const [search, setSearch] = useState("");

  const cyclesQuery = useQuery({
    queryKey: ["manager-dashboard-cycles"],
    queryFn: cyclesApi.mine,
    enabled: isAuthenticated,
  });

  const cycles = rowsOf(cyclesQuery.data).filter((cycle: any) => cycle.my_roles?.manager);

  const planStatusQueries = useQueries({
    queries: cycles.map((cycle: any) => ({
      queryKey: ["manager-plan-status", cycle.id],
      queryFn: () => cyclesApi.planStatus(cycle.id, { per_page: 100 }),
      enabled: isAuthenticated,
    })),
  });

  const evaluationQueries = useQueries({
    queries: cycles
      .filter((cycle: any) => cycle.current_stage === "manager_evaluation")
      .map((cycle: any) => ({
        queryKey: ["manager-team-evaluations", cycle.id],
        queryFn: () => cyclesApi.teamEvaluations(cycle.id),
        enabled: isAuthenticated,
      })),
  });

  const groupQueries = useQueries({
    queries: cycles
      .filter(
        (cycle: any) =>
          cycle.current_stage === "manager_evaluation" ||
          cycle.current_stage === "admin_final_review",
      )
      .map((cycle: any) => ({
        queryKey: ["manager-team-group", cycle.id],
        queryFn: () => cyclesApi.group(cycle.id),
        enabled: isAuthenticated,
      })),
  });

  const team = useMemo(
    () =>
      cycles.flatMap((cycle: any, index: number) =>
        rowsOf(planStatusQueries[index]?.data).map((row: any) => ({
          ...row,
          cycleId: cycle.id,
          cycleName: nameOf(cycle.name, ar),
          stage: cycle.current_stage,
          deadline: cycle.stages?.find((stage: any) => stage.stage === cycle.current_stage)
            ?.deadline_date,
        })),
      ),
    [cycles, planStatusQueries, ar],
  );

  const scopedTeam = team.filter((row: any) => !cycleId || row.cycleId === cycleId);
  const filteredTeam = scopedTeam.filter((row: any) => {
    const matchesStatus = !status || row.status?.key === status;
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch =
      !query ||
      [row.employee?.name, row.employee?.code].some((value: any) =>
        String(value || "").toLocaleLowerCase().includes(query),
      );
    return matchesStatus && matchesSearch;
  });

  const directReports = new Set(
    scopedTeam.map((row: any) => row.employee?.id).filter(Boolean),
  ).size;
  const evaluationRows = evaluationQueries.flatMap((query) => rowsOf(query.data));
  const groupRows = groupQueries.map((query) => query.data).filter(Boolean);

  const evaluationInProgress = evaluationRows.filter(
    (row: any) => row.status === "not_started" || row.status === "draft",
  ).length;
  const pendingFinal = groupRows
    .filter((group: any) => group.status === "pending_admin")
    .reduce((total: number, group: any) => total + (group.n || 0), 0);
  const finalized = groupRows
    .filter((group: any) => group.status === "approved")
    .reduce((total: number, group: any) => total + (group.n || 0), 0);

  const countStatus = (key: string) =>
    scopedTeam.filter((row: any) => row.status?.key === key).length;
  const started = scopedTeam.filter(
    (row: any) => row.status?.key && row.status.key !== "not_started",
  ).length;
  const progress = directReports ? Math.round((started / directReports) * 100) : 0;

  const busy =
    !isReady ||
    cyclesQuery.isLoading ||
    planStatusQueries.some((query) => query.isLoading) ||
    evaluationQueries.some((query) => query.isLoading) ||
    groupQueries.some((query) => query.isLoading);
  const error =
    cyclesQuery.error ||
    planStatusQueries.find((query) => query.error)?.error ||
    evaluationQueries.find((query) => query.error)?.error ||
    groupQueries.find((query) => query.error)?.error;

  const metrics = [
    {
      key: "total",
      label: t("Total direct reports", "إجمالي الموظفين المباشرين"),
      value: directReports,
      percent: directReports ? "100%" : "0%",
      tone: "teal",
    },
    ...["draft", "pending_admin", "pending_employee", "returned", "approved"].map((key) => ({
      key,
      label:
        key === "approved"
          ? t("Goals approved", "الأهداف المعتمدة")
          : labels[key][ar ? 1 : 0],
      value: countStatus(key),
      percent: directReports
        ? `${Math.round((countStatus(key) / directReports) * 100)}%`
        : "0%",
      tone: key === "draft" ? "amber" : "slate",
    })),
    {
      key: "evaluation",
      label: t("Evaluation in progress", "التقييم قيد التنفيذ"),
      value: evaluationInProgress,
      percent: directReports
        ? `${Math.round((evaluationInProgress / directReports) * 100)}%`
        : "0%",
      tone: "slate",
    },
    {
      key: "pending_final",
      label: t("Pending final approval", "بانتظار الاعتماد النهائي"),
      value: pendingFinal,
      percent: directReports
        ? `${Math.round((pendingFinal / directReports) * 100)}%`
        : "0%",
      tone: "slate",
    },
    {
      key: "finalized",
      label: t("Finalized", "تم الإنهاء"),
      value: finalized,
      percent: directReports
        ? `${Math.round((finalized / directReports) * 100)}%`
        : "0%",
      tone: "slate",
    },
  ];

  const columns: any[] = [
    {
      title: t("Employee", "الموظف"),
      key: "employee",
      render: (_: any, row: any) => {
        const employeeName = row.employee?.name || "—";
        const isDraft = row.status?.key === "draft";
        return (
          <div className="manager-employee-cell">
            <Avatar
              size={34}
              className={isDraft ? "manager-employee-avatar manager-employee-avatar-draft" : "manager-employee-avatar"}
            >
              {initials(employeeName)}
            </Avatar>
            <div className="manager-employee-meta">
              <Typography.Text strong>{employeeName}</Typography.Text>
              <Typography.Text type="secondary" className="manager-employee-code">
                {row.employee?.code || "—"}
              </Typography.Text>
            </div>
          </div>
        );
      },
    },
    {
      title: t("Performance cycle", "دورة الأداء"),
      dataIndex: "cycleName",
      key: "cycleName",
      render: (value: string) => <span className="manager-cycle-name">{value}</span>,
    },
    {
      title: t("Performance status", "حالة الأداء"),
      key: "status",
      render: (_: any, row: any) => {
        const key = row.status?.key || "not_started";
        const label = row.status?.label || labels[key]?.[ar ? 1 : 0] || "—";
        return (
          <Tag color={statusColors[key] || "default"} className={`manager-status-tag manager-status-${key}`}>
            <span className="manager-status-dot" />
            {label}
          </Tag>
        );
      },
    },
    {
      title: t("Action", "الإجراء"),
      key: "action",
      align: ar ? "left" : "right",
      render: (_: any, row: any) => (
        <Link
          href={
            `/${locale}/manager/objectives?` +
            (row.plan_id ? `plan=${row.plan_id}` : `cycle_member=${row.cycle_member_id}`)
          }
        >
          <Button
            size="small"
            type={row.plan_id ? "primary" : "default"}
            className={row.plan_id ? "manager-table-action manager-table-action-primary" : "manager-table-action"}
          >
            {row.plan_id ? t("View plan", "عرض الخطة") : t("Create plan", "إنشاء خطة")}
            <span aria-hidden="true">{row.plan_id ? " →" : " +"}</span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title={t("Team overview", "نظرة عامة على الفريق")}
      subtitle={t(
        "Monitor direct reports across your active performance cycles and track submission statuses.",
        "تابع الموظفين التابعين لك عبر دورات الأداء النشطة وحالات تسليم الخطط.",
      )}
    >
      {busy ? (
        <Spin />
      ) : error ? (
        <Alert type="error" showIcon title={(error as Error).message} />
      ) : (
        <div className="manager-dashboard">
          <div className="manager-dashboard-heading">
            <div className="manager-active-cycle-pill">
              <span className="manager-active-cycle-dot" />
              {t("Cycles assigned", "الدورات المسندة")}: {cycles.length}
            </div>
            <Button
              className="manager-refresh-button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["manager-dashboard-cycles"] })}
            >
              ↻ <span>{t("Refresh", "تحديث")}</span>
            </Button>
          </div>

          <section className="manager-metrics-grid" aria-label={t("Team metrics", "مؤشرات الفريق")}>
            {metrics.map((metric) => (
              <Card key={metric.key} className={`manager-metric-card manager-metric-${metric.tone}`} bordered>
                <div className="manager-metric-label">{metric.label}</div>
                <div className="manager-metric-value-row">
                  <span className="manager-metric-value">{metric.value}</span>
                  <span className={`manager-metric-percent manager-metric-percent-${metric.tone}`}>
                    {metric.percent}
                  </span>
                </div>
              </Card>
            ))}
          </section>

          <section className="manager-cycles-section">
            <div className="manager-section-heading">
              <Typography.Title level={5}>{t("Active performance cycles", "دورات الأداء النشطة")}</Typography.Title>
              <Typography.Text type="secondary">
                {t(`${cycles.length} active cycle(s) assigned`, `${cycles.length} دورة نشطة مسندة`)}
              </Typography.Text>
            </div>
            {cycles.length ? (
              <Row gutter={[12, 12]}>
                {cycles.map((cycle: any) => {
                  const cycleRows = team.filter((row: any) => row.cycleId === cycle.id);
                  const cycleStarted = cycleRows.filter(
                    (row: any) => row.status?.key && row.status.key !== "not_started",
                  ).length;
                  const cycleProgress = cycleRows.length
                    ? Math.round((cycleStarted / cycleRows.length) * 100)
                    : 0;
                  const selected = cycle.id === cycleId;
                  return (
                    <Col xs={24} sm={24} lg={14} xl={12} key={cycle.id}>
                      <Card
                        className={`manager-cycle-card${selected ? " manager-cycle-card-selected" : ""}`}
                        onClick={() => setCycleId(selected ? undefined : cycle.id)}
                        hoverable
                      >
                        <div className="manager-cycle-card-top">
                          <div>
                            <div className="manager-cycle-title-row">
                              <span className="manager-active-cycle-dot" />
                              <Typography.Text strong>{nameOf(cycle.name, ar)}</Typography.Text>
                              <Tag color="success">{t("Active", "نشطة")}</Tag>
                            </div>
                            <Typography.Text type="secondary">
                              {cycle.performance_year || t("Performance cycle", "دورة الأداء")}
                            </Typography.Text>
                          </div>
                          <Link
                            href={`/${locale}/manager/objectives?cycle=${cycle.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="manager-cycle-link"
                          >
                            {t("View cycle details", "تفاصيل الدورة")} →
                          </Link>
                        </div>
                        <div className="manager-cycle-progress">
                          <div className="manager-cycle-progress-labels">
                            <Typography.Text type="secondary">{t("Overall team progress", "التقدم الإجمالي للفريق")}</Typography.Text>
                            <Typography.Text strong>
                              {cycleProgress}% ({cycleStarted} {t("of", "من")} {cycleRows.length} {t("started", "بدأوا")})
                            </Typography.Text>
                          </div>
                          <Progress percent={cycleProgress} showInfo={false} strokeColor="#14b8a6" trailColor="#eef2f7" size="small" />
                        </div>
                        <div className="manager-cycle-meta">
                          <span>{t("Deadline", "الموعد النهائي")}: <strong>{cycle.stages?.find((stage: any) => stage.stage === cycle.current_stage)?.deadline_date || "—"}</strong></span>
                          <span>{t("Employees", "الموظفون")}: <strong>{cycleRows.length}</strong></span>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Empty description={t("No active cycles", "لا توجد دورات نشطة")} />
            )}
          </section>

          <Card className="manager-team-card" bordered>
            <div className="manager-team-header">
              <div className="manager-team-title">
                <Typography.Title level={5}>{t("My team", "فريقي")}</Typography.Title>
                <Tag>{scopedTeam.length} {t("members", "موظفين")}</Tag>
              </div>
              <Button
                type="link"
                className="manager-clear-filters"
                onClick={() => {
                  setCycleId(undefined);
                  setStatus(undefined);
                  setSearch("");
                }}
              >
                {t("Clear filters", "مسح الفلاتر")}
              </Button>
            </div>

            <Row gutter={[10, 10]} className="manager-team-filters">
              <Col xs={24} md={6}>
                <Select
                  allowClear
                  value={cycleId}
                  onChange={setCycleId}
                  className="manager-filter-control"
                  placeholder={t("All cycles", "كل الدورات")}
                  options={cycles.map((cycle: any) => ({ value: cycle.id, label: nameOf(cycle.name, ar) }))}
                />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  allowClear
                  value={status}
                  onChange={setStatus}
                  className="manager-filter-control"
                  placeholder={t("All statuses", "كل الحالات")}
                  options={Object.keys(labels).map((key) => ({ value: key, label: labels[key][ar ? 1 : 0] }))}
                />
              </Col>
              <Col xs={24} md={12}>
                <Input
                  allowClear
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="manager-filter-control"
                  placeholder={t("Search employee name or ID...", "ابحث باسم الموظف أو رقمه...")}
                />
              </Col>
            </Row>

            <Table
              className="manager-team-table"
              rowKey={(row: any) => String(row.cycle_member_id)}
              columns={columns}
              dataSource={filteredTeam}
              scroll={{ x: 720 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  t(
                    `Showing ${range[0]} to ${range[1]} of ${total} direct reports`,
                    `عرض ${range[0]} إلى ${range[1]} من أصل ${total} موظف مباشر`,
                  ),
              }}
              rowClassName={(row: any) =>
                row.status?.key === "draft" ? "manager-team-row-draft" : ""
              }
              locale={{ emptyText: t("No team records found", "لا توجد سجلات للفريق") }}
            />
          </Card>
        </div>
      )}
    </AppShell>
  );
}
