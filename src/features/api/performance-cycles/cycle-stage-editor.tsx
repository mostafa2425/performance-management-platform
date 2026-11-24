import { DataTable } from "@/components/ui/data-table";
"use client";

import { useMemo, useState } from "react";
import { Alert, App, Button, Card, Col, Empty, Form, Row, Space, Spin, Tag, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { cyclesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { CycleStatusTag, CycleYearTag } from "./cycle-status-tag";
import {
  bilingual,
  compareDate,
  stageHint,
  stageLabel,
  stageTimelineStatus,
  type StageRow,
} from "./shared";

type AuditEntry = {
  stage: string;
  oldValue: string;
  newValue: string;
  at: string;
  user: string;
};

const day = (v?: string | null) => (v ? String(v).slice(0, 10) : "");

export function CycleStageEditor({
  cycleId,
  cycle: cycleProp,
  onSaved,
}: {
  cycleId: string;
  cycle?: any;
  onSaved?: () => void;
}) {
  const t = useTranslations("PerformanceCycles");
  const locale = useLocale();
  const ar = locale === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const detailKey = [...queryKeys.adminCycles, cycleId];
  const loaded = useQuery({
    queryKey: detailKey,
    queryFn: () => cyclesApi.adminGet(cycleId),
    enabled: !cycleProp,
  });
  const c: any = cycleProp ?? loaded.data;

  const stages: StageRow[] = useMemo(
    () => [...((c?.stages || []) as StageRow[])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [c?.stages],
  );

  const locked = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const s of stages) {
      if (c?.status === "closed") map[s.stage] = true;
      else if (c?.status === "active") map[s.stage] = stageTimelineStatus(s, stages, c) === "completed";
      else map[s.stage] = false;
    }
    return map;
  }, [stages, c]);

  const initialValues = useMemo(() => {
    const v: Record<string, string> = {};
    for (const s of stages) v[s.stage] = day(s.deadline_date);
    return v;
  }, [stages]);

  const detailPath = `/${locale}/admin/performance-cycles/${cycleId}`;

  if (!cycleProp && loaded.isLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 220 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!cycleProp && loaded.isError) {
    return <Alert type="error" showIcon title={(loaded.error as Error).message} />;
  }
  if (!c) return <Empty />;

  const rulesFor = (key: string, index: number) => [
    {
      required: true,
      message: t("validation.stageRequired", { stage: stageLabel(t, key) }),
    },
    {
      validator: async (_: unknown, value?: string) => {
        if (!value) return;
        const name = stageLabel(t, key);
        if (
          (c.start_date && compareDate(value, day(c.start_date)) < 0) ||
          (c.end_date && compareDate(value, day(c.end_date)) > 0)
        ) {
          throw new Error(
            t("editor.outsideCycle", { stage: name, start: day(c.start_date) || "—", end: day(c.end_date) || "—" }),
          );
        }
        if (index > 0) {
          const prev = form.getFieldValue(stages[index - 1].stage) as string | undefined;
          if (prev && compareDate(value, prev) < 0) {
            throw new Error(t("validation.stageOrder", { stage: name }));
          }
        }
      },
    },
  ];

  const onFinish = async (values: Record<string, string>) => {
    const changed = stages.filter(
      (s) => !locked[s.stage] && values[s.stage] && values[s.stage] !== initialValues[s.stage],
    );
    if (!changed.length) {
      message.info(t("editor.noChanges"));
      return;
    }
    // Moving later → apply last-first; moving earlier → apply first-first (keeps order valid server-side).
    const later = changed.filter((s) => compareDate(values[s.stage], initialValues[s.stage]) > 0).reverse();
    const earlier = changed.filter((s) => compareDate(values[s.stage], initialValues[s.stage]) <= 0);
    setSaving(true);
    const entries: AuditEntry[] = [];
    try {
      for (const s of [...later, ...earlier]) {
        await cyclesApi.updateStage(cycleId, s.stage, values[s.stage]);
        entries.push({
          stage: s.stage,
          oldValue: initialValues[s.stage] || "—",
          newValue: values[s.stage],
          at: new Date().toISOString(),
          user: "Admin",
        });
      }
      message.success(t("editor.saved"));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
      if (entries.length) {
        setAudit((prev) => [...entries, ...prev]);
        await qc.invalidateQueries({ queryKey: queryKeys.adminCycles });
        if (!cycleProp) await loaded.refetch();
        onSaved?.();
      }
    }
  };

  const closed = c.status === "closed";

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title={
          <Space wrap size={[8, 8]}>
            <Typography.Text strong style={{ fontSize: 16 }}>
              {bilingual(c.name, ar)}
            </Typography.Text>
            <CycleYearTag year={c.performance_year} />
            <CycleStatusTag status={c.status} />
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          {t("editor.cycleDates")}: {c.start_date || "—"} – {c.end_date || "—"}
        </Typography.Paragraph>
        {closed ? (
          <>
            <Form form={form} component={false} />
            <Alert type="warning" showIcon title={t("editor.closedNotEditable")} />
          </>
        ) : (
          <Form
            key={JSON.stringify(initialValues)}
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
          >
            <Row gutter={16}>
              {stages.map((s, index) => {
                const isLocked = locked[s.stage];
                const hint = stageHint(t, s.stage);
                return (
                  <Col xs={24} md={12} key={s.stage}>
                    <Form.Item
                      name={s.stage}
                      label={
                        <Space size={6}>
                          {stageLabel(t, s.stage)}
                          {isLocked && (
                            <Tag icon={<LockOutlined />} color="default">
                              {t("editor.lockedStage")}
                            </Tag>
                          )}
                        </Space>
                      }
                      tooltip={isLocked ? t("editor.lockedHint") : hint}
                      dependencies={index > 0 ? [stages[index - 1].stage] : []}
                      rules={isLocked ? [] : rulesFor(s.stage, index)}
                    >
                      <FormDatePicker disabled={isLocked} placeholder={t("placeholders.stageDeadline")} />
                    </Form.Item>
                  </Col>
                );
              })}
            </Row>
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t("actions.saveDeadlines")}
              </Button>
              <Link href={detailPath}>
                <Button>{t("actions.cancel")}</Button>
              </Link>
            </Space>
          </Form>
        )}
      </Card>

      <Card title={t("editor.auditTitle")}>
        <DataTable
          rowKey={(r) => `${r.stage}-${r.at}`}
          size="small"
          pagination={false}
          dataSource={audit}
          locale={{ emptyText: t("editor.auditEmpty") }}
          columns={[
            { title: t("fields.stage"), dataIndex: "stage", render: (v: string) => stageLabel(t, v) },
            { title: t("fields.oldValue"), dataIndex: "oldValue" },
            { title: t("fields.newValue"), dataIndex: "newValue" },
            { title: t("fields.user"), dataIndex: "user" },
            { title: t("fields.dateTime"), dataIndex: "at" },
          ]}
        />
      </Card>
    </Space>
  );
}
