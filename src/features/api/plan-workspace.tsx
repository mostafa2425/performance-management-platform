"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Modal,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { Form } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesApi, metaApi, plansApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { ApiRequestError } from "@/lib/api/client";
import { PlanContentEditor } from "./plan-content-editor";
import type { KpiUnitsMeta, Plan } from "@/lib/api/types";
import { PlanActionModal } from "./plans/plan-action-modal";
import { PlanHistoryPanel } from "./plans/plan-history-panel";
import { PlanSnapshotsPanel } from "./plans/plan-snapshots-panel";
import { PlanReadonlyTree } from "./plans/plan-readonly-tree";
import {
  formatInstant,
  planStatusTag,
  resolveActionLabel,
  returnSourceLabel,
  workflowActions,
  type PlanMode,
} from "./plans/plan-shared";

function toDraftObjectives(objectives: any[] = []) {
  return objectives.map((objective) => ({
    id: objective.id,
    category_id: objective.category_id,
    text: objective.text || "",
    kpis: (objective.kpis || []).map((kpi: any) => ({
      id: kpi.id,
      name: kpi.name || "",
      measurement_type: kpi.measurement_type || "number_amount",
      unit: kpi.unit || "count",
      direction: kpi.direction === "lower" ? "lower" : "higher",
      target: kpi.target == null ? null : Number(kpi.target),
      baseline:
        kpi.baseline == null || kpi.baseline === ""
          ? null
          : Number(kpi.baseline),
      weight_pct: Number(((kpi.weight_bp || 0) / 100).toFixed(2)),
    })),
  }));
}

