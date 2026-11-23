"use client";

import { Alert, Collapse, Empty, Space, Spin, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { plansApi } from "@/lib/api/endpoints";
import { PlanReadonlyTree } from "./plan-readonly-tree";
import { formatInstant } from "./plan-shared";

const REASON_LABELS: Record<string, [string, string]> = {
  submit: ["Submitted version", "إصدار عند الإرسال"],
  employee_approved: ["Employee-approved version", "الإصدار المعتمد من الموظف"],
  admin_approved: ["Admin-approved version", "الإصدار المعتمد من الإدارة"],
};

export function PlanSnapshotsPanel({ planId, ar }: { planId: number; ar: boolean }) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const snapshots = useQuery({
    queryKey: ["plans", planId, "snapshots"],
    queryFn: () => plansApi.snapshots(planId),
    enabled: Boolean(planId),
  });

  if (snapshots.isLoading) return <Spin />;
  if (snapshots.isError) {
    return <Alert type="error" showIcon title={(snapshots.error as Error).message} />;
  }

  const rows = (snapshots.data || []) as any[];
  if (!rows.length) {
    return <Empty description={t("No saved plan versions yet.", "لا توجد إصدارات محفوظة للخطة بعد.")} />;
  }

  return (
    <Collapse
      items={rows.map((snapshot, index) => {
        const reason = REASON_LABELS[snapshot.reason] || [
          String(snapshot.reason || t("Saved version", "إصدار محفوظ")).replaceAll("_", " "),
          String(snapshot.reason || t("إصدار محفوظ", "إصدار محفوظ")).replaceAll("_", " "),
        ];
        return {
          key: String(snapshot.id ?? snapshot.plan_version ?? index),
          label: (
            <Space wrap size={8}>
              <Typography.Text strong>
                {t("Version", "الإصدار")} {snapshot.plan_version ?? index + 1}
              </Typography.Text>
              <Tag color="blue">{ar ? reason[1] : reason[0]}</Tag>
              <Typography.Text type="secondary">
                {snapshot.created_by_name || "—"} · {formatInstant(snapshot.created_at, ar)}
              </Typography.Text>
            </Space>
          ),
          children: (
            <PlanReadonlyTree
              ar={ar}
              objectives={snapshot.objectives || []}
            />
          ),
        };
      })}
    />
  );
}
