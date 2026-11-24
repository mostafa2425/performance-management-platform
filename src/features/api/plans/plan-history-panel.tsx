"use client";

import { Alert, Empty, Spin, Timeline, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { plansApi } from "@/lib/api/endpoints";
import {
  formatInstant,
  historyActionLabel,
  returnSourceLabel,
} from "./plan-shared";

function formatHistoryValue(value: unknown): string {
  if (typeof value === "string") return value.replaceAll("_", " ");
  if (typeof value === "number") return String(value);\n  if (value && typeof value === "object" && "label" in value) return String((value as { label?: unknown }).label || (value as { key?: unknown }).key || "—");
  return "—";
}

export function PlanHistoryPanel({
  planId,
  ar,
  enabled = true,
}: {
  planId?: number | null;
  ar: boolean;
  enabled?: boolean;
}) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const history = useQuery({
    queryKey: ["plans", planId, "history"],
    queryFn: () => plansApi.history(planId!),
    enabled: Boolean(planId) && enabled,
  });

  if (!planId) return null;
  if (history.isLoading) return <Spin />;
  if (history.isError) {
    return <Alert type="error" showIcon title={(history.error as Error).message} />;
  }

  const rows = (history.data || []) as any[];
  if (!rows.length) {
    return <Empty description={t("No workflow history yet.", "لا يوجد سجل سير عمل بعد.")} />;
  }

  return (
    <Timeline
      items={rows.map((event) => ({
        children: (
          <div>
            <Typography.Text strong>
              {historyActionLabel(event.action, ar)}
            </Typography.Text>
            <div>
              <Typography.Text type="secondary">
                {event.actor?.name || "—"} · {formatInstant(event.created_at, ar)}
              </Typography.Text>
            </div>
            {(event.from || event.to) && (
              <Typography.Paragraph style={{ marginBottom: 4 }} type="secondary">
                {formatHistoryValue(event.from)} →{" "}
                {formatHistoryValue(event.to)}
              </Typography.Paragraph>
            )}
            {event.return_source ? (
              <Typography.Paragraph style={{ marginBottom: 4 }}>
                {returnSourceLabel(event.return_source, ar)}
              </Typography.Paragraph>
            ) : null}
            {event.comment ? (
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {event.comment}
              </Typography.Paragraph>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}
