"use client";

import { DataTable } from "@/components/ui/data-table";

import type { ReactNode } from "react";
import { Space, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useLocale, useTranslations } from "next-intl";
import {
  ELIGIBILITY_STATUS_COLOR,
  candidateEmployeeId,
  candidateName,
  reasonText,
} from "./shared";

const KNOWN = ["included", "under_6_months", "in_other_active_cycle", "excluded", "excluded_rule", "excluded_by_scope", "removed", "missed"] as const;

export function EligibilityStatusTag({ status }: { status?: string | null }) {
  const t = useTranslations("PerformanceCycles");
  if (!status) return <Tag>—</Tag>;
  const known = (KNOWN as readonly string[]).includes(status);
  return (
    <Tag color={ELIGIBILITY_STATUS_COLOR[status] ?? "default"}>
      {known ? t(`eligibility.status.${status as (typeof KNOWN)[number]}`) : status}
    </Tag>
  );
}

export function CycleEligibilityPreview({
  rows,
  pageSize = 8,
  loading,
  renderAction,
  emptyText,
}: {
  rows: any[];
  pageSize?: number;
  loading?: boolean;
  renderAction?: (row: any) => ReactNode;
  emptyText?: string;
}) {
  const t = useTranslations("PerformanceCycles");
  const ar = useLocale() === "ar";

  const columns: ColumnsType<any> = [
    {
      title: t("fields.employee"),
      render: (_: unknown, row: any) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{candidateName(row, ar)}</Typography.Text>
          {candidateEmployeeId(row) != null ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("fields.employeeCode")}: {candidateEmployeeId(row)}
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: t("fields.status"),
      dataIndex: "status",
      render: (v: string) => <EligibilityStatusTag status={v} />,
    },
    {
      title: t("fields.source"),
      dataIndex: "eligibility_source",
      render: (v: string) => v || "—",
    },
    {
      title: t("fields.reason"),
      render: (_: unknown, row: any) => reasonText(row.reason ?? row.reasons, ar),
    },
  ];

  if (renderAction) {
    columns.push({
      title: t("fields.action"),
      width: 140,
      render: (_: unknown, row: any) => renderAction(row),
    });
  }

  return (
    <DataTable
      rowKey={(row: any, i: number | undefined) => String(candidateEmployeeId(row) ?? i)}
      size="middle"
      loading={loading}
      dataSource={rows}
      pagination={{ pageSize }}
      scroll={{ x: "max-content" }}
      locale={emptyText ? { emptyText } : undefined}
      columns={columns}
    />
  );
}
