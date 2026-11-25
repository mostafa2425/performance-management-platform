"use client";

import { Tag } from "antd";
import { CheckCircleFilled, ClockCircleOutlined, StopOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { statusColor, statusLabel, yearTagColor } from "./shared";

export function CycleStatusTag({ status }: { status?: string | null }) {
  const t = useTranslations("PerformanceCycles");
  const icon = status === "active" ? <CheckCircleFilled /> : status === "draft" ? <ClockCircleOutlined /> : status === "closed" ? <StopOutlined /> : undefined;
  return <Tag icon={icon} className="pmp-status-tag" color={statusColor(status ?? undefined)}>{statusLabel(t, status)}</Tag>;
}

export function CycleYearTag({ year }: { year?: number | string | null }) {
  if (year == null || year === "") return <Tag className="pmp-status-tag">—</Tag>;
  return <Tag className="pmp-status-tag" color={yearTagColor()}>{year}</Tag>;
}
