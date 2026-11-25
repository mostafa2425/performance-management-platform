"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Alert, Avatar, Button, Card, Empty, Input, Space, Typography } from "antd";
import { ArrowRightOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { usePerformanceCycle } from "@/features/performance-cycles/performance-cycle-provider";
import { plansApi } from "@/lib/api/endpoints";
import { planStatusTag } from "@/features/api/plans/plan-shared";
import "./manager-evaluation-list-workspace.css";

function localized(value: any, ar: boolean) {
  if (value == null) return "—";
  if (typeof value === "object") return (ar ? value.ar || value.en : value.en || value.ar) || "—";
  return String(value);
}

export default function ApiManagerEvaluationWorkspace() {
  const ar = useLocale() === "ar";
  const locale = ar ? "ar" : "en";
  const [search, setSearch] = useState("");
  const { cycleId, activeCycleLabel } = usePerformanceCycle();
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const plans = useQuery({
    queryKey: ["plans", "manager-evaluation-approved", cycleId],
    queryFn: () => plansApi.list({ filter: { status: "approved", ...(cycleId ? { cycle_id: cycleId } : {}) }, per_page: 100 }),
    enabled: Boolean(cycleId),
  });
  const rows = (plans.data as any)?.data || [];
  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return rows;
    return rows.filter((plan: any) => [
      plan.employee?.name,
      plan.employee?.full_name,
      plan.employee?.code,
      plan.id,
      plan.cycle_id,
      plan.cycle?.name?.en,
      plan.cycle?.name?.ar,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(term)));
  }, [rows, search]);

  return (
    <AppShell
      role="manager"
      title={t("Manager evaluation", "تقييم المدير")}
      subtitle={t(
        "Select an approved employee plan to record KPI actuals and annual competency ratings.",
        "اختر خطة موظف معتمدة لتسجيل القيم الفعلية لمؤشرات الأداء وتقييم الكفاءات السنوية.",
      )}
    >
      <div className="manager-evaluation-list-workspace">
        {plans.isError ? <Alert type="error" showIcon title={(plans.error as Error).message} action={<Button onClick={() => plans.refetch()}>{t("Retry", "إعادة المحاولة")}</Button>} /> : null}

        <Card className="evaluation-approved-plans-card" variant="outlined">
          <div className="evaluation-approved-plans-heading">
            <div>
              <Typography.Title level={5}>{t("Approved employee plans", "خطط الموظفين المعتمدة")}</Typography.Title>
              <Typography.Text type="secondary">{t("Open a plan to view its evaluation workspace.", "افتح الخطة للانتقال إلى مساحة التقييم الخاصة بها.")}</Typography.Text>
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Search employee, code or plan", "ابحث عن موظف أو رقم وظيفي أو خطة")}
              className="evaluation-approved-search"
            />
          </div>
          <DataTable
              className="evaluation-approved-plans-table"
              ariaLabel={t("Approved employee plans", "خطط الموظفين المعتمدة")}
              rowKey="id"
              dataSource={filteredRows}
              loading={plans.isFetching}
              scroll={{ x: true }}
              pagination={{ pageSize: 10, showSizeChanger: true, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty description={t(rows.length ? "No plans match your search." : "No approved plans are available.", rows.length ? "لا توجد خطط تطابق البحث." : "لا توجد خطط معتمدة متاحة.")} /> }}
              columns={[
                {
                  title: t("Employee", "الموظف"),
                  key: "employee",
                  render: (_: any, record: any) => {
                    const name = localized(record.employee?.name || record.employee?.full_name, ar);
                    const initials = name.split(/\s+/).slice(0, 2).map((part: string) => part[0] || "").join("").toLocaleUpperCase();
                    return (
                      <Space size={10}>
                        <Avatar size={36}>{initials || <UserOutlined />}</Avatar>
                        <Space orientation="vertical" size={0}>
                          <Typography.Text strong>{name}</Typography.Text>
                          <Typography.Text type="secondary" className="evaluation-employee-code">{record.employee?.code ? `#${record.employee.code}` : "—"}</Typography.Text>
                        </Space>
                      </Space>
                    );
                  },
                },
                {
                  title: t("Performance cycle", "دورة الأداء"),
                  key: "cycle",
                  render: () => (
                    <Typography.Text strong>{activeCycleLabel || "—"}</Typography.Text>
                  ),
                },
                {
                  title: t("Plan status", "حالة الخطة"),
                  dataIndex: "status",
                  render: (value: any, record: any) => {
                    const status = value && typeof value === "object"
                      ? value
                      : record.status && typeof record.status === "object"
                        ? record.status
                        : { key: "approved", label: t("Approved", "معتمدة") };
                    return planStatusTag(status, ar);
                  },
                },
                {
                  title: t("Last updated", "آخر تحديث"),
                  dataIndex: "updated_at",
                  render: (value: string) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" }).format(new Date(value)) : "—",
                },
                {
                  title: t("Actions", "الإجراءات"),
                  key: "actions",
                  width: 170,
                  align: ar ? "left" : "right",
                  render: (_: any, record: any) => (
                    <Link href={`/${locale}/manager/evaluation/${record.id}`}>
                      <Button type="primary" size="small" icon={<ArrowRightOutlined />} iconPlacement={ar ? "start" : "end"}>
                        {t("Open evaluation", "فتح التقييم")}
                      </Button>
                    </Link>
                  ),
                },
              ]}
          />
        </Card>
      </div>
    </AppShell>
  );
}
