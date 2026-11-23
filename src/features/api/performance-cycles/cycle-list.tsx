"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Row,
  Select,
  Spin,
  Table,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { cyclesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { CycleStatusTag, CycleYearTag } from "./cycle-status-tag";
import { bilingual } from "./shared";

export function CycleList() {
  const t = useTranslations("PerformanceCycles");
  const locale = useLocale();
  const ar = locale === "ar";
  const router = useRouter();
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const params = useMemo(() => {
    const p: Record<string, unknown> = { per_page: 100 };
    if (status) p["filter[status]"] = status;
    if (year) p["filter[performance_year]"] = year;
    return p;
  }, [status, year]);

  const cycles = useQuery({
    queryKey: [...queryKeys.adminCycles, "list", params],
    queryFn: () => cyclesApi.adminList(params),
  });

  const allCycles = useQuery({
    queryKey: [...queryKeys.adminCycles, "list", "years"],
    queryFn: () => cyclesApi.adminList({ per_page: 100 }),
  });

  const remove = useMutation({
    mutationFn: (id: number | string) => cyclesApi.remove(id),
    onSuccess: async () => {
      message.success(t("toast.deleted"));
      await qc.invalidateQueries({ queryKey: queryKeys.adminCycles });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const c of ((allCycles.data as any)?.data || []) as any[]) {
      if (c.performance_year != null) years.add(Number(c.performance_year));
    }
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ value: y, label: String(y) }));
  }, [allCycles.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const data = ((cycles.data as any)?.data || []) as any[];
    if (!q) return data;
    return data.filter((c) => {
      const name = c.name;
      const text =
        typeof name === "object" && name
          ? `${name.en || ""} ${name.ar || ""}`
          : String(name || "");
      return text.toLowerCase().includes(q);
    });
  }, [cycles.data, search]);

  const detailPath = (id: number | string) => `/${locale}/admin/performance-cycles/${id}`;
  const editPath = (id: number | string) => `/${locale}/admin/performance-cycles/${id}/edit`;

  const confirmDelete = (record: any) => {
    modal.confirm({
      title: t("confirm.deleteDraft"),
      okText: t("actions.deleteDraft"),
      okButtonProps: { danger: true },
      cancelText: t("actions.cancel"),
      onOk: () => remove.mutateAsync(record.id),
    });
  };

  return (
    <Card
      extra={
        <Link href={`/${locale}/admin/performance-cycles/new`}>
          <Button type="primary">{t("actions.createCycle")}</Button>
        </Link>
      }
    >
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <Input.Search
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("filters.search")}
          />
        </Col>
        <Col xs={12} md={5}>
          <Select
            allowClear
            style={{ width: "100%" }}
            value={year}
            onChange={(v) => setYear(v)}
            options={yearOptions}
            placeholder={t("filters.allYears")}
          />
        </Col>
        <Col xs={12} md={5}>
          <Select
            allowClear
            style={{ width: "100%" }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={(["draft", "active", "closed"] as const).map((s) => ({
              value: s,
              label: t(`status.${s}`),
            }))}
            placeholder={t("filters.allStatuses")}
          />
        </Col>
        <Col xs={24} md={4}>
          <Button
            block
            disabled={!search && !year && !status}
            onClick={() => {
              setSearch("");
              setYear(undefined);
              setStatus(undefined);
            }}
          >
            {t("actions.resetFilters")}
          </Button>
        </Col>
      </Row>
      {cycles.isLoading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 180 }}>
          <Spin />
        </div>
      ) : cycles.isError ? (
        <Alert type="error" showIcon title={(cycles.error as Error).message} />
      ) : (
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: t("table.empty") }}
          onRow={(record: any) => ({
            onClick: () => router.push(detailPath(record.id)),
            style: { cursor: "pointer" },
          })}
          columns={[
            {
              title: t("fields.cycle"),
              render: (_: unknown, r: any) => bilingual(r.name, ar),
            },
            {
              title: t("fields.year"),
              dataIndex: "performance_year",
              width: 100,
              render: (y: number) => <CycleYearTag year={y} />,
            },
            {
              title: t("fields.start"),
              dataIndex: "start_date",
              render: (v: string) => v || "—",
            },
            {
              title: t("fields.end"),
              dataIndex: "end_date",
              render: (v: string) => v || "—",
            },
            {
              title: t("fields.status"),
              dataIndex: "status",
              width: 110,
              render: (v: string) => <CycleStatusTag status={v} />,
            },
            {
              title: t("fields.action"),
              width: 72,
              align: "center",
              render: (_: unknown, r: any) => {
                const isDraft = r.status === "draft";
                const canEdit = isDraft || r.status === "active";
                return (
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        {
                          key: "view",
                          icon: <EyeOutlined />,
                          label: t("actions.viewDetails"),
                          onClick: () => router.push(detailPath(r.id)),
                        },
                        ...(canEdit
                          ? [
                              {
                                key: "edit",
                                icon: <EditOutlined />,
                                label: t("actions.editCycle"),
                                onClick: () => router.push(editPath(r.id)),
                              },
                            ]
                          : []),
                        ...(isDraft
                          ? [
                              { type: "divider" as const },
                              {
                                key: "delete",
                                icon: <DeleteOutlined />,
                                danger: true,
                                label: t("actions.deleteDraft"),
                                onClick: () => confirmDelete(r),
                              },
                            ]
                          : []),
                      ],
                    }}
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      aria-label={t("fields.action")}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                );
              },
            },
          ]}
        />
      )}
    </Card>
  );
}
