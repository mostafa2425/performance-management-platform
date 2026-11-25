"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import { Alert, App, Avatar, Button, Card, Col, Empty, Input, Popconfirm, Row, Select, Space, Skeleton, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cyclesApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { planStatusTag } from "./plans/plan-shared";
import { usePerformanceCycle } from "@/features/performance-cycles/performance-cycle-provider";
import "./manager-year-group-workspace.css";

type StatusMeta = { en: string; ar: string; color: string };

const EVALUATION_STATUS: Record<string, StatusMeta> = {
  not_started: { en: "Not started", ar: "لم يبدأ", color: "default" },
  draft: { en: "Draft", ar: "مسودة", color: "blue" },
  complete: { en: "Complete", ar: "مكتمل", color: "green" },
  missed: { en: "Missed", ar: "فائت", color: "red" },
  removed: { en: "Removed", ar: "مستبعد", color: "default" },
};

const GROUP_STATUS: Record<string, StatusMeta> = {
  open: { en: "Open", ar: "مفتوحة", color: "blue" },
  pending_admin: { en: "Pending admin", ar: "بانتظار الإدارة", color: "gold" },
  returned: { en: "Returned", ar: "معادة", color: "orange" },
  approved: { en: "Approved", ar: "معتمدة", color: "green" },
  no_manager: { en: "No manager", ar: "بدون مدير", color: "default" },
};

function StatusTag({ value, ar, map }: { value?: string | { key?: string; label?: string } | null; ar: boolean; map: Record<string, StatusMeta> }) {
  const key = typeof value === "string" ? value : value?.key;
  if (!key) return <Tag>—</Tag>;
  const meta = map[key] ?? { en: typeof value === "object" ? value?.label || key : key, ar: typeof value === "object" ? value?.label || key : key, color: "default" };
  return <Tag color={meta.color}>{ar ? meta.ar : meta.en}</Tag>;
}

function useManagerCycle() {
  const { cycleId, setCycleId, options, cycles } = usePerformanceCycle();
  return { cycleId, setCycleId, options, cycles };
}

