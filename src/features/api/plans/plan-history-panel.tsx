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
  // Use the API action key, not the status label, to select the timeline icon.
  const actionMeta: Record<string, any> = {
    plan_created: { icon: <FileAddOutlined />, tone: "info" },
    plan_content_saved: { icon: <EditOutlined />, tone: "default" },
    plan_submitted: { icon: <SendOutlined />, tone: "processing" },
    plan_approved_by_admin: { icon: <CheckCircleFilled />, tone: "success" },
    plan_approved_by_employee: { icon: <FileDoneOutlined />, tone: "success" },
    plan_returned: { icon: <RollbackOutlined />, tone: "warning" },
    plan_modification_requested: { icon: <MessageOutlined />, tone: "warning" },
    plan_attention_comment: { icon: <MessageOutlined />, tone: "warning" },
    plan_reopened: { icon: <EditOutlined />, tone: "processing" },
    evaluation_saved: { icon: <EditOutlined />, tone: "default" },
    evaluation_submitted: { icon: <SendOutlined />, tone: "processing" },
    evaluation_completed: { icon: <FileDoneOutlined />, tone: "success" },
  };

  return actionMeta[action] || { icon: <ClockCircleOutlined />, tone: "default" };
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
  if (history.isLoading) {
    return (
      <Space orientation="vertical" size={20} style={{ width: "100%" }}>
        {[0, 1, 2, 3].map((item) => (
          <Space key={item} align="start" size={12} style={{ width: "100%" }}>
            <Skeleton.Avatar active size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton active title={{ width: "54%" }} paragraph={{ rows: 2, width: ["34%", "76%"] }} />
            </div>
          </Space>
        ))}
      </Space>
    );
  }
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
      mode="alternate"
      items={rows.map((event, index) => {
        const meta = historyMeta(event.action || "");
        const actor = event.actor?.name || t("System", "النظام");
        return {
          dot: (
            <span className={`plan-workflow-timeline-dot plan-workflow-timeline-dot--${meta.tone}`}>
              {meta.icon}
            </span>
          ),
          content: (
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
