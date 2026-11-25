"use client";

import { Alert, Avatar, Empty, Skeleton, Space, Tag, Timeline, Typography } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  EditOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  MessageOutlined,
  RollbackOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { plansApi } from "@/lib/api/endpoints";
import {
  formatInstant,
  historyActionLabel,
  returnSourceLabel,
} from "./plan-shared";

function formatHistoryValue(value: unknown): string {
  if (typeof value === "string") return value.replaceAll("_", " ");
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "label" in value) {
    return String((value as { label?: unknown }).label || (value as { key?: unknown }).key || "—");
  }
  return "—";
}

function historyMeta(action: string) {
  const key = action.toLowerCase();
  if (key.includes("approved")) return { icon: <CheckCircleFilled />, tone: "success" };
  if (key.includes("returned") || key.includes("reopen")) return { icon: <RollbackOutlined />, tone: "warning" };
  if (key.includes("submitted")) return { icon: <SendOutlined />, tone: "processing" };
  if (key.includes("created")) return { icon: <FileAddOutlined />, tone: "info" };
  if (key.includes("saved") || key.includes("content")) return { icon: <EditOutlined />, tone: "default" };
  if (key.includes("comment") || key.includes("modification")) return { icon: <MessageOutlined />, tone: "warning" };
  if (key.includes("complete")) return { icon: <FileDoneOutlined />, tone: "success" };
  return { icon: <ClockCircleOutlined />, tone: "default" };
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
  if (history.isLoading) return <Skeleton active />;
  if (history.isError) {
    return <Alert type="error" showIcon title={(history.error as Error).message} />;
  }

  const rows = (history.data || []) as any[];
  if (!rows.length) {
    return <Empty description={t("No workflow history yet.", "لا يوجد سجل سير عمل بعد.")} />;
  }

  return (
    <Timeline
      className="plan-workflow-timeline"
      mode="left"
      items={rows.map((event, index) => {
        const meta = historyMeta(event.action || "");
        const actor = event.actor?.name || t("System", "النظام");
        return {
          dot: (
            <span className={`plan-workflow-timeline-dot plan-workflow-timeline-dot--${meta.tone}`}>
              {meta.icon}
            </span>
          ),
          children: (
            <article className="plan-workflow-event" key={event.id || `${event.action}-${index}`}>
              <div className="plan-workflow-event-heading">
                <div className="plan-workflow-event-title">
                  <Typography.Text strong>{historyActionLabel(event.action, ar)}</Typography.Text>
                  {event.to ? (
                    <Tag color={meta.tone === "success" ? "success" : meta.tone === "warning" ? "warning" : "default"}>
                      {formatHistoryValue(event.to)}
                    </Tag>
                  ) : null}
                </div>
                <Typography.Text type="secondary" className="plan-workflow-event-date">
                  {formatInstant(event.created_at, ar)}
                </Typography.Text>
              </div>
              <Space size={7} className="plan-workflow-event-actor">
                <Avatar size={22} icon={<UserOutlined />} />
                <Typography.Text type="secondary">{actor}</Typography.Text>
              </Space>
              {(event.from || event.to) ? (
                <div className="plan-workflow-event-transition">
                  <span>{formatHistoryValue(event.from || "—")}</span>
                  <span className="plan-workflow-event-arrow">→</span>
                  <strong>{formatHistoryValue(event.to || "—")}</strong>
                </div>
              ) : null}
              {event.return_source ? (
                <div className="plan-workflow-event-note">{returnSourceLabel(event.return_source, ar)}</div>
              ) : null}
              {event.comment ? (
                <div className="plan-workflow-event-comment">
                  <MessageOutlined />
                  <span>{event.comment}</span>
                </div>
              ) : null}
            </article>
          ),
        };
      })}
    />
  );
}