export function ApiManagerTeamWorkspace() {
  const ar = useLocale() === "ar";
  const locale = useLocale();
  const router = useRouter();
  const { cycleId, cycles } = useManagerCycle();
  const t = (e: string, a: string) => (ar ? a : e);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const q = useQuery({
    queryKey: ["cycles", cycleId, "plan-status"],
    queryFn: () => cyclesApi.planStatus(cycleId!, { per_page: 100 }),
    enabled: Boolean(cycleId),
  });
  const rows = ((q.data as any)?.data || []) as any[];
  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      const statusKey = row.status?.key || "not_started";
      if (status && statusKey !== status) return false;
      if (!term) return true;
      return [row.employee?.name, row.employee?.full_name, row.employee?.code]
        .some((value) => String(value || "").toLocaleLowerCase().includes(term));
    });
  }, [rows, search, status]);
  const statusOptions = [
    { value: "not_started", label: t("Not started", "لم تبدأ") },
    { value: "draft", label: t("Draft", "مسودة") },
    { value: "pending_admin", label: t("Pending admin approval", "بانتظار موافقة الإدارة") },
    { value: "pending_employee", label: t("Pending employee review", "بانتظار مراجعة الموظف") },
    { value: "returned", label: t("Returned", "معادة") },
    { value: "approved", label: t("Goals approved", "الأهداف معتمدة") },
    { value: "complete", label: t("Evaluation complete", "اكتمل التقييم") },
  ];
  const openEmployee = (record: any) => {
    const id = record.employee?.id;
    if (id != null) router.push(`/${locale}/manager/team/${id}`);
  };

  return (
    <AppShell
      role="manager"
      title={t("My team", "فريقي")}
      subtitle={t(
        "View your team members, monitor performance progress, and open individual employee profiles.",
        "استعرض أعضاء فريقك وتابع تقدم الأداء واطّلع على تفاصيل كل موظف.",
      )}
    >
      <div className="manager-team-workspace">
        {q.isError ? (
          <Alert type="error" showIcon title={(q.error as Error).message} />
        ) : !cycleId ? (
          <Card variant="outlined">
            <Empty description={cycles.isLoading ? t("Loading available cycles…", "جاري تحميل الدورات…") : t("Select a cycle to view your team.", "اختر دورة لعرض فريقك.")} />
          </Card>
        ) : (
          <>
            {/* Summary cards intentionally disabled; keep the team list as the primary focus.
                        <Row gutter={[10, 10]} className="manager-team-summary">
                          {[
                            { key: "total", label: t("Direct reports", "الموظفون المباشرون"), value: rows.length },
                            { key: "approved", label: t("Goals approved", "الأهداف المعتمدة"), value: count("approved") },
                            { key: "pending", label: t("Pending review", "بانتظار المراجعة"), value: count("pending_admin") + count("pending_employee") },
                            { key: "attention", label: t("Needs attention", "تتطلب متابعة"), value: needsAttention },
                          ].map((item) => (
                            <Col xs={12} sm={6} key={item.key}>
                              <Card size="small" className={`manager-team-stat manager-team-stat-${item.key}`} variant="outlined">
                                <Typography.Text type="secondary">{item.label}</Typography.Text>
                                <Typography.Title level={3}>{item.value}</Typography.Title>
                              </Card>
                            </Col>
                          ))}
                        </Row>
            */}

            <Card className="manager-team-list-card" variant="outlined">
              <div className="manager-team-list-heading">
                <div>
                  <Typography.Title level={5}>{t("Team members", "أعضاء الفريق")}</Typography.Title>
                  <Typography.Text type="secondary">
                    {t(`${filteredRows.length} of ${rows.length} employees`, `${filteredRows.length} من ${rows.length} موظف`)}
                  </Typography.Text>
                </div>
                <Button
                  type="link"
                  disabled={!search && !status}
                  onClick={() => { setSearch(""); setStatus(undefined); }}
                >
                  {t("Clear filters", "مسح الفلاتر")}
                </Button>
              </div>
              <Row gutter={[10, 10]} className="manager-team-list-filters">
                <Col xs={24} md={15}>
                  <Input
                    allowClear
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("Search by employee name or code", "ابحث باسم الموظف أو الرقم الوظيفي")}
                  />
                </Col>
                <Col xs={24} md={9}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    className="manager-team-status-filter"
                    placeholder={t("All statuses", "كل الحالات")}
                    value={status}
                    onChange={setStatus}
                    options={statusOptions}
                  />
                </Col>
              </Row>
              <DataTable
                className="manager-team-directory-table"
                ariaLabel={t("Team members", "أعضاء الفريق")}
                rowKey="cycle_member_id"
                dataSource={filteredRows}
                loading={q.isFetching}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => t(`Showing ${range[0]}–${range[1]} of ${total}`, `عرض ${range[0]}–${range[1]} من ${total}`),
                }}
                scroll={{ x: 850 }}
                rowClassName={() => "manager-team-member-row"}
                onRow={(record) => ({
                  onClick: () => openEmployee(record),
                  onKeyDown: (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEmployee(record);
                    }
                  },
                  tabIndex: 0,
                  role: "button",
                  "aria-label": t("View employee performance details", "عرض تفاصيل أداء الموظف"),
                })}
                locale={{ emptyText: t("No team members match these filters.", "لا يوجد موظفون مطابقون لعوامل التصفية.") }}
                columns={[
                  {
                    title: t("Employee", "الموظف"),
                    key: "employee",
                    render: (_: any, record: any) => {
                      const name = record.employee?.name || record.employee?.full_name || "—";
                      const initials = String(name).split(/\s+/).slice(0, 2).map((part: string) => part[0] || "").join("").toLocaleUpperCase();
                      return (
                        <Space size={10}>
                          <Avatar size={36}>{initials}</Avatar>
                          <Space orientation="vertical" size={0}>
                            <Typography.Text strong>{name}</Typography.Text>
                            <Typography.Text type="secondary" className="manager-team-member-code">{record.employee?.code ? `#${record.employee.code}` : "—"}</Typography.Text>
                          </Space>
                        </Space>
                      );
                    },
                  },
                  {
                    title: t("Performance status", "حالة الأداء"),
                    dataIndex: "status",
                    width: 210,
                    render: (value: { key?: string; label?: string }) => planStatusTag(value, ar),
                  },
                  {
                    title: t("Admin attention", "يتطلب متابعة الإدارة"),
                    dataIndex: "requires_admin_attention",
                    width: 180,
                    render: (value: boolean) => value ? <Tag color="warning">{t("Required", "مطلوب")}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
                  },
                  {
                    title: t("Actions", "الإجراءات"),
                    key: "actions",
                    width: 150,
                    align: ar ? "left" : "right",
                    render: (_: any, record: any) => (
                      <Button size="small" type="primary" onClick={(event) => { event.stopPropagation(); openEmployee(record); }}>
                        {t("View details", "عرض التفاصيل")}
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          </>
        )}
      </div>
      <style>{`
        .manager-team-workspace { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; width: 100%; max-width: 100%; min-width: 0; overflow: hidden; }
        .manager-team-workspace > *, .manager-team-cycle-card, .manager-team-list-card { width: 100%; max-width: 100%; min-width: 0; }
        .manager-team-cycle-card, .manager-team-list-card { border-color: #e2e8f0; border-radius: 12px; }
        .manager-team-cycle-card .ant-card-body, .manager-team-list-card .ant-card-body { min-width: 0; max-width: 100%; }
        .manager-team-list-card .pmp-data-table-region, .manager-team-list-card .ant-table-wrapper { width: 100%; max-width: 100%; min-width: 0; }
        .manager-team-list-card .ant-table-container { max-width: 100%; }
        .manager-team-list-card .ant-table-content { overflow-x: auto !important; }
        .manager-team-toolbar, .manager-team-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .manager-team-toolbar .ant-typography, .manager-team-list-heading .ant-typography { margin: 0; }
        .manager-team-toolbar .ant-typography-secondary, .manager-team-list-heading .ant-typography-secondary { font-size: 12px; }
        .manager-team-summary .ant-col { min-width: 0; }
        .manager-team-stat.ant-card { height: 100%; border-radius: 10px; box-shadow: none; }
        .manager-team-stat .ant-card-body { display: grid; gap: 5px; padding: 12px 14px; }
        .manager-team-stat .ant-typography-secondary { font-size: 11px; }
        .manager-team-stat .ant-typography h3, .manager-team-stat h3.ant-typography { margin: 0; color: #0f172a; }
        .manager-team-stat-pending { border-color: #fde68a; }
        .manager-team-stat-attention { border-color: #fecaca; }
        .manager-team-list-heading { padding-bottom: 12px; }
        .manager-team-list-heading h5.ant-typography { margin-bottom: 3px; }
        .manager-team-list-filters { width: 100%; max-width: 100%; min-width: 0; margin-bottom: 12px; }
        .manager-team-list-filters .ant-col { min-width: 0; }
        .manager-team-list-filters .ant-input, .manager-team-list-filters .ant-select { width: 100%; max-width: 100%; }
        .manager-team-list-heading > * { min-width: 0; }
        .manager-team-status-filter { width: 100%; }
        .manager-team-member-code { font-size: 11px; }
        .manager-team-member-row { cursor: pointer; transition: background-color .15s ease; }
        .manager-team-member-row:hover > td { background: #f0fdfa !important; }
        .manager-team-member-row:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: -2px; }
        .manager-team-directory-table .ant-table-thead > tr > th { white-space: nowrap; }
        @media (max-width: 640px) {
          .manager-team-toolbar { align-items: stretch; flex-direction: column; }
          .manager-team-toolbar .ant-select { width: 100% !important; }
          .manager-team-list-heading { align-items: flex-start; }
        }
      `}</style>
    </AppShell>
  );
}

