"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import { Alert, App, Avatar, Button, Card, Col, Empty, Input, Row, Select, Space, Skeleton, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cyclesApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { planStatusTag } from "./plans/plan-shared";

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

function StatusTag({ value, ar, map }: { value?: string | null; ar: boolean; map: Record<string, StatusMeta> }) {
  if (!value) return <Tag>—</Tag>;
  const meta = map[value] ?? { en: value, ar: value, color: "default" };
  return <Tag color={meta.color}>{ar ? meta.ar : meta.en}</Tag>;
}

function useManagerCycle() {
  const cycles = useQuery({ queryKey: ["cycles"], queryFn: cyclesApi.mine });
  const [selectedCycleId, setSelectedCycleId] = useState<number | null | undefined>(undefined);
  const options = (cycles.data || [])
    .filter((cycle: { my_roles?: { manager?: boolean; member?: boolean }; id: number; name?: { en?: string } | string; performance_year?: number }) => cycle.my_roles?.manager || cycle.my_roles?.member)
    .map((cycle: { id: number; name?: { en?: string } | string; performance_year?: number }) => ({
      value: cycle.id,
      label: `${typeof cycle.name === "object" ? cycle.name?.en ?? "" : cycle.name ?? ""} · ${cycle.performance_year ?? ""}`,
    }));
  const firstOptionId = options[0]?.value;
  const cycleId = selectedCycleId === undefined ? firstOptionId : selectedCycleId ?? undefined;
  const setCycleId = (value: number | undefined) => setSelectedCycleId(value ?? null);

  return { cycleId, setCycleId, options, cycles };
}

export function ApiManagerTeamWorkspace() {
  const ar = useLocale() === "ar";
  const locale = useLocale();
  const router = useRouter();
  const { cycleId, setCycleId, options, cycles } = useManagerCycle();
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
        "UC-010 · Open a direct report to view performance details for the selected cycle.",
        "UC-010 · افتح موظفاً مباشراً لعرض تفاصيل الأداء للدورة المحددة.",
      )}
    >
      <div className="manager-team-workspace">
        <Card className="manager-team-cycle-card" variant="outlined">
          <div className="manager-team-toolbar">
            <div>
              <Typography.Title level={5}>{t("Performance cycle", "دورة الأداء")}</Typography.Title>
              <Typography.Text type="secondary">{t("Choose a cycle to review your direct reports.", "اختر دورة لمراجعة الموظفين التابعين لك.")}</Typography.Text>
            </div>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: 380, maxWidth: "100%" }}
              placeholder={t("Select cycle", "اختر الدورة")}
              value={cycleId}
              onChange={setCycleId}
              options={options}
              loading={cycles.isFetching}
            />
          </div>
        </Card>

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
        .manager-team-workspace { display: grid; gap: 14px; min-width: 0; }
        .manager-team-cycle-card, .manager-team-list-card { border-color: #e2e8f0; border-radius: 12px; }
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
        .manager-team-list-filters { margin-bottom: 12px; }
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
  const { cycleId, setCycleId, options, cycles } = useManagerCycle();
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
  });
  const g = group.data as any;
  const rows = (team.data as any)?.data || [];

  return (
    <AppShell
      role="manager"
      title={t("Manager–Year Group", "مجموعة المدير والسنة")}
      subtitle={t("Review team ratings and submit the group when ready.", "راجع تقديرات الفريق وأرسل المجموعة عند الجاهزية.")}
    >
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Select
            allowClear
            style={{ width: 360, maxWidth: "100%" }}
            placeholder={t("Select cycle", "اختر الدورة")}
            value={cycleId}
            onChange={setCycleId}
            options={options}
            loading={cycles.isFetching}
          />
        </Card>
        {!cycleId ? (
          <Empty description={t("Select a cycle.", "اختر دورة.")} />
        ) : group.isError ? (
          <Alert type="error" title={(group.error as Error).message} />
        ) : (
          <>
            {group.isFetching ? (
              <Card title={t("Group readiness", "جاهزية المجموعة")}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            ) : g ? (
              <Card
                title={t("Group readiness", "جاهزية المجموعة")}
                extra={<StatusTag value={g.status} ar={ar} map={GROUP_STATUS} />}
              >
                <Space wrap>
                  <Typography.Text>
                    {t("Members", "الأعضاء")}: {g.n}
                  </Typography.Text>
                  <Typography.Text>
                    {t("Group version", "إصدار المجموعة")}: {g.version ?? "—"}
                  </Typography.Text>
                  <Typography.Text>
                    {t("Latest submission", "آخر إرسال")}: {g.latest_submission_no ?? "—"}
                  </Typography.Text>
                </Space>
                <DataTable
                  rowKey="level"
                  pagination={false}
                  dataSource={g.allowed || []}
                  columns={[
                    { title: t("Rating level", "مستوى التقدير"), dataIndex: "level" },
                    { title: t("Minimum", "الحد الأدنى"), dataIndex: "min" },
                    { title: t("Maximum", "الحد الأعلى"), dataIndex: "max" },
                    {
                      title: t("Current count", "العدد الحالي"),
                      render: (_: any, r: any) => g.counts?.[String(r.level)] ?? 0,
                    },
                  ]}
                />
                {g.blockers?.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    title={t("Submission blockers", "عوائق الإرسال")}
                    description={
                      <ul>
                        {g.blockers.map((b: any, i: number) => (
                          <li key={i}>
                            {b.code} {b.member_ids?.length ? `(${b.member_ids.join(", ")})` : ""}
                          </li>
                        ))}
                      </ul>
                    }
                  />
                )}
                <Button type="primary" disabled={!g.can_submit} loading={submit.isPending} onClick={() => submit.mutate()}>
                  {t("Submit complete group", "إرسال المجموعة كاملة")}
                </Button>
              </Card>
            ) : null}
            <Card title={t("Team evaluation status", "حالة تقييم الفريق")}>
              <DataTable
                rowKey="cycle_member_id"
                dataSource={rows}
                loading={team.isFetching}
                columns={[
                  {
                    title: t("Employee", "الموظف"),
                    render: (_: any, r: any) => r.employee?.name || r.employee?.full_name,
                  },
                  {
                    title: t("Evaluation status", "حالة التقييم"),
                    dataIndex: "status",
                    render: (v: string) => <StatusTag value={v} ar={ar} map={EVALUATION_STATUS} />,
                  },
                  {
                    title: t("Overall score", "النتيجة الإجمالية"),
                    render: (_: any, r: any) => (r.overall_bp == null ? "—" : `${(r.overall_bp / 100).toFixed(2)}%`),
                  },
                  { title: t("Rating", "التقدير"), dataIndex: "rating_level" },
                  {
                    title: t("Evidence required", "يتطلب دليل"),
                    dataIndex: "requires_evidence",
                    render: (v: boolean) => (v ? t("Yes", "نعم") : "—"),
                  },
                ]}
              />
            </Card>
          </>
        )}
      </Space>
    </AppShell>
  );
}
