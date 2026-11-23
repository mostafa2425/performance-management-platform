"use client";

import { Tag } from "antd";
import { useTranslations } from "next-intl";
import { statusColor, statusLabel, yearTagColor } from "./shared";

export function CycleStatusTag({ status }: { status?: string | null }) {
  const t = useTranslations("PerformanceCycles");
  return <Tag color={statusColor(status ?? undefined)}>{statusLabel(t, status)}</Tag>;
}

export function CycleYearTag({ year }: { year?: number | string | null }) {
  if (year == null || year === "") return <Tag>—</Tag>;
  return <Tag color={yearTagColor()}>{year}</Tag>;
}
