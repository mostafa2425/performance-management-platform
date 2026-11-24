import { DataTable } from "@/components/ui/data-table";
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesApi, plansApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { ApiRequestError } from "@/lib/api/client";
import type { Plan } from "@/lib/api/types";
import { PlanActionModal } from "./plans/plan-action-modal";
import {
  planStatusTag,
  resolveActionLabel,
  workflowActions,
  type PlanMode,
} from "./plans/plan-shared";

function ActionButtons({
  actions,
  ar,
  plan,
  onAction,
}: {
  actions: string[];
  ar: boolean;
  plan?: { display_status?: string; status?: string } | null;
  onAction: (action: string) => void;
}) {
  const items = workflowActions(actions);
  if (!items.length) return <span>—</span>;
  return (
    <Space wrap size={[6, 6]} onClick={(e) => e.stopPropagation()}>
      {items.map((action) => (
        <Button
          key={action}
          size="small"
          type={
            action === "approve" ||
            action === "submit" ||
            action === "employee_approve"
              ? "primary"
              : "default"
          }
          danger={action === "return" || action === "delete"}
          onClick={() => onAction(action)}
        >
          {resolveActionLabel(action, ar, plan)}
        </Button>
      ))}
    </Space>
  );
}

export function ApiPlanWorkspace({ mode }: { mode: PlanMode }) {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [cycleId, setCycleId] = useState<number>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState("");
  const [dialog, setDialog] = useState(false);

  const cycles = useQuery({
    queryKey: queryKeys.cycles,
    queryFn: cyclesApi.mine,
  });
  const listParams = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (cycleId) filter.cycle_id = cycleId;
    if (statusFilter) filter.status = statusFilter;
    if (attentionOnly) filter.requires_admin_attention = 1;
    return { per_page: 100, ...(Object.keys(filter).length ? { filter } : {}) };
  }, [cycleId, statusFilter, attentionOnly]);

  const plans = useQuery({
    queryKey: [...queryKeys.plans, mode, listParams],
    queryFn: () => plansApi.list(listParams),
  });
  const status = useQuery({
    queryKey: ["cycles", cycleId, "plan-status"],
    queryFn: () => cyclesApi.planStatus(cycleId!, { per_page: 100 }),
    enabled: (mode === "manager" || mode === "admin") && Boolean(cycleId),
  });
  const detail = useQuery({
    queryKey: [...queryKeys.plans, "detail", selectedPlan?.id],
    queryFn: () => plansApi.get(selectedPlan.id),
    enabled: Boolean(selectedPlan?.id),
  });


  const invalidatePlanQueries = async (planId?: number) => {
    await qc.invalidateQueries({ queryKey: queryKeys.plans });
    await qc.invalidateQueries({ queryKey: ["cycles", cycleId, "plan-status"] });
    if (planId) {
      await qc.invalidateQueries({
        queryKey: [...queryKeys.plans, "detail", planId],
      });
      await qc.invalidateQueries({ queryKey: ["plans", planId, "history"] });
    }
  };

  const create = useMutation({
    mutationFn: (id: number) => plansApi.create(id),
    onSuccess: async (plan: any) => {
      message.success(ar ? "تم إنشاء مسودة الخطة" : "Plan draft created");
      setSelectedPlan(plan);
      await invalidatePlanQueries(plan.id);
      router.push(`/${locale}/${mode === "admin" ? "admin/plan-reviews" : mode === "manager" ? "manager/objectives" : "employee/objectives"}/${plan.id}`);
    },
    onError: (error: Error) => {
      const apiError = error as ApiRequestError;
      const existingId = (apiError as any)?.details?.plan_id;
      if (existingId) {
        message.info(ar ? "الخطة موجودة مسبقاً" : "Plan already exists");
        router.push(`/${locale}/${mode === "admin" ? "admin/plan-reviews" : mode === "manager" ? "manager/objectives" : "employee/objectives"}/${existingId}`);
        return;
      }
      message.error(error.message);
    },
  });

  const transition = useMutation({
    mutationFn: ({
      id,
      action,
      body,
    }: {
      id: number;
      action: string;
      body: any;
    }) => plansApi.transition(id, action, body),
    onSuccess: async (plan: any) => {
      message.success(ar ? "تم تنفيذ الإجراء" : "Workflow action completed");
      setDialog(false);
      setPendingAction("");
      if (plan?.id) setSelectedPlan(plan);
      await invalidatePlanQueries(plan?.id || selectedPlan?.id);
    },
    onError: (error: Error) => message.error(error.message),
  });

  const removePlan = useMutation({
    mutationFn: (id: number) => plansApi.remove(id),
    onSuccess: async () => {
      message.success(ar ? "تم حذف المسودة" : "Draft deleted");
      const id = selectedPlan?.id;
      setSelectedPlan(null);
      await invalidatePlanQueries(id);
    },
    onError: (error: Error) => message.error(error.message),
  });



  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const cycleOptions = (cycles.data || []).map((c: any) => ({
    value: c.id,
    label: `${typeof c.name === "object" ? (ar ? c.name.ar : c.name.en) : c.name} · ${c.performance_year}`,
  }));
  const rows = ((plans.data as any)?.data || []) as Plan[];
  const members = (status.data as any)?.data || [];
  const openAction = (plan: any, action: string) => {
    setSelectedPlan(plan);
    setPendingAction(action);
    // Return needs the objective/KPI tree; wait for detail if the list row is slim.
    if (action === "return" && !plan?.objectives?.length && plan?.id !== detail.data?.id) {
      setDialog(false);
      // detail query will load after selection; open modal once tree is present
      return;
    }
    setDialog(true);
  };

  useEffect(() => {
    if (!pendingAction || pendingAction !== "return") return;
    if (!selectedPlan?.id) return;
    if (dialog) return;
    if (detail.data?.id === selectedPlan.id && (detail.data.objectives || []).length >= 0) {
      setDialog(true);
    }
  }, [pendingAction, selectedPlan?.id, detail.data, dialog]);

  const title =
    mode === "admin"
      ? t("Plan reviews", "مراجعة الخطط")
      : mode === "manager"
        ? t("Team plans", "خطط الفريق")
        : t("My plan", "خطتي");
  const subtitle =
    mode === "admin"
      ? t(
          "UC-013 · Review, edit, approve, or return submitted plans.",
          "UC-013 · راجع وعدّل واعتمد أو أعد الخطط المُرسلة.",
        )
      : mode === "manager"
        ? t(
            "UC-011 / UC-015 · Prepare objectives & KPIs and update returned plans.",
            "UC-011 / UC-015 · إعداد الأهداف والمؤشرات وتحديث الخطط المعادة.",
          )
        : t(
            "UC-014 · Review your plan and approve or request changes.",
            "UC-014 · راجع خطتك واعتمدها أو اطلب تعديلاً.",
          );

  return (
    <AppShell
      role={
        mode === "admin" ? "admin" : mode === "manager" ? "manager" : "employee"
      }
      title={title}
      subtitle={subtitle}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <Card>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {mode !== "employee" && (
              <Col xs={24} md={8}>
                <Select
                  allowClear
                  style={{ width: "100%" }}
                  placeholder={t("Select cycle", "اختر الدورة")}
                  options={cycleOptions}
                  value={cycleId}
                  onChange={setCycleId}
                />
              </Col>
            )}
            {mode === "admin" && (
              <>
                <Col xs={12} md={6}>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    placeholder={t("Stored status", "الحالة المخزنة")}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "pending_admin", label: t("Pending admin", "بانتظار الإدارة") },
                      { value: "returned", label: t("Returned", "معادة") },
                      { value: "pending_employee", label: t("Pending employee", "بانتظار الموظف") },
                      { value: "approved", label: t("Approved", "معتمدة") },
                      { value: "draft", label: t("Draft", "مسودة") },
                    ]}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Button
                    block
                    type={attentionOnly ? "primary" : "default"}
                    onClick={() => setAttentionOnly((v) => !v)}
                  >
                    {t("Needs attention", "تتطلب متابعة")}
                  </Button>
                </Col>
              </>
            )}
          </Row>

          {(mode === "manager" || mode === "admin") && cycleId && (
            <Card
              size="small"
              title={t("Start a plan (UC-011)", "بدء خطة (UC-011)")}
              style={{ marginBottom: 16 }}
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                title={t("Some goal-setting tools need backend support", "بعض أدوات إعداد الأهداف تحتاج إلى دعم من الخادم")}
                description={t(
                  "The current API supports plan creation, editing, validation and workflow actions. It does not expose objective templates, copy-previous-cycle, SMART analysis (70% score), or AI wording suggestions yet.",
                  "تدعم الواجهة الحالية إنشاء الخطة وتعديلها والتحقق منها وإجراءات سير العمل، لكنها لا توفر بعد قوالب الأهداف أو نسخ أهداف الدورة السابقة أو تحليل SMART (70%) أو تحسين الصياغة بالذكاء الاصطناعي."
                )}
              />
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                placeholder={t(
                  "Select a member without a plan",
                  "اختر عضواً بلا خطة",
                )}
                options={members
                  .filter((m: any) => !m.plan_id)
                  .map((m: any) => ({
                    value: m.cycle_member_id,
                    label:
                      m.employee?.name ||
                      m.employee?.full_name ||
                      m.cycle_member_id,
                  }))}
                onChange={(id) => create.mutate(id)}
                loading={create.isPending}
              />
            </Card>
          )}

          {plans.isLoading ? (
            <div style={{ display: "grid", placeItems: "center", minHeight: 180 }}>
              <Spin />
            </div>
          ) : plans.isError ? (
            <Alert type="error" showIcon title={(plans.error as Error).message} />
          ) : rows.length === 0 ? (
            <Empty description={t("No plans yet.", "لا توجد خطط بعد.")} />
          ) : (
            <DataTable
              rowKey="id"
              size="middle"
              dataSource={rows}
              pagination={{
                pageSize: 8,
                showTotal: (n) =>
                  ar ? `${n} خطة` : `${n} plan${n === 1 ? "" : "s"}`,
              }}
              scroll={{ x: "max-content" }}
              rowClassName={() => "plan-row"}
              onRow={(record) => ({
                onClick: () => router.push(`/${locale}/${mode === "admin" ? "admin/plan-reviews" : mode === "manager" ? "manager/objectives" : "employee/objectives"}/${record.id}`),
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/${locale}/${mode === "admin" ? "admin/plan-reviews" : mode === "manager" ? "manager/objectives" : "employee/objectives"}/${record.id}`);
                  }
                },
                tabIndex: 0,
                role: "button",
                "aria-label": t("Open plan details", "فتح تفاصيل الخطة"),
              })}
              columns={[
                {
                  title: t("Code", "الرقم"),
                  width: 100,
                  render: (_: unknown, row: Plan) =>
                    row.employee?.code ? `#${row.employee.code}` : "—",
                },
                {
                  title: t("Employee", "الموظف"),
                  ellipsis: true,
                  render: (_: unknown, r: Plan) => (
                    <Typography.Text style={{ color: "#000", fontWeight: 500 }}>
                      {r.employee?.name || (r.employee as any)?.full_name || "—"}
                    </Typography.Text>
                  ),
                },
                {
                  title: t("Status", "الحالة"),
                  dataIndex: "display_status",
                  width: 210,
                  render: (v: string) => planStatusTag(v, ar),
                },
                {
                  title: t("Attention", "متابعة"),
                  width: 120,
                  render: (_: unknown, r: Plan) =>
                    r.requires_admin_attention ? (
                      <Tag color="orange">{t("Required", "مطلوب")}</Tag>
                    ) : (
                      "—"
                    ),
                },
                {
                  title: t("Actions", "الإجراءات"),
                  width: 280,
                  render: (_: unknown, r: Plan) => (
                    <ActionButtons
                      actions={r.allowed_actions || []}
                      ar={ar}
                      plan={r}
                      onAction={(action) => openAction(r, action)}
                    />
                  ),
                },
              ]}
            />
          )}
        </Card>

        <PlanActionModal
          open={dialog}
          action={pendingAction}
          ar={ar}
          plan={detail.data || selectedPlan}
          loading={transition.isPending || removePlan.isPending}
          onCancel={() => {
            setDialog(false);
            setPendingAction("");
          }}
          onConfirm={(payload) => {
            if (!selectedPlan) return;
            if (pendingAction === "delete") {
              removePlan.mutate(selectedPlan.id);
              setDialog(false);
              setPendingAction("");
              return;
            }
            transition.mutate({
              id: selectedPlan.id,
              action: pendingAction,
              body: {
                version: (detail.data || selectedPlan).version,
                ...payload,
              },
            });
          }}
        />
      </div>

      <style>{`
        .plan-row { cursor: pointer; transition: background-color 0.15s ease; }
        .plan-row:hover > td { background: rgba(22, 119, 255, 0.06) !important; }
        .plan-row:focus-visible { outline: 2px solid #1677ff; outline-offset: -2px; }
      `}</style>
    </AppShell>
  );
}
