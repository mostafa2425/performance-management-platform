"use client";

import type { ReactNode } from "react";
import { Space, Tag, Timeline, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import {
  stageHint,
  stageLabel,
  stageTimelineStatus,
  timelineStatusColor,
  type StageRow,
  type StageTimelineStatus,
} from "./shared";

const statusIcon: Record<StageTimelineStatus, ReactNode> = {
  completed: <CheckCircleOutlined />,
  current: <FlagOutlined />,
  upcoming: <ClockCircleOutlined />,
};

const statusDotColor: Record<StageTimelineStatus, string> = {
  completed: "green",
  current: "blue",
  upcoming: "gray",
};

export function CycleTimeline({
  stages,
  cycle,
}: {
  stages: StageRow[];
  cycle?: { status?: string | null; current_stage?: string | null } | null;
}) {
  const t = useTranslations("PerformanceCycles");
  const rows = [...stages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <Timeline
      mode="alternate"
      items={rows.map((s) => {
        const status = stageTimelineStatus(s, rows, cycle);
        const hint = stageHint(t, s.stage);
        return {
          color: statusDotColor[status],
          dot: statusIcon[status],
          content: (
            <Space orientation="vertical" size={2} style={{ maxWidth: 280 }}>
              <Space wrap size={[6, 4]}>
                <Typography.Text strong>{stageLabel(t, s.stage)}</Typography.Text>
                <Tag color={timelineStatusColor[status]}>{t(`timeline.${status}`)}</Tag>
              </Space>
              <Typography.Text type="secondary">
                {t("fields.deadline")}: {s.deadline_date || "—"}
              </Typography.Text>
              {s.cutoff_at && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t("fields.cutoff")}: {s.cutoff_at}
                </Typography.Text>
              )}
              {hint && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {hint}
                </Typography.Text>
              )}
            </Space>
          ),
        };
      })}
    />
  );
}
