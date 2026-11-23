"use client";

import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Empty, Select, Space, Spin, Table, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";

type StatusMeta = { en: string; ar: string; color: string };

const PLAN_DISPLAY_STATUS: Record<string, StatusMeta> = {
  not_started: { en: "Not started", ar: "لم تبدأ", color: "default" },
  draft: { en: "Draft", ar: "مسودة", color: "blue" },
  pending_admin_approval: { en: "Pending admin approval", ar: "بانتظار اعتماد الإدارة", color: "gold" },
  returned_to_manager: { en: "Returned to manager", ar: "معاد للمدير", color: "orange" },
  pending_employee_review: { en: "Pending employee review", ar: "بانتظار مراجعة الموظف", color: "purple" },
  goals_approved: { en: "Goals approved", ar: "تم اعتماد الأهداف", color: "green" },
};

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
  const [cycleId, setCycleId] = useState<number>();
  const options = (cycles.data || [])
    .filter((c: any) => c.my_roles?.manager || c.my_roles?.member)
    .map((c: any) => ({ value: c.id as number, label: `${c.name?.en || c.name} · ${c.performance_year}` }));
  const firstOptionId = options[0]?.value;

  useEffect(() => {
    if (firstOptionId == null) return;
    setCycleId((prev) => (prev == null ? firstOptionId : prev));
  }, [firstOptionId]);

  return { cycleId, setCycleId, options, cycles };
}

export function ApiManagerTeamWorkspace() {
  const ar = useLocale() === "ar";
  const { cycleId, setCycleId, options, cycles } = useManagerCycle();
  const t = (e: string, a: string) => (ar ? a : e);
  const q = useQuery({
    queryKey: ["cycles", cycleId, "plan-status"],
    queryFn: () => cyclesApi.planStatus(cycleId!, { per_page: 100 }),
    enabled: Boolean(cycleId),
  });
  const rows = (q.data as any)?.data || [];

  return (
    <AppShell
      role="manager"
      title={t("My team", "فريقي")}
      subtitle={t("Live team membership and plan status for the selected cycle.", "أعضاء الفريق وحالة الخطط المباشرة للدورة المحددة.")}
    >
      <Card>
        <Select
          allowClear
          style={{ width: 360, maxWidth: "100%", marginBottom: 16 }}
          placeholder={t("Select cycle", "اختر الدورة")}
          value={cycleId}
          onChange={setCycleId}
          options={options}
        />
        {cycles.isLoading || q.isLoading ? (
          <Spin />
        ) : q.isError ? (
          <Alert type="error" title={(q.error as Error).message} />
        ) : !cycleId ? (
          <Empty description={t("Select a cycle to view your team.", "اختر دورة لعرض فريقك.")} />
        ) : (
          <Table
            rowKey="cycle_member_id"
            dataSource={rows}
            columns={[
              {
                title: t("Employee", "الموظف"),
                render: (_: any, r: any) => r.employee?.name || r.employee?.full_name,
              },
              {
                title: t("Employee code", "الرقم الوظيفي"),
                render: (_: any, r: any) => r.employee?.code || "—",
              },
              {
                title: t("Plan status", "حالة الخطة"),
                dataIndex: "display_status",
                render: (v: string) => <StatusTag value={v} ar={ar} map={PLAN_DISPLAY_STATUS} />,
              },
              {
                title: t("Admin attention", "يتطلب متابعة الإدارة"),
                dataIndex: "requires_admin_attention",
                render: (v: boolean) =>
                  v ? <Tag color="orange">{t("Required", "مطلوب")}</Tag> : "—",
              },
            ]}
          />
        )}
      </Card>
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
          />
        </Card>
        {cycles.isLoading || group.isLoading || team.isLoading ? (
          <Spin />
        ) : group.isError ? (
          <Alert type="error" title={(group.error as Error).message} />
        ) : !cycleId ? (
          <Empty description={t("Select a cycle.", "اختر دورة.")} />
        ) : (
          g && (
            <>
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
                <Table
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
              <Card title={t("Team evaluation status", "حالة تقييم الفريق")}>
                <Table
                  rowKey="cycle_member_id"
                  dataSource={rows}
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
          )
        )}
      </Space>
    </AppShell>
  );
}
