"use client";

import { Table, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { stageHint, stageLabel } from "./shared";

type StageRow = {
  stage: string;
  deadline_date?: string;
  cutoff_at?: string;
};

export function CycleStagesTable({ stages }: { stages: StageRow[] }) {
  const t = useTranslations("PerformanceCycles");

  return (
    <Table
      rowKey="stage"
      pagination={false}
      size="middle"
      dataSource={stages}
      columns={[
        {
          title: t("fields.stage"),
          dataIndex: "stage",
          render: (key: string) => {
            const hint = stageHint(t, key);
            const label = stageLabel(t, key);
            if (!hint) return label;
            return (
              <Tooltip title={hint}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "help" }}>
                  {label}
                  <InfoCircleOutlined style={{ color: "rgba(0,0,0,0.45)", fontSize: 12 }} />
                </span>
              </Tooltip>
            );
          },
        },
        {
          title: t("fields.deadline"),
          dataIndex: "deadline_date",
          render: (v: string) =>
            v ? <Tooltip title={t("table.deadlineTooltip")}>{v}</Tooltip> : "—",
        },
        {
          title: t("fields.cutoff"),
          dataIndex: "cutoff_at",
          render: (v: string) =>
            v ? <Tooltip title={t("table.cutoffTooltip")}>{v}</Tooltip> : "—",
        },
      ]}
    />
  );
}
