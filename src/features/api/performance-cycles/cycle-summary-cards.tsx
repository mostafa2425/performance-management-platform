"use client";

import { Card, Col, Row, Typography } from "antd";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined,
  StopOutlined,
  TeamOutlined,
  UserDeleteOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";

type Item = {
  key: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
};

function MetricCard({ item }: { item: Item }) {
  return (
    <Card size="small" styles={{ body: { padding: "14px 16px" } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: `${item.color}18`,
            color: item.color,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {item.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {item.label}
          </Typography.Text>
          <Typography.Text strong style={{ fontSize: 20, lineHeight: 1.2 }}>
            {item.value}
          </Typography.Text>
        </div>
      </div>
    </Card>
  );
}

export function CycleScopeSummaryCards({
  departments,
  jobTitles,
  employees,
  excluded,
  managers,
}: {
  departments: number;
  jobTitles: number;
  employees: number | string;
  excluded: number;
  managers: number | string;
}) {
  const t = useTranslations("PerformanceCycles");
  const items: Item[] = [
    {
      key: "departments",
      label: t("fields.departmentsCount"),
      value: departments,
      icon: <ApartmentOutlined />,
      color: "#722ed1",
    },
    {
      key: "jobTitles",
      label: t("fields.jobTitlesCount"),
      value: jobTitles,
      icon: <IdcardOutlined />,
      color: "#13c2c2",
    },
    {
      key: "employees",
      label: t("fields.employeesInScope"),
      value: employees,
      icon: <UserOutlined />,
      color: "#1677ff",
    },
    {
      key: "excluded",
      label: t("fields.excludedCount"),
      value: excluded,
      icon: <UserDeleteOutlined />,
      color: "#fa8c16",
    },
    {
      key: "managers",
      label: t("fields.managersInScope"),
      value: managers,
      icon: <TeamOutlined />,
      color: "#52c41a",
    },
  ];

  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col xs={12} sm={8} md={6} xl={4} key={item.key}>
          <MetricCard item={item} />
        </Col>
      ))}
    </Row>
  );
}

const PREVIEW_SUMMARY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  included: { icon: <CheckCircleOutlined />, color: "#52c41a" },
  in_other_active_cycle: { icon: <StopOutlined />, color: "#fa541c" },
  no_competency_template: { icon: <WarningOutlined />, color: "#faad14" },
  terminated: { icon: <CloseCircleOutlined />, color: "#8c8c8c" },
  excluded_rule: { icon: <UserDeleteOutlined />, color: "#eb2f96" },
  under_6_months: { icon: <ClockCircleOutlined />, color: "#2f54eb" },
  excluded_override: { icon: <UserDeleteOutlined />, color: "#fa8c16" },
  excluded_manual: { icon: <UserDeleteOutlined />, color: "#fa8c16" },
  joining_date_missing: { icon: <WarningOutlined />, color: "#faad14" },
};

const KNOWN_STATUS_KEYS = new Set([
  "included",
  "under_6_months",
  "in_other_active_cycle",
  "excluded",
  "excluded_by_scope",
  "excluded_rule",
  "excluded_override",
  "excluded_manual",
  "no_competency_template",
  "terminated",
  "joining_date_missing",
  "removed",
  "missed",
]);

export function previewSummaryObject(preview: any): Record<string, number> | null {
  const summary = preview?.summary ?? preview?.data?.summary;
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(summary)) {
    if (typeof v === "number") out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export function CyclePreviewSummaryCards({ summary }: { summary: Record<string, number> }) {
  const t = useTranslations("PerformanceCycles");
  const preferred = [
    "included",
    "in_other_active_cycle",
    "excluded_rule",
    "no_competency_template",
    "terminated",
    "under_6_months",
    "excluded_override",
    "excluded_manual",
    "joining_date_missing",
  ];
  const keys = [
    ...preferred.filter((k) => k in summary),
    ...Object.keys(summary).filter((k) => !preferred.includes(k)),
  ];

  const items: Item[] = keys.map((key) => {
    const meta = PREVIEW_SUMMARY_META[key] ?? {
      icon: <TeamOutlined />,
      color: "#1677ff",
    };
    const label = KNOWN_STATUS_KEYS.has(key)
      ? t(`eligibility.status.${key}` as "eligibility.status.included")
      : key.replace(/_/g, " ");
    return {
      key,
      label,
      value: summary[key] ?? 0,
      icon: meta.icon,
      color: meta.color,
    };
  });

  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col xs={12} md={8} xl={6} key={item.key}>
          <MetricCard item={item} />
        </Col>
      ))}
    </Row>
  );
}