export function ApiManagerGroupWorkspace() {
  const ar = useLocale() === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const { cycleId } = useManagerCycle();
  const t = (e: string, a: string) => (ar ? a : e);
  const group = useQuery({
    queryKey: ["cycles", cycleId, "group"],
    queryFn: () => cyclesApi.group(cycleId!),
    enabled: Boolean(cycleId),
  });
  const team = useQuery({
    queryKey: ["cycles", cycleId, "team-evaluations"],
    queryFn: () => cyclesApi.teamEvaluations(cycleId!),
    enabled: Boolean(cycleId),
  });
  const submit = useMutation({
    mutationFn: () => cyclesApi.submitGroup(cycleId!),
    onSuccess: async () => {
      message.success(ar ? "تم إرسال المجموعة للمراجعة" : "Group submitted for review");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["cycles", cycleId, "group"] }),
        qc.invalidateQueries({ queryKey: ["cycles", cycleId, "team-evaluations"] }),
      ]);
    },
    onError: (error) => message.error((error as Error).message || t("Unable to submit the group.", "تعذر إرسال المجموعة.")),
  });
  const g = group.data as any;
  const rows = (team.data as any)?.data || [];
  const blockers = Array.isArray(g?.blockers) ? g.blockers : [];
  const allowed = Array.isArray(g?.allowed) ? g.allowed : [];
  const memberCount = Number(g?.n ?? rows.length ?? 0);
  const submitted = Number(g?.latest_submission_no ?? 0);
  const blockerMemberNames = (ids: unknown[]) => ids.map((id) => {
    const member = rows.find((row: any) =>
      String(row.cycle_member_id) === String(id) ||
      String(row.employee?.id) === String(id)
    );
    return member?.employee?.name || member?.employee?.full_name || t(`Member #${id}`, `عضو #${id}`);
  });
  const blockerLabel = (blocker: any) => {
    if (blocker.message || blocker.label) return blocker.message || blocker.label;
    const code = String(blocker.code || t("Action required", "مطلوب إجراء"));
    return code.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <AppShell
      role="manager"
      title={t("Year group", "مجموعة السنة")}
      subtitle={t("Review rating distribution and submit your team when it is ready.", "راجع توزيع التقديرات وأرسل المجموعة عند اكتمالها.")}
    >
      <div className="manager-year-group-workspace">
        {!cycleId ? (
          <Card><Empty description={t("Select a cycle to view group readiness.", "اختر دورة لعرض جاهزية المجموعة.")} /></Card>
        ) : group.isError ? (
          <Alert type="error" showIcon title={t("Could not load group readiness", "تعذر تحميل جاهزية المجموعة")} description={(group.error as Error).message} />
        ) : group.isLoading ? (
          <Card className="year-group-readiness-card">
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        ) : g ? (
          <>
            <Card
              className="year-group-readiness-card"
              title={
                <div className="year-group-card-title">
                  <Typography.Title level={5}>{t("Group readiness", "جاهزية المجموعة")}</Typography.Title>
                  <Typography.Text type="secondary">{t("One view of the group's submission status and rating limits.", "ملخص حالة الإرسال وحدود توزيع التقديرات.")}</Typography.Text>
                </div>
              }
              extra={<StatusTag value={g.status} ar={ar} map={GROUP_STATUS} />}
            >
              <div className="year-group-summary">
                <div className="year-group-summary-item">
                  <span>{t("Team members", "أعضاء الفريق")}</span>
                  <strong>{memberCount}</strong>
                </div>
                <div className="year-group-summary-item">
                  <span>{t("Group version", "إصدار المجموعة")}</span>
                  <strong>{g.version ?? "—"}</strong>
                </div>
                <div className="year-group-summary-item">
                  <span>{t("Submission", "رقم الإرسال")}</span>
                  <strong>{submitted || "—"}</strong>
                </div>
                <div className="year-group-summary-item year-group-summary-state">
                  <span>{t("Readiness", "الجاهزية")}</span>
                  <strong className={g.can_submit ? "is-ready" : "is-blocked"}>
                    {g.can_submit ? t("Ready to submit", "جاهزة للإرسال") : t("Action required", "تحتاج إلى إجراء")}
                  </strong>
                </div>
              </div>

              <div className="year-group-section-heading">
                <Typography.Text strong>{t("Rating distribution", "توزيع التقديرات")}</Typography.Text>
                <Typography.Text type="secondary">{t("Current count compared with the allowed range.", "العدد الحالي مقارنة بالنطاق المسموح.")}</Typography.Text>
              </div>
              <DataTable
                className="year-group-rating-table"
                rowKey="level"
                pagination={false}
                dataSource={allowed}
                loading={group.isFetching}
                scroll={{ x: 480 }}
                locale={{ emptyText: t("No rating limits are configured.", "لم يتم إعداد حدود للتقديرات.") }}
                columns={[
                  {
                    title: t("Rating", "التقدير"),
                    dataIndex: "level",
                    width: 120,
                    render: (value: string | number) => <Typography.Text strong>{value}</Typography.Text>,
                  },
                  {
                    title: t("Allowed range", "النطاق المسموح"),
                    key: "range",
                    render: (_: any, record: any) => <span className="year-group-range">{record.min ?? "—"} – {record.max ?? "—"}</span>,
                  },
                  {
                    title: t("Current", "الحالي"),
                    key: "current",
                    align: "right",
                    width: 110,
                    render: (_: any, record: any) => {
                      const count = Number(g.counts?.[String(record.level)] ?? 0);
                      return <Typography.Text strong>{count}</Typography.Text>;
                    },
                  },
                ]}
              />

              {blockers.length > 0 ? (
                <Alert
                  className="year-group-blockers"
                  type="warning"
                  showIcon
                  title={t("Resolve these items before submitting", "عالج النقاط التالية قبل الإرسال")}
                  description={
                    <ul className="year-group-blocker-list">
                      {blockers.map((blocker: any, index: number) => {
                        const names = blockerMemberNames(Array.isArray(blocker.member_ids) ? blocker.member_ids : []);
                        return (
                          <li key={blocker.code || index}>
                            <span>{blockerLabel(blocker)}</span>
                            {names.length > 0 && <Typography.Text type="secondary">{names.join(ar ? "، " : ", ")}</Typography.Text>}
                          </li>
                        );
                      })}
                    </ul>
                  }
                />
              ) : (
                <Alert
                  className="year-group-ready-alert"
                  type="success"
                  showIcon
                  title={t("All checks passed", "تم اجتياز جميع الفحوصات")}
                  description={t("The group can be submitted for review.", "المجموعة جاهزة للإرسال للمراجعة.")}
                />
              )}

              <div className="year-group-submit-footer">
                <div className="year-group-submit-copy">
                  <Typography.Text strong>{g.can_submit ? t("Ready for submission", "جاهزة للإرسال") : t("Submission is unavailable", "الإرسال غير متاح حالياً")}</Typography.Text>
                  <Typography.Text type="secondary">
                    {g.can_submit
                      ? t("Submit the group to send it to the next review step.", "أرسل المجموعة للانتقال إلى خطوة المراجعة التالية.")
                      : t("Complete the required actions above to enable submission.", "أكمل الإجراءات المطلوبة بالأعلى لتفعيل الإرسال.")}
                  </Typography.Text>
                </div>
                <Popconfirm
                  title={t("Submit this group?", "إرسال هذه المجموعة؟")}
                  description={t("The group will be sent to the next review step.", "سيتم إرسال المجموعة إلى خطوة المراجعة التالية.")}
                  okText={t("Confirm submit", "تأكيد الإرسال")}
                  cancelText={t("Cancel", "إلغاء")}
                  onConfirm={() => submit.mutate()}
                  disabled={!g.can_submit || submit.isPending}
                >
                  <Button
                    type="primary"
                    size="large"
                    className="year-group-submit-button"
                    disabled={!g.can_submit}
                    loading={submit.isPending}
                  >
                    {t("Submit group", "إرسال المجموعة")}
                  </Button>
                </Popconfirm>
              </div>
            </Card>

            <Card
              className="year-group-team-card"
              title={t("Team evaluations", "تقييمات الفريق")}
              extra={<Typography.Text type="secondary">{rows.length} {t("members", "أعضاء")}</Typography.Text>}
            >
              <DataTable
                rowKey="cycle_member_id"
                dataSource={rows}
                loading={team.isFetching}
                scroll={{ x: 650 }}
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                locale={{ emptyText: t("No team evaluations found.", "لا توجد تقييمات للفريق.") }}
                columns={[
                  {
                    title: t("Employee", "الموظف"),
                    render: (_: any, record: any) => (
                      <Typography.Text strong>{record.employee?.name || record.employee?.full_name || "—"}</Typography.Text>
                    ),
                  },
                  {
                    title: t("Evaluation status", "حالة التقييم"),
                    dataIndex: "status",
                    render: (value: any) => <StatusTag value={value} ar={ar} map={EVALUATION_STATUS} />,
                  },
                  {
                    title: t("Overall score", "النتيجة"),
                    align: "right",
                    render: (_: any, record: any) => record.overall_bp == null ? "—" : `${(record.overall_bp / 100).toFixed(2)}%`,
                  },
                  { title: t("Rating", "التقدير"), dataIndex: "rating_level", align: "center" },
                ]}
              />
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
