"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  App,
  Col,
  Button,
  Card,
  Empty,
  Row,
  Popconfirm,
  Space,
  Spin,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { cyclesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { CycleProgressPanel, planStatusQueryKey } from "./cycle-progress-panel";
import { CycleScopePanel } from "./cycle-scope-panel";
import { CycleStatusTag, CycleYearTag } from "./cycle-status-tag";
import { CalendarOutlined } from "@ant-design/icons";
import {
  CyclePreviewSummaryCards,
  CycleScopeSummaryCards,
  previewSummaryObject,
} from "./cycle-summary-cards";
import { CycleTimeline } from "./cycle-timeline";
import { showCycleActivationError } from "./cycle-activation-error";
import {
  bilingual,
  countFromScope,
  previewCandidates,
  previewManagersCount,
  previewQueryKey,
} from "./shared";

function formatCycleDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function CycleDetail({ cycleId }: { cycleId: string }) {
  const t = useTranslations("PerformanceCycles");
  const locale = useLocale();
  const ar = locale === "ar";
  const router = useRouter();
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const cycle = useQuery({
    queryKey: [...queryKeys.adminCycles, cycleId],
    queryFn: () => cyclesApi.adminGet(cycleId),
  });

  const preview = useQuery({
    queryKey: previewQueryKey(cycleId),
    queryFn: () => cyclesApi.preview(cycleId),
    enabled: false,
  });

  const isLive = cycle.data?.status === "active" || cycle.data?.status === "closed";
  const planStatus = useQuery({
    queryKey: planStatusQueryKey(cycleId),
    queryFn: () => cyclesApi.planStatus(cycleId, { per_page: 200 }),
    enabled: isLive,
  });

  const activate = useMutation({
    mutationFn: () => cyclesApi.activate(cycleId),
    onSuccess: async () => {
      message.success(t("toast.activated"));
      await qc.invalidateQueries({ queryKey: queryKeys.adminCycles });
      await cycle.refetch();
    },
    onError: (error: Error) => showCycleActivationError(modal, error, t),
  });

  const remove = useMutation({
    mutationFn: () => cyclesApi.remove(cycleId),
    onSuccess: () => {
      message.success(t("toast.deleted"));
      router.replace(`/${locale}/admin/performance-cycles`);
      void qc.invalidateQueries({ queryKey: queryKeys.adminCycles });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const previewRows = useMemo(() => previewCandidates(preview.data), [preview.data]);
  const previewSummary = useMemo(() => previewSummaryObject(preview.data), [preview.data]);

  const managers = useMemo(() => {
    if (isLive) {
      const ids = new Set<string>();
      for (const r of ((planStatus.data as any)?.data || []) as any[]) {
        if (r.current_manager_id != null) ids.add(String(r.current_manager_id));
      }
      return planStatus.isSuccess ? ids.size : null;
    }
    return previewManagersCount(preview.data, previewRows);
  }, [isLive, planStatus.data, planStatus.isSuccess, preview.data, previewRows]);

  if (cycle.isLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (cycle.isError) return <Alert type="error" showIcon title={(cycle.error as Error).message} />;
  if (!cycle.data) return <Empty />;

  const c = cycle.data as any;
  const isDraft = c.status === "draft";
  const counts = countFromScope(c.scope);
  const liveEmployeeCount = ((planStatus.data as any)?.meta?.total ??
    (planStatus.data as any)?.data?.length) as number | undefined;
  const employeesValue =
    isLive && liveEmployeeCount != null ? liveEmployeeCount : counts.employees;

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
        extra={
          <Space wrap>
            {isDraft && (
              <Button
                onClick={() => {
                  setShowPreview(true);
                  void preview.refetch();
                }}
                loading={preview.isFetching}
              >
                {t("actions.previewEligibility")}
              </Button>
            )}
            {(isDraft || c.status === "active") && (
              <Link href={`/${locale}/admin/performance-cycles/${cycleId}/edit`}>
                <Button>{t("actions.editCycle")}</Button>
              </Link>
            )}
            {isDraft && (
              <Popconfirm title={t("confirm.activate")} onConfirm={() => activate.mutate()}>
                <Button type="primary" loading={activate.isPending}>
                  {t("actions.activate")}
                </Button>
              </Popconfirm>
            )}
            {isDraft && (
              <Popconfirm title={t("confirm.deleteDraft")} onConfirm={() => remove.mutate()}>
                <Button danger loading={remove.isPending}>
                  {t("actions.deleteDraft")}
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        <Row gutter={[12, 12]} className="cycle-detail-date-range">
          <Col xs={24} sm={12}>
            <div className="cycle-detail-date-card">
              <span className="cycle-detail-date-icon"><CalendarOutlined /></span>
              <div className="cycle-detail-date-copy">
                <Typography.Text type="secondary">{t("fields.startDate")}</Typography.Text>
                <Typography.Text strong>{formatCycleDate(c.start_date, locale)}</Typography.Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div className="cycle-detail-date-card">
              <span className="cycle-detail-date-icon cycle-detail-date-icon-end"><CalendarOutlined /></span>
              <div className="cycle-detail-date-copy">
                <Typography.Text type="secondary">{t("fields.endDate")}</Typography.Text>
                <Typography.Text strong>{formatCycleDate(c.end_date, locale)}</Typography.Text>
              </div>
            </div>
          </Col>
        </Row>
        <CycleScopeSummaryCards
          departments={counts.departments}
          jobTitles={counts.jobTitles}
          employees={employeesValue}
          excluded={counts.excluded}
          managers={managers ?? "—"}
        />
      </Card>

      <Card title={t("timeline.title")}>
        <CycleTimeline stages={c.stages || []} cycle={c} />
      </Card>

      {isDraft && (
        <CycleScopePanel
          cycleId={cycleId}
          scope={c.scope}
          status={c.status}
          managersCount={managers}
          onActivate={() => activate.mutateAsync()}
        />
      )}

      {isLive && <CycleProgressPanel cycleId={cycleId} />}

      {showPreview && preview.data && (
        <Card title={t("sections.eligibilityPreview")}>
          {previewSummary ? (
            <CyclePreviewSummaryCards summary={previewSummary} />
          ) : (
            <Typography.Paragraph type="secondary">{t("table.previewEmpty")}</Typography.Paragraph>
          )}
        </Card>
      )}
    </Space>
  );
}
