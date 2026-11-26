"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import { Alert, Avatar, Card, Col, Collapse, Descriptions, Drawer, Empty, Input, Progress, Row, Space, Spin, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { CheckCircleOutlined, ClockCircleOutlined, EditOutlined, FileTextOutlined, RollbackOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";
import { adminApi, cyclesApi, employeesApi, resultsApi } from "@/lib/api/endpoints";
import { PLAN_DISPLAY_STATUS, planStatusKeys } from "./shared";

export const planStatusQueryKey = (cycleId: string) => [
  "admin",
  "cycles",
  cycleId,
  "plan-status",
  "progress",
];

function managerName(row: any) {
  return (
    row.current_manager?.name ||
    row.current_manager?.full_name ||
    row.manager?.name ||
    row.manager?.full_name ||
    row.current_manager_name ||
    null
  );
}

export function CycleProgressPanel({ cycleId }: { cycleId: string }) {
  const t = useTranslations("PerformanceCycles");
  const ar = useLocale() === "ar";
  const local = (en: string, arabic: string) => ar ? arabic : en;
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const selectedEmployeeId = selectedMember?.employee?.id ?? selectedMember?.employee_id;
  const employee = useQuery({
    queryKey: ["employees", "detail", selectedEmployeeId],
    queryFn: () => employeesApi.get(selectedEmployeeId),
    enabled: selectedEmployeeId != null,
  });

  const plans = useQuery({
    queryKey: planStatusQueryKey(cycleId),
    queryFn: () => cyclesApi.planStatus(cycleId, { per_page: 200 }),
  });
  const groups = useQuery({
    queryKey: ["admin", "cycles", cycleId, "groups", "progress"],
    queryFn: () => adminApi.groups(Number(cycleId), { per_page: 100 }),
    retry: false,
  });
  const results = useQuery({
    queryKey: ["admin", "cycles", cycleId, "results", "progress"],
    queryFn: () => resultsApi.list(cycleId),
    retry: false,
  });

  const rows: any[] = useMemo(() => (plans.data as any)?.data || [], [plans.data]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const k of planStatusKeys) acc[k] = 0;
    for (const r of rows) {
      const statusKey = r.status?.key;
      const k = ({ pending_admin: "pending_admin_approval", pending_employee: "pending_employee_review", returned: "returned_to_manager", approved: "goals_approved" } as Record<string, string>)[statusKey] || statusKey;
      if (k in acc) acc[k] += 1;
    }
    return acc;
  }, [rows]);

  const pendingFinal = ((groups.data as any)?.data || []).filter((g: any) => g.status === "pending_admin").length;
  const finalized = Array.isArray(results.data) ? results.data.length : null;
  const totalPlans = rows.length;
  const employeePayload = (employee.data as any)?.data ?? employee.data;
  const selectedPerson = employeePayload?.employee ?? employeePayload ?? selectedMember?.employee ?? {};
  const selectedName = selectedPerson.full_name || selectedPerson.name || selectedMember?.employee?.name || selectedMember?.employee?.full_name || "—";
  const displayField = (value: any) => {
    if (value == null || value === "") return "—";
    if (typeof value === "object") return value[ar ? "ar" : "en"] || value.name || value.full_name || value.label || "—";
    return value;
  };  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };
  const statusMeta: Record<string, { icon: React.ReactNode; color: string }> = {
    not_started: { icon: <ClockCircleOutlined />, color: "#94a3b8" },
    draft: { icon: <EditOutlined />, color: "#3b82f6" },
    pending_admin_approval: { icon: <SendOutlined />, color: "#d97706" },
    returned_to_manager: { icon: <RollbackOutlined />, color: "#ea580c" },
    pending_employee_review: { icon: <UserOutlined />, color: "#8b5cf6" },
    goals_approved: { icon: <CheckCircleOutlined />, color: "#16a34a" },
  };

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, { id: string; name: string | null; rows: any[] }>();
    for (const r of rows) {
      const name = String(r.employee?.name || r.employee?.full_name || "").toLowerCase();
      if (q && !name.includes(q)) continue;
      const id = r.current_manager_id != null ? String(r.current_manager_id) : "none";
      const entry = map.get(id) || { id, name: managerName(r), rows: [] as any[] };
      if (!entry.name) entry.name = managerName(r);
      entry.rows.push(r);
      map.set(id, entry);
    }
    return Array.from(map.values());
  }, [rows, search]);

  if (plans.isLoading) {
    return (
      <Card title={t("progress.title")}>
        <div style={{ display: "grid", placeItems: "center", minHeight: 180 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }
  if (plans.isError) return <Alert type="error" showIcon title={(plans.error as Error).message} />;

  const statusTag = (v?: string | null) =>
    v ? (
      <Tag color={PLAN_DISPLAY_STATUS[v]?.color ?? "default"}>
        {v in PLAN_DISPLAY_STATUS ? t(`progress.${v as keyof typeof PLAN_DISPLAY_STATUS}`) : v}
      </Tag>
    ) : (
      <Tag>—</Tag>
    );

  return (
    <Card title={t("progress.title")}>
      <div className="cycle-progress-overview">
        <div className="cycle-progress-overview-heading">
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>{t("progress.title")}</Typography.Title>
            <Typography.Text type="secondary">{t("progress.employeesCount", { count: totalPlans })}</Typography.Text>
          </div>
          <div className="cycle-progress-total">
            <Typography.Text type="secondary">{t("fields.employeesInScope")}</Typography.Text>
            <Typography.Title level={2} style={{ margin: 0 }}>{totalPlans}</Typography.Title>
          </div>
        </div>
        <Row gutter={[12, 12]}>
          {planStatusKeys.map((k) => {
            const percent = totalPlans ? Math.round((counts[k] / totalPlans) * 100) : 0;
            return (
              <Col xs={24} sm={12} xl={8} key={k}>
                <Card className="cycle-progress-stat-card" size="small">
                  <div className="cycle-progress-stat-heading">
                    <span className="cycle-progress-stat-icon" style={{ color: statusMeta[k]?.color || "#64748b", background: (statusMeta[k]?.color || "#64748b") + "16" }}>
                      {statusMeta[k]?.icon || <FileTextOutlined /> }
                    </span>
                    <div className="cycle-progress-stat-label">
                      <Typography.Text strong>{t(`progress.${k as "draft"}`)}</Typography.Text>
                       
                    </div>
                    <div className="cycle-progress-stat-value">
                      <Typography.Title level={3}>{counts[k]}</Typography.Title>
                      <Typography.Text type="secondary">{percent}%</Typography.Text>
                    </div>
                  </div>
                  <Progress className="cycle-progress-status-bar" percent={percent} showInfo={false} strokeColor={statusMeta[k]?.color || "#64748b"} trailColor="#edf1f6" size={{ height: 9 }} />
                </Card>
              </Col>
            );
          })}
          {groups.isSuccess && (
            <Col xs={24} sm={12} xl={8}>
              {(() => {
                const percent = totalPlans ? Math.round((pendingFinal / totalPlans) * 100) : 0;
                return (
                  <Card className="cycle-progress-stat-card" size="small">
                    <div className="cycle-progress-stat-heading">
                      <span className="cycle-progress-stat-icon" style={{ color: "#d97706", background: "#d9770616" }}>
                        <FileTextOutlined />
                      </span>
                      <div className="cycle-progress-stat-label">
                        <Typography.Text strong>{t("progress.pendingFinal")}</Typography.Text>
                      </div>
                      <div className="cycle-progress-stat-value">
                        <Typography.Title level={3}>{pendingFinal}</Typography.Title>
                        <Typography.Text type="secondary">{percent}%</Typography.Text>
                      </div>
                    </div>
                    <Progress className="cycle-progress-status-bar" percent={percent} showInfo={false} strokeColor="#d97706" trailColor="#edf1f6" size={{ height: 9 }} />
                  </Card>
                );
              })()}
            </Col>
          )}
          {finalized != null && (
            <Col xs={24} sm={12} xl={8}>
              {(() => {
                const percent = totalPlans ? Math.round((finalized / totalPlans) * 100) : 0;
                return (
                  <Card className="cycle-progress-stat-card" size="small">
                    <div className="cycle-progress-stat-heading">
                      <span className="cycle-progress-stat-icon" style={{ color: "#16a34a", background: "#16a34a16" }}>
                        <CheckCircleOutlined />
                      </span>
                      <div className="cycle-progress-stat-label">
                        <Typography.Text strong>{t("progress.finalized")}</Typography.Text>
                      </div>
                      <div className="cycle-progress-stat-value">
                        <Typography.Title level={3}>{finalized}</Typography.Title>
                        <Typography.Text type="secondary">{percent}%</Typography.Text>
                      </div>
                    </div>
                    <Progress className="cycle-progress-status-bar" percent={percent} showInfo={false} strokeColor="#16a34a" trailColor="#edf1f6" size={{ height: 9 }} />
                  </Card>
                );
              })()}
            </Col>
          )}
        </Row>
      </div>

      <Input.Search
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("progress.searchEmployee")}
        style={{ maxWidth: 360, marginBottom: 16 }}
      />

      {grouped.length === 0 ? (
        <Empty description={t("progress.noRows")} />
      ) : (
        <Collapse
          items={grouped.map((g) => ({
            key: g.id,
            label: (
              <Space wrap size={[8, 4]}>
                <Typography.Text strong>
                  {g.name || (g.id === "none" ? t("progress.noManager") : `#${g.id}`)}
                </Typography.Text>
                <Tag>{t("progress.employeesCount", { count: g.rows.length })}</Tag>
              </Space>
            ),
            children: (
              <DataTable
                rowKey={(r: any) => r.cycle_member_id ?? r.employee?.id}
                size="small"
                pagination={false}
                dataSource={g.rows}
                onRow={(record: any) => ({
                  onClick: () => setSelectedMember(record),
                  className: "cycle-progress-employee-row",
                })}
                columns={[
                  {
                    title: t("fields.employee"),
                    render: (_: unknown, r: any) => r.employee?.name || r.employee?.full_name || "—",
                  },
                  {
                    title: t("fields.employeeCode"),
                    render: (_: unknown, r: any) => r.employee?.code || "—",
                  },
                  {
                    title: t("fields.status"),
                    dataIndex: "status",
                    render: (v: { key?: string; label?: string }) => <Tag color={PLAN_DISPLAY_STATUS[({ pending_admin: "pending_admin_approval", pending_employee: "pending_employee_review", returned: "returned_to_manager", approved: "goals_approved" } as Record<string, string>)[v?.key || ""] || v?.key || ""]?.color ?? "default"}>{v?.label || "—"}</Tag>,
                  },
                  {
                    title: t("fields.attention"),
                    dataIndex: "requires_admin_attention",
                    render: (v: boolean) => (v ? <Tag color="orange">{t("progress.required")}</Tag> : "—"),
                  },
                ]}
              />
            ),
          }))}
        />
      )}
      <Drawer open={Boolean(selectedMember)} onClose={() => setSelectedMember(null)} title={t("fields.employee")} width={520} destroyOnHidden>
        {selectedMember ? (
          <div className="cycle-employee-drawer">
            {employee.isLoading ? (
              <div className="cycle-employee-drawer-loading"><Spin size="large" /></div>
            ) : employee.isError ? (
              <Alert type="error" showIcon title={(employee.error as Error).message} />
            ) : (
              <>
                <div className="cycle-employee-profile">
                  <Avatar size={60} style={{ background: "#e8eef8", color: "#163366", fontWeight: 700 }}>
                    {String(selectedName).split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase()}
                  </Avatar>
                  <div className="cycle-employee-profile-copy">
                    <Typography.Title level={4} style={{ margin: 0 }}>{selectedName}</Typography.Title>
                    <Typography.Text type="secondary">{selectedPerson.email || "—"}</Typography.Text>
                    <div className="cycle-employee-tags">
                      <Tag color={selectedPerson.is_active === false || selectedPerson.status === "inactive" ? "default" : "success"}>{selectedPerson.status === "active" || selectedPerson.is_active ? local("Active", "نشط") : displayField(selectedPerson.status)}</Tag>
                      <Tag color={PLAN_DISPLAY_STATUS[({ pending_admin: "pending_admin_approval", pending_employee: "pending_employee_review", returned: "returned_to_manager", approved: "goals_approved" } as Record<string, string>)[selectedMember.status?.key || ""] || selectedMember.status?.key || ""]?.color ?? "default"}>{selectedMember.status?.label || "—"}</Tag>
                      {selectedPerson.employment_type ? <Tag color="cyan">{displayField(selectedPerson.employment_type)}</Tag> : null}
                      {selectedMember.requires_admin_attention ? <Tag color="orange">{t("progress.required")}</Tag> : null}
                    </div>
                  </div>
                </div>
                <Typography.Title level={5}>{local("Employment information", "البيانات الوظيفية")}</Typography.Title>
                <Descriptions bordered size="small" column={1} items={[
                  { key: "code", label: t("fields.employeeCode"), children: (selectedPerson.code || selectedPerson.employee_code) ? <Typography.Text copyable={{ text: String(selectedPerson.code || selectedPerson.employee_code) }}>{selectedPerson.code || selectedPerson.employee_code}</Typography.Text> : "—" },
                  { key: "job", label: local("Job title", "المسمى الوظيفي"), children: displayField(selectedPerson.job_title) },
                  { key: "department", label: local("Department", "الإدارة"), children: displayField(selectedPerson.department) },
                  { key: "unit", label: local("Business unit", "وحدة الأعمال"), children: displayField(selectedPerson.business_unit) },
                  { key: "location", label: local("Location", "الموقع"), children: displayField(selectedPerson.location) },
                  { key: "joining", label: local("Joining date", "تاريخ التعيين"), children: formatDate(selectedPerson.joining_date) },
                  { key: "termination", label: local("Termination date", "تاريخ انتهاء الخدمة"), children: formatDate(selectedPerson.terminate_date) },
                  { key: "manager", label: local("Line manager", "المدير المباشر"), children: displayField(selectedMember.current_manager || selectedPerson.line_manager) !== "—" ? displayField(selectedMember.current_manager || selectedPerson.line_manager) : (selectedPerson.line_manager_id ?? "—") },
                ]} />
                <Typography.Title level={5} style={{ marginTop: 22 }}>{local("Contact & system information", "بيانات التواصل والنظام")}</Typography.Title>
                <Descriptions bordered size="small" column={1} items={[
                  { key: "email", label: local("Work email", "البريد الإلكتروني للعمل"), children: selectedPerson.email ? <Space size={8} wrap><Typography.Link href={`mailto:${selectedPerson.email}`}>{selectedPerson.email}</Typography.Link><Typography.Text copyable={{ text: String(selectedPerson.email) }} /></Space> : "—" },
                  { key: "phone", label: local("Phone", "رقم الهاتف"), children: selectedPerson.phone || selectedPerson.mobile || "—" },
                  { key: "jisr", label: "Jisr ID", children: selectedPerson.jisr_id || "—" },
                  { key: "plan", label: local("Performance plan", "خطة الأداء"), children: selectedMember.plan_id ?? "—" },
                ]} />
              </>
            )}
          </div>
        ) : null}
      </Drawer>
    </Card>
  );
}