function toApiObjectives(objectives: any[]) {
  return objectives.map((objective) => ({
    ...(objective.id ? { id: objective.id } : {}),
    category_id: objective.category_id,
    text: objective.text,
    kpis: (objective.kpis || []).map((kpi: any) => ({
      ...(kpi.id ? { id: kpi.id } : {}),
      name: kpi.name,
      measurement_type: kpi.measurement_type,
      unit: kpi.unit,
      direction: kpi.direction,
      target: kpi.target,
      baseline: kpi.baseline ?? null,
      weight_bp: Math.round((kpi.weight_pct || 0) * 100),
    })),
  }));
}

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
  const ar = useLocale() === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [cycleId, setCycleId] = useState<number>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState("");
  const [dialog, setDialog] = useState(false);
  const [form] = Form.useForm();
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

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
  const categories = useQuery({
    queryKey: ["meta", "objective-categories"],
    queryFn: metaApi.objectiveCategories,
    enabled: Boolean(selectedPlan),
  });
  const units = useQuery({
    queryKey: ["meta", "kpi-units"],
    queryFn: metaApi.kpiUnits,
    enabled: Boolean(selectedPlan),
  });

  useEffect(() => {
    if (!detail.data) return;
    form.setFieldsValue({
      objectives: toDraftObjectives(detail.data.objectives || []),
    });
  }, [detail.data, form]);

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
      setEditorOpen(true);
      await invalidatePlanQueries(plan.id);
    },
    onError: (error: Error) => {
      const apiError = error as ApiRequestError;
      const existingId = (apiError as any)?.details?.plan_id;
      if (existingId) {
        message.info(ar ? "الخطة موجودة مسبقاً" : "Plan already exists");
        setSelectedPlan({ id: existingId });
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

  const saveContent = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      plansApi.saveContent(id, body),
    onSuccess: async (plan: any) => {
      message.success(ar ? "تم حفظ محتوى الخطة" : "Plan content saved");
      setSelectedPlan(plan);
      setEditorOpen(false);
      if (mode === "admin") setAdminEditMode(false);
      await invalidatePlanQueries(plan.id);
    },
    onError: (error: Error) => {
      const apiError = error as ApiRequestError;
      const firstField = apiError.fields
        ? Object.values(apiError.fields)[0]?.[0]
        : undefined;
      message.error(firstField || apiError.message);
    },
  });

  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const cycleOptions = (cycles.data || []).map((c: any) => ({
    value: c.id,
    label: `${typeof c.name === "object" ? (ar ? c.name.ar : c.name.en) : c.name} · ${c.performance_year}`,
  }));
  const rows = ((plans.data as any)?.data || []) as Plan[];
  const members = (status.data as any)?.data || [];
  const planDetails = detail.data || selectedPlan;
  const canEdit = planDetails?.allowed_actions?.includes("edit_content");
  const canEditContent = canEdit && (mode !== "admin" || adminEditMode);
  const showHistory = mode !== "employee";

  useEffect(() => {
    setAdminEditMode(false);
  }, [selectedPlan?.id]);

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
            <Table
              rowKey="id"
              size="middle"
              dataSource={rows}
              pagination={{
                pageSize: 8,
                showTotal: (n) =>
                  ar ? `${n} خطة` : `${n} plan${n === 1 ? "" : "s"}`,
              }}
              scroll={{ x: "max-content" }}
              rowClassName={(record) =>
                selectedPlan?.id === record.id
                  ? "plan-row plan-row-selected"
                  : "plan-row"
              }
              onRow={(record) => ({
                onClick: () => setSelectedPlan(record),
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPlan(record);
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

        {selectedPlan && (
          <Card
            title={t("Plan details", "تفاصيل الخطة")}
            extra={
              <Button onClick={() => setSelectedPlan(null)} type="text">
                {t("Close", "إغلاق")}
              </Button>
            }
          >
            {detail.isLoading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: 160 }}>
                <Spin />
              </div>
            ) : detail.isError ? (
              <Alert
                type="error"
                showIcon
                title={(detail.error as Error).message}
              />
            ) : (
              <Tabs
                items={[
                  {
                    key: "content",
                    label: t("Objectives & KPIs", "الأهداف والمؤشرات"),
                    children: (
                      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                        <Space wrap size={[8, 8]}>
                          <Typography.Text strong>
                            {planDetails.employee?.name ||
                              planDetails.employee?.full_name}
                          </Typography.Text>
                          {planDetails.employee?.code ? (
                            <Typography.Text type="secondary">
                              #{planDetails.employee.code}
                            </Typography.Text>
                          ) : null}
                          {planStatusTag(planDetails.display_status, ar)}
                          {planDetails.requires_admin_attention ? (
                            <Tag color="orange">
                              {t("Requires admin attention", "يتطلب متابعة الإدارة")}
                            </Tag>
                          ) : null}
                        </Space>

                        {planDetails.display_status === "returned_to_manager" ||
                        planDetails.status === "returned" ? (
                          <Alert
                            type="warning"
                            showIcon
                            title={returnSourceLabel(planDetails.return_source, ar)}
                            description={
                              planDetails.open_comments ? (
                                <span>
                                  {planDetails.open_comments.actor?.name || "—"} ·{" "}
                                  {formatInstant(
                                    planDetails.open_comments.created_at,
                                    ar,
                                  )}
                                </span>
                              ) : (
                                t(
                                  "Review the comments, update the plan, then resubmit.",
                                  "راجع الملاحظات وحدّث الخطة ثم أعد الإرسال.",
                                )
                              )
                            }
                          />
                        ) : null}

                        {mode === "admin" && canEdit && !adminEditMode ? (
                          <Button type="primary" onClick={() => {
                            setAdminEditMode(true);
                            setEditorOpen(true);
                          }}>
                            {t("Edit submitted plan", "تعديل الخطة المرسلة")}
                          </Button>
                        ) : null}
                        {mode === "manager" && canEdit ? (
                          <Button type="primary" onClick={() => setEditorOpen(true)}>
                            {t("Edit objectives & KPIs", "تعديل الأهداف والمؤشرات")}
                          </Button>
                        ) : null}
                        {mode === "admin" && adminEditMode ? (
                          <Button onClick={() => {
                            form.setFieldsValue({ objectives: toDraftObjectives(detail.data?.objectives || []) });
                            setEditorOpen(false);
                            setAdminEditMode(false);
                          }}>
                            {t("Cancel editing", "إلغاء التعديل")}
                          </Button>
                        ) : null}
                        {mode === "employee" && planDetails.content_visible === false ? (
                          <Alert
                            type="info"
                            showIcon
                            title={t("Waiting for Manager Submission", "في انتظار إرسال المدير للخطة")}
                            description={t(
                              "Your manager has not yet submitted your objectives for review. You cannot comment or approve until they submit.",
                              "لم يقم مديرك بإرسال أهدافك للمراجعة بعد. لن تتمكن من التعليق أو الاعتماد قبل إرسال الخطة."
                            )}
                          />
                        ) : null}
                        <PlanReadonlyTree
                          ar={ar}
                          objectives={planDetails.objectives}
                          openComments={planDetails.open_comments}
                          contentVisible={planDetails.content_visible !== false}
                        />

                        <ActionButtons
                          actions={planDetails.allowed_actions || []}
                          ar={ar}
                          plan={planDetails}
                          onAction={(action) => openAction(planDetails, action)}
                        />
                      </Space>
                    ),
                  },
                  ...(showHistory
                    ? [
                        {
                          key: "history",
                          label: t("Workflow history", "سجل سير العمل"),
                          children: (
                            <PlanHistoryPanel
                              planId={planDetails.id}
                              ar={ar}
                            />
                          ),
                        },
                        {
                          key: "versions",
                          label: t("Plan versions", "إصدارات الخطة"),
                          children: (
                            <PlanSnapshotsPanel planId={planDetails.id} ar={ar} />
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            )}
          </Card>
        )}

        <Modal
          open={editorOpen}
          title={t("Edit performance objectives & KPIs", "تعديل أهداف ومؤشرات الأداء")}
          width={1080}
          onCancel={() => {
            form.setFieldsValue({ objectives: toDraftObjectives(detail.data?.objectives || []) });
            setEditorOpen(false);
            if (mode === "admin") setAdminEditMode(false);
          }}
          footer={null}
          destroyOnHidden={false}
          styles={{ body: { maxHeight: "calc(100vh - 190px)", overflowY: "auto", paddingTop: 16 } }}
        >
          {canEditContent && planDetails ? (
            <PlanContentEditor
              form={form}
              categories={(categories.data || []) as any}
              units={(units.data || {}) as KpiUnitsMeta}
              ar={ar}
              loading={saveContent.isPending}
              openComments={planDetails.open_comments}
              onSave={(objectives) => saveContent.mutate({
                id: planDetails.id,
                body: { version: planDetails.version, objectives: toApiObjectives(objectives) },
              })}
            />
          ) : (
            <Spin />
          )}
        </Modal>

        <PlanActionModal
          open={dialog}
          action={pendingAction}
          ar={ar}
          plan={detail.data || planDetails}
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
                version: (detail.data || planDetails).version,
                ...payload,
              },
            });
          }}
        />
      </div>

      <style>{`
        .plan-row { cursor: pointer; transition: background-color 0.15s ease; }
        .plan-row:hover > td { background: rgba(22, 119, 255, 0.06) !important; }
        .plan-row-selected > td { background: rgba(22, 119, 255, 0.1) !important; }
        .plan-row:focus-visible { outline: 2px solid #1677ff; outline-offset: -2px; }
      `}</style>
    </AppShell>
  );
}
