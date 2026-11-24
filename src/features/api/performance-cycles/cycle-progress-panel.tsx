"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import { Alert, Card, Col, Collapse, Empty, Input, Row, Space, Spin, Statistic, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { adminApi, cyclesApi, resultsApi } from "@/lib/api/endpoints";
import { PLAN_DISPLAY_STATUS, planStatusKeys } from "./shared";

export const planStatusQueryKey = (cycleId: string) => [
  "admin",
  "cycles",
  cycleId,
  "plan-status",
  "progress",
];

function managerName(row: any) {
  return (
    row.current_manager?.name ||
    row.current_manager?.full_name ||
    row.manager?.name ||
    row.manager?.full_name ||
    row.current_manager_name ||
    null
  );
}

export function CycleProgressPanel({ cycleId }: { cycleId: string }) {
  const t = useTranslations("PerformanceCycles");
  const [search, setSearch] = useState("");

  const plans = useQuery({
    queryKey: planStatusQueryKey(cycleId),
    queryFn: () => cyclesApi.planStatus(cycleId, { per_page: 200 }),
  });
  const groups = useQuery({
    queryKey: ["admin", "cycles", cycleId, "groups", "progress"],
    queryFn: () => adminApi.groups(Number(cycleId), { per_page: 100 }),
    retry: false,
  });
  const results = useQuery({
    queryKey: ["admin", "cycles", cycleId, "results", "progress"],
    queryFn: () => resultsApi.list(cycleId),
    retry: false,
  });

  const rows: any[] = useMemo(() => (plans.data as any)?.data || [], [plans.data]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const k of planStatusKeys) acc[k] = 0;
    for (const r of rows) {
      const k = r.status?.key;
      if (k in acc) acc[k] += 1;
    }
    return acc;
  }, [rows]);

  const pendingFinal = ((groups.data as any)?.data || []).filter((g: any) => g.status === "pending_admin").length;
  const finalized = Array.isArray(results.data) ? results.data.length : null;

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, { id: string; name: string | null; rows: any[] }>();
    for (const r of rows) {
      const name = String(r.employee?.name || r.employee?.full_name || "").toLowerCase();
      if (q && !name.includes(q)) continue;
      const id = r.current_manager_id != null ? String(r.current_manager_id) : "none";
      const entry = map.get(id) || { id, name: managerName(r), rows: [] as any[] };
      if (!entry.name) entry.name = managerName(r);
      entry.rows.push(r);
      map.set(id, entry);
    }
    return Array.from(map.values());
  }, [rows, search]);

  if (plans.isLoading) {
    return (
      <Card title={t("progress.title")}>
        <div style={{ display: "grid", placeItems: "center", minHeight: 120 }}>
          <Spin />
        </div>
      </Card>
    );
  }
  if (plans.isError) return <Alert type="error" showIcon title={(plans.error as Error).message} />;

  const statusTag = (v?: string | null) =>
    v ? (
      <Tag color={PLAN_DISPLAY_STATUS[v]?.color ?? "default"}>
        {v in PLAN_DISPLAY_STATUS ? t(`progress.${v as keyof typeof PLAN_DISPLAY_STATUS}`) : v}
      </Tag>
    ) : (
      <Tag>—</Tag>
    );

  return (
    <Card title={t("progress.title")}>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {planStatusKeys.map((k) => (
          <Col xs={12} md={8} xl={4} key={k}>
            <Card size="small">
              <Statistic
                title={<Tag color={PLAN_DISPLAY_STATUS[k].color}>{t(`progress.${k as "draft"}`)}</Tag>}
                value={counts[k]}
              />
            </Card>
          </Col>
        ))}
        {groups.isSuccess && (
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={<Tag color="gold">{t("progress.pendingFinal")}</Tag>} value={pendingFinal} />
            </Card>
          </Col>
        )}
        {finalized != null && (
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={<Tag color="green">{t("progress.finalized")}</Tag>} value={finalized} />
            </Card>
          </Col>
        )}
      </Row>

      <Input.Search
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("progress.searchEmployee")}
        style={{ maxWidth: 360, marginBottom: 16 }}
      />

      {grouped.length === 0 ? (
        <Empty description={t("progress.noRows")} />
      ) : (
        <Collapse
          items={grouped.map((g) => ({
            key: g.id,
            label: (
              <Space wrap size={[8, 4]}>
                <Typography.Text strong>
                  {g.name || (g.id === "none" ? t("progress.noManager") : `#${g.id}`)}
                </Typography.Text>
                <Tag>{t("progress.employeesCount", { count: g.rows.length })}</Tag>
              </Space>
            ),
            children: (
              <DataTable
                rowKey={(r: any) => r.cycle_member_id ?? r.employee?.id}
                size="small"
                pagination={false}
                dataSource={g.rows}
                columns={[
                  {
                    title: t("fields.employee"),
                    render: (_: unknown, r: any) => r.employee?.name || r.employee?.full_name || "—",
                  },
                  {
                    title: t("fields.employeeCode"),
                    render: (_: unknown, r: any) => r.employee?.code || "—",
                  },
                  {
                    title: t("fields.status"),
                    dataIndex: "status",
                    render: (v: { key?: string; label?: string }) => <Tag color={PLAN_DISPLAY_STATUS[v?.key || ""]?.color ?? "default"}>{v?.label || "—"}</Tag>,
                  },
                  {
                    title: t("fields.attention"),
                    dataIndex: "requires_admin_attention",
                    render: (v: boolean) => (v ? <Tag color="orange">{t("progress.required")}</Tag> : "—"),
                  },
                ]}
              />
            ),
          }))}
        />
      )}
    </Card>
  );
}
