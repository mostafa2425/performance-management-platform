"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import { Alert, App, Button, Card, Form, Input, Modal, Spin, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { adminApi, cyclesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { CycleEligibilityPreview, EligibilityStatusTag } from "./cycle-eligibility-preview";
import {
  candidateEmployeeId,
  candidateName,
  previewCandidates,
  previewQueryKey,
  reasonText,
} from "./shared";

export function CycleNotIncludedPanel({ cycleId, status }: { cycleId: string; status?: string }) {
  const t = useTranslations("PerformanceCycles");
  const ar = useLocale() === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [target, setTarget] = useState<any>(null);

  const isDraft = status === "draft";

  const preview = useQuery({
    queryKey: previewQueryKey(cycleId),
    queryFn: () => cyclesApi.preview(cycleId),
    enabled: isDraft,
    retry: false,
  });

  const removed = useQuery({
    queryKey: [...queryKeys.adminCycles, cycleId, "members", "removed"],
    queryFn: () => cyclesApi.members(cycleId, { per_page: 200, status: "removed" }),
    enabled: !isDraft,
  });
  const missed = useQuery({
    queryKey: [...queryKeys.adminCycles, cycleId, "members", "missed"],
    queryFn: () => cyclesApi.members(cycleId, { per_page: 200, status: "missed" }),
    enabled: !isDraft,
  });

  const notIncluded = useMemo(
    () => previewCandidates(preview.data).filter((r) => r.status && r.status !== "included"),
    [preview.data],
  );

  const removedMissed = useMemo(() => {
    const a = ((removed.data as any)?.data || []) as any[];
    const b = ((missed.data as any)?.data || []) as any[];
    return [...a, ...b];
  }, [removed.data, missed.data]);

  const membersLoading = removed.isLoading || missed.isLoading;
  const membersError = removed.isError ? removed.error : missed.isError ? missed.error : null;

  const include = useMutation({
    mutationFn: (reason: string) =>
      adminApi.createOverride({
        employee_id: candidateEmployeeId(target),
        action: "include",
        reason,
        cycle_id: Number(cycleId),
      }),
    onSuccess: async () => {
      message.success(t("notIncluded.included"));
      setTarget(null);
      form.resetFields();
      await qc.invalidateQueries({ queryKey: queryKeys.adminCycles });
    },
    onError: (error: Error) => message.error(error.message),
  });

  if (isDraft) {
    return (
      <Card title={t("notIncluded.title")}>
        {preview.isLoading ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: 100 }}>
            <Spin />
          </div>
        ) : preview.isError ? (
          <Alert type="info" showIcon title={t("notIncluded.loadPreviewHint")} />
        ) : (
          <CycleEligibilityPreview
            rows={notIncluded}
            emptyText={t("notIncluded.none")}
            renderAction={(row) =>
              row.status === "in_other_active_cycle" ? (
                <Tag>{t("notIncluded.blocked")}</Tag>
              ) : (
                <Button size="small" onClick={() => setTarget(row)}>
                  {t("actions.manualInclude")}
                </Button>
              )
            }
          />
        )}
        <Modal
          open={Boolean(target)}
          title={`${t("notIncluded.includeTitle")}${target ? ` · ${candidateName(target, ar)}` : ""}`}
          okText={t("actions.confirmInclude")}
          cancelText={t("actions.cancel")}
          confirmLoading={include.isPending}
          onOk={() => form.submit()}
          onCancel={() => setTarget(null)}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={(v) => include.mutate(String(v.reason).trim())}>
            <Form.Item
              name="reason"
              label={t("notIncluded.reasonLabel")}
              rules={[{ required: true, whitespace: true, message: t("notIncluded.reasonRequired") }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  }

  return (
    <Card title={t("notIncluded.removedMissed")}>
      {membersLoading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 100 }}>
          <Spin />
        </div>
      ) : membersError ? (
        <Alert type="error" showIcon title={(membersError as Error).message} />
      ) : (
        <DataTable
          rowKey={(r: any) => r.id ?? r.cycle_member_id ?? r.employee?.id}
          size="middle"
          dataSource={removedMissed}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: t("notIncluded.none") }}
          columns={[
            { title: t("fields.employee"), render: (_: unknown, r: any) => candidateName(r, ar) },
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
              render: (_: unknown, r: any) => reasonText(r.removal_reason ?? r.reason ?? r.reasons),
            },
          ]}
        />
      )}
    </Card>
  );
}
