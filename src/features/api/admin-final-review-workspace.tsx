"use client";

import { DataTable } from "@/components/ui/data-table";
import { useState } from "react";
import {
  Alert,
  Skeleton,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, cyclesApi } from "@/lib/api/endpoints";
import { useLocale, useTranslations } from "next-intl";

type ApprovalGroup = {
  group_id: number;
  manager?: { id: number; code?: string | null; name?: string | null } | null;
  status: string;
  version: number;
  member_count?: number;
  n?: number;
  latest_submission_no?: number | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string, labels: Record<string, string>) {
  return labels[status] || status.replaceAll("_", " ");
}

function statusColor(status: string) {
  if (status === "pending_admin") return "processing";
  if (status === "approved") return "success";
  if (status === "returned") return "error";
  if (status === "published") return "success";
  return "default";
}

export default function ApiAdminFinalReviewWorkspace() {
  const locale = useLocale();
  const ar = locale === "ar";
  const translate = useTranslations("AdminApprovals");
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [cycleId, setCycleId] = useState<number>();
  const [selected, setSelected] = useState<ApprovalGroup | null>(null);
  const [reason, setReason] = useState("");
  const [affected, setAffected] = useState<number[]>([]);

  const cycles = useQuery({ queryKey: ["cycles"], queryFn: cyclesApi.mine });
  const groups = useQuery({
    queryKey: ["admin", "cycles", cycleId, "groups"],
    queryFn: () => adminApi.groups(cycleId!, { per_page: 100 }),
    enabled: Boolean(cycleId),
  });
  const detail = useQuery({
    queryKey: ["admin", "group", selected?.group_id],
    queryFn: () => adminApi.group(selected!.group_id),
    enabled: Boolean(selected?.group_id),
  });

  const refreshGroups = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "cycles", cycleId, "groups"] });
    if (selected?.group_id) {
      await qc.invalidateQueries({ queryKey: ["admin", "group", selected.group_id] });
    }
  };

  const approve = useMutation({
    mutationFn: (group: ApprovalGroup) =>
      adminApi.approveGroup(group.group_id, group.version),
    onSuccess: async () => {
      message.success(translate("approveSuccess"));
      await refreshGroups();
      setSelected(null);
    },
    onError: (error: Error) => message.error(error.message),
  });

  const returnGroup = useMutation({
    mutationFn: () =>
      adminApi.returnGroup(selected!.group_id, {
        expected_version: detail.data?.version ?? selected!.version,
        reason: reason.trim(),
        affected_member_ids: affected,
      }),
    onSuccess: async () => {
      message.success(translate("returnSuccess"));
      await refreshGroups();
      setSelected(null);
      setReason("");
      setAffected([]);
    },
    onError: (error: Error) => message.error(error.message),
  });

  const list = ((groups.data as any)?.data || []) as ApprovalGroup[];
  const cycleOptions = (cycles.data || []).map((cycle: any) => ({
    value: cycle.id,
    label: `${typeof cycle.name === "object" ? (ar ? cycle.name.ar : cycle.name.en) : cycle.name} · ${cycle.performance_year}`,
  }));
  const members = detail.data?.members || [];
  const pendingAdmin = selected?.status === "pending_admin";
  const columns: ColumnsType<ApprovalGroup> = [
    {
      title: translate("group"),
      dataIndex: "group_id",
      width: 100,
      render: (value: number) => <Typography.Text strong>#{value}</Typography.Text>,
    },
    {
      title: translate("manager"),
      width: 220,
      render: (_, row) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{row.manager?.name || "—"}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.manager?.code || (row.manager?.id ? `ID ${row.manager.id}` : "—")}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: translate("members"),
      dataIndex: "member_count",
      width: 100,
      align: "center",
      render: (value: number | undefined, row) => value ?? row.n ?? "—",
    },
    {
      title: translate("status"),
      dataIndex: "status",
      width: 155,
      render: (value: string) => (
        <Tag color={statusColor(value)}>{statusLabel(value, { pending_admin: translate("statusPendingAdmin"), approved: translate("statusApproved"), returned: translate("statusReturned"), published: translate("statusPublished") })}</Tag>
      ),
    },
    {
      title: translate("version"),
      dataIndex: "version",
      width: 90,
    },
    {
      title: translate("submission"),
      dataIndex: "latest_submission_no",
      width: 115,
      render: (value: number | null) => value ?? "—",
    },
    {
      title: translate("submitted"),
      dataIndex: "submitted_at",
      width: 175,
      render: (value: string | null) => formatDate(value, locale),
    },
    {
      title: translate("approved"),
      dataIndex: "approved_at",
      width: 175,
      render: (value: string | null) => formatDate(value, locale),
    },
    {
      title: translate("published"),
      dataIndex: "published_at",
      width: 175,
      render: (value: string | null) => formatDate(value, locale),
    },
    {
      title: translate("actions"),
      key: "actions",
      fixed: "right",
      width: 250,
      render: (_, row) => {
        const canDecide = row.status === "pending_admin";
        return (
          <Space wrap size={6}>
            <Button size="small" onClick={() => { setSelected(row); setReason(""); setAffected([]); }}>
              {translate("review")}
            </Button>
            {canDecide && (
              <>
                <Popconfirm
                  title={translate("approveQuestion")}
                  description={translate("approveDescription")}
                  okText={translate("approve")}
                  cancelText={translate("cancel")}
                  onConfirm={() => approve.mutate(row)}
                >
                  <Button size="small" type="primary" loading={approve.isPending}>
                    {translate("approve")}
                  </Button>
                </Popconfirm>
                <Button size="small" danger onClick={() => { setSelected(row); setReason(""); setAffected([]); }}>
                  {translate("return")}
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" style={{ width: "100%" }} size={16}>
      <Card
        title={translate("title")}
        styles={{ body: { paddingTop: 16 } }}
      >
        <Space wrap style={{ width: "100%", marginBottom: 16 }} size={12}>
          <Select
            showSearch
            optionFilterProp="label"
            style={{ width: "100%", maxWidth: 460 }}
            placeholder={translate("selectCycle")}
            value={cycleId}
            onChange={(value) => { setCycleId(value); setSelected(null); }}
            options={cycleOptions}
            loading={cycles.isFetching}
          />
          {cycleId ? (
            <Typography.Text type="secondary">
              {translate("groupsCount", { count: list.length })}
            </Typography.Text>
          ) : null}
        </Space>

        {cycles.isError ? (
          <Alert type="error" showIcon title={(cycles.error as Error).message} />
        ) : groups.isError ? (
          <Alert type="error" showIcon title={(groups.error as Error).message} />
        ) : !cycleId ? (
          <Empty description={translate("selectCycleHint")} />
        ) : (
          <DataTable
            rowKey="group_id"
            size="middle"
            loading={groups.isFetching}
            dataSource={list}
            columns={columns}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description={translate("noGroups")} /> }}
          />
        )}
      </Card>

      <Modal
        width={900}
        open={Boolean(selected)}
        title={translate("groupReview")}
        onCancel={() => { setSelected(null); setReason(""); setAffected([]); }}
        footer={null}
        destroyOnHidden
      >
        {selected && (
          <Space orientation="vertical" style={{ width: "100%" }} size={16}>
            <Space wrap>
              <Tag color="blue">#{selected.group_id}</Tag>
              <Tag color={statusColor(selected.status)}>{statusLabel(selected.status, { pending_admin: translate("statusPendingAdmin"), approved: translate("statusApproved"), returned: translate("statusReturned"), published: translate("statusPublished") })}</Tag>
              <Typography.Text type="secondary">
                {selected.manager?.name || "—"} · {selected.manager?.code || "—"}
              </Typography.Text>
            </Space>

            {detail.isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : detail.isError ? (
              <Alert type="error" showIcon title={(detail.error as Error).message} />
            ) : (
              <>
                <DataTable
                  rowKey="cycle_member_id"
                  dataSource={members}
                  pagination={false}
                  scroll={{ x: 600 }}
                  columns={[
                    {
                      title: translate("employee"),
                      render: (_, row: any) => (
                        <Space orientation="vertical" size={0}>
                          <Typography.Text strong>{row.employee?.name || row.employee?.full_name || "—"}</Typography.Text>
                          <Typography.Text type="secondary">{row.employee?.code || "—"}</Typography.Text>
                        </Space>
                      ),
                    },
                    {
                      title: translate("overall"),
                      render: (_, row: any) => row.overall_bp == null ? "—" : `${(row.overall_bp / 100).toFixed(2)}%`,
                    },
                    { title: translate("rating"), dataIndex: "rating_level" },
                  ]}
                />

                {pendingAdmin && (
                  <Form layout="vertical">
                    <Form.Item label={translate("returnReason")} required>
                      <Input.TextArea
                        rows={3}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder={translate("returnReasonHint")}
                      />
                    </Form.Item>
                    <Form.Item label={translate("affectedMembers")}>
                      <Select
                        mode="multiple"
                        style={{ width: "100%" }}
                        value={affected}
                        onChange={setAffected}
                        options={members.map((member: any) => ({
                          value: member.cycle_member_id,
                          label: member.employee?.name || member.employee?.full_name || member.cycle_member_id,
                        }))}
                        placeholder={translate("selectAffectedMembers")}
                      />
                    </Form.Item>
                    <Space wrap>
                      <Popconfirm
                        title={translate("approveQuestion")}
                        onConfirm={() => approve.mutate(selected)}
                        okText={translate("approve")}
                        cancelText={translate("cancel")}
                      >
                        <Button type="primary" loading={approve.isPending}>
                          {translate("approveGroup")}
                        </Button>
                      </Popconfirm>
                      <Button
                        danger
                        disabled={!reason.trim()}
                        loading={returnGroup.isPending}
                        onClick={() => returnGroup.mutate()}
                      >
                        {translate("returnGroup")}
                      </Button>
                    </Space>
                  </Form>
                )}
              </>
            )}
          </Space>
        )}
      </Modal>
    </Space>
  );
}
