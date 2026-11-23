"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { App, Alert, Button, Card, Descriptions, Form, Space, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { ApiRequestError } from "@/lib/api/client";
import { cyclesApi, metaApi, plansApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import type { KpiUnitsMeta } from "@/lib/api/types";
import { PlanContentEditor } from "./plan-content-editor";
import { PlanReadonlyTree } from "./plans/plan-readonly-tree";
import { PlanActionModal } from "./plans/plan-action-modal";
import { PlanHistoryPanel } from "./plans/plan-history-panel";
import { PlanSnapshotsPanel } from "./plans/plan-snapshots-panel";
import { formatInstant, planStatusTag, resolveActionLabel, returnSourceLabel, workflowActions, type PlanMode } from "./plans/plan-shared";

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
      baseline: kpi.baseline == null || kpi.baseline === "" ? null : Number(kpi.baseline),
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

function WorkflowActions({ plan, ar, onAction }: { plan: any; ar: boolean; onAction: (action: string) => void }) {
  const actions = workflowActions(plan?.allowed_actions || []);
  const t = (en: string, arabic: string) => ar ? arabic : en;
  if (!actions.length) return null;
  return (
    <Space wrap>
      {actions.map((action: string) => (
        <Button
          key={action}
          type={["submit", "approve", "employee_approve"].includes(action) ? "primary" : "default"}
          danger={["return", "delete", "request_modification"].includes(action)}
          onClick={() => onAction(action)}
        >
          {resolveActionLabel(action, ar, plan)}
        </Button>
      ))}
    </Space>
  );
}

export function ApiPlanDetailWorkspace({ mode }: { mode: PlanMode }) {
  const params = useParams<{ planId: string }>();
  const planId = Number(params.planId);
  const router = useRouter();
  const locale = useLocale();
  const ar = locale === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [actionDialog, setActionDialog] = useState(false);
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const listPath = `/${locale}/${mode === "admin" ? "admin/plan-reviews" : mode === "manager" ? "manager/objectives" : "employee/objectives"}`;

  const planQuery = useQuery({
    queryKey: [...queryKeys.plans, "detail", planId],
    queryFn: () => plansApi.get(planId),
    enabled: Number.isFinite(planId) && planId > 0,
  });
  const plan = planQuery.data as any;
  const cycles = useQuery({ queryKey: queryKeys.cycles, queryFn: cyclesApi.mine });
  const categories = useQuery({ queryKey: ["meta", "objective-categories"], queryFn: metaApi.objectiveCategories });
  const units = useQuery({ queryKey: ["meta", "kpi-units"], queryFn: metaApi.kpiUnits });
  const cycle = useMemo(() => (cycles.data || []).find((item: any) => item.id === plan?.cycle_id), [cycles.data, plan?.cycle_id]);
  const canEdit = Boolean(plan?.allowed_actions?.includes("edit_content"));
  const canEditContent = canEdit && (mode !== "admin" || adminEditMode);

  useEffect(() => {
    if (!plan) return;
    form.setFieldsValue({ objectives: toDraftObjectives(plan.objectives || []) });
    if (mode === "manager" && plan.allowed_actions?.includes("edit_content")) setEditing(true);
  }, [plan?.id, form, mode]);

  const refresh = async (id?: number) => {
    await qc.invalidateQueries({ queryKey: queryKeys.plans });
    await qc.invalidateQueries({ queryKey: [ "cycles" ] });
    if (id) await qc.invalidateQueries({ queryKey: [...queryKeys.plans, "detail", id] });
  };

  const save = useMutation({
    mutationFn: (objectives: any[]) => plansApi.saveContent(planId, {
      version: plan.version,
      objectives: toApiObjectives(objectives),
    }),
    onSuccess: async (updated: any) => {
      message.success(t("Plan content saved", "تم حفظ محتوى الخطة"));
      setEditing(false);
      setAdminEditMode(false);
      await refresh(updated?.id || planId);
    },
    onError: (error: Error) => {
      const apiError = error as ApiRequestError;
      const fieldError = apiError.fields ? Object.values(apiError.fields)[0]?.[0] : undefined;
      message.error(fieldError || apiError.message);
    },
  });

  const transition = useMutation({
    mutationFn: ({ action, payload }: { action: string; payload: any }) =>
      plansApi.transition(planId, action, { version: plan.version, ...payload }),
    onSuccess: async (updated: any) => {
      message.success(t("Workflow action completed", "تم تنفيذ الإجراء بنجاح"));
      setActionDialog(false);
      setPendingAction("");
      await refresh(updated?.id || planId);
    },
    onError: (error: Error) => message.error(error.message),
  });

  const removePlan = useMutation({
    mutationFn: () => plansApi.remove(planId),
    onSuccess: async () => {
      message.success(t("Draft deleted", "تم حذف المسودة"));
      await refresh(planId);
      router.push(listPath);
    },
    onError: (error: Error) => message.error(error.message),
  });

  const historyVisible = mode !== "employee";
  const employeeName = plan?.employee?.name || plan?.employee?.full_name || "—";
  const pageTitle = t("Plan details", "تفاصيل الخطة");

  if (!Number.isFinite(planId) || planId <= 0) {
    return <AppShell role={mode} title={pageTitle}><Alert type="error" title={t("Invalid plan ID", "رقم الخطة غير صحيح")} /></AppShell>;
  }
  if (planQuery.isLoading) {
    return <AppShell role={mode} title={pageTitle}><div style={{ minHeight: 300, display: "grid", placeItems: "center" }}><Spin size="large" /></div></AppShell>;
  }
  if (planQuery.isError || !plan) {
    return <AppShell role={mode} title={pageTitle}><Alert type="error" showIcon title={(planQuery.error as Error)?.message || t("Plan not found", "لم يتم العثور على الخطة")} action={<Button onClick={() => router.push(listPath)}>{t("Back to plans", "العودة للخطط")}</Button>} /></AppShell>;
  }

  return (
    <AppShell
      role={mode}
      title={pageTitle}
      subtitle={t("Review employee information, objectives, KPIs and workflow.", "راجع بيانات الموظف والأهداف ومؤشرات الأداء وسير العمل.")}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(listPath)} type="text">
          {t("Back to objectives", "العودة إلى الأهداف")}
        </Button>

        <Card
          title={
            <Space wrap size={10}>
              <Typography.Title level={4} style={{ margin: 0 }}>{employeeName}</Typography.Title>
              {plan.employee?.code ? <Tag>#{plan.employee.code}</Tag> : null}
              {planStatusTag(plan.display_status, ar)}
              {plan.requires_admin_attention ? <Tag color="orange">{t("Needs attention", "تحتاج إلى متابعة")}</Tag> : null}
            </Space>
          }
          extra={<Typography.Text type="secondary">{t("Plan", "الخطة")} #{plan.id}</Typography.Text>}
        >
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
            items={[
              { key: "employee", label: t("Employee", "الموظف"), children: employeeName },
              { key: "code", label: t("Employee code", "كود الموظف"), children: plan.employee?.code || "—" },
              { key: "cycle", label: t("Performance cycle", "دورة الأداء"), children: cycle ? `${typeof cycle.name === "object" ? (ar ? cycle.name.ar : cycle.name.en) : cycle.name} · ${cycle.performance_year}` : `#${plan.cycle_id}` },
              { key: "stage", label: t("Current stage", "المرحلة الحالية"), children: cycle?.current_stage || "—" },
              { key: "version", label: t("Plan version", "إصدار الخطة"), children: plan.version ?? "—" },
              { key: "author", label: t("Created by role", "دور منشئ الخطة"), children: plan.author_role || "—" },
              { key: "created", label: t("Created at", "تاريخ الإنشاء"), children: formatInstant(plan.created_at, ar) },
              { key: "updated", label: t("Last updated", "آخر تحديث"), children: formatInstant(plan.updated_at, ar) },
            ]}
          />
        </Card>

        {plan.return_source ? (
          <Alert
            type="warning"
            showIcon
            title={returnSourceLabel(plan.return_source, ar)}
            description={
              <Space direction="vertical" size={4}>
                <Typography.Text>{plan.open_comments?.actor?.name || "—"} · {formatInstant(plan.open_comments?.created_at, ar)}</Typography.Text>
                {plan.open_comments?.comments?.map((comment: any, index: number) => (
                  <Typography.Text key={index}>{comment.body}</Typography.Text>
                ))}
              </Space>
            }
          />
        ) : null}

        {mode === "employee" && plan.content_visible === false ? (
          <Alert type="info" showIcon message={t("Waiting for Manager Submission", "في انتظار إرسال المدير للخطة")}
            description={t("Your manager has not submitted your objectives for review yet. You cannot comment or approve until the plan is submitted.", "لم يرسل مديرك الأهداف للمراجعة بعد. لن تتمكن من التعليق أو الاعتماد قبل إرسال الخطة.")}
          />
        ) : null}

        <Card
          title={t("Objectives & KPIs", "الأهداف ومؤشرات الأداء")}
          extra={
            canEdit ? (
              mode === "admin" && !adminEditMode ? (
                <Button type="primary" icon={<EditOutlined />} onClick={() => { setAdminEditMode(true); setEditing(true); }}>
                  {t("Edit submitted plan", "تعديل الخطة المرسلة")}
                </Button>
              ) : (
                <Space>
                  {editing ? (
                    <Button onClick={() => { form.setFieldsValue({ objectives: toDraftObjectives(plan.objectives || []) }); setEditing(false); setAdminEditMode(false); }}>
                      {t("Cancel editing", "إلغاء التعديل")}
                    </Button>
                  ) : (
                    <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                      {t("Edit objectives", "تعديل الأهداف")}
                    </Button>
                  )}
                </Space>
              )
            ) : null
          }
        >
          {editing && canEditContent ? (
            categories.isLoading || units.isLoading ? <Spin /> : categories.isError || units.isError ? (
              <Alert type="error" showIcon title={t("Could not load objective categories or KPI units.", "تعذر تحميل تصنيفات الأهداف أو وحدات المؤشرات.")} />
            ) : (
              <PlanContentEditor
                form={form}
                categories={(categories.data || []) as any}
                units={(units.data || {}) as KpiUnitsMeta}
                ar={ar}
                loading={save.isPending}
                openComments={plan.open_comments}
                onSave={(objectives) => save.mutate(objectives)}
              />
            )
          ) : (
            <PlanReadonlyTree
              ar={ar}
              objectives={plan.objectives}
              openComments={plan.open_comments}
              contentVisible={plan.content_visible !== false}
            />
          )}
        </Card>

        <Card title={t("Workflow actions", "إجراءات سير العمل")}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {plan.allowed_actions?.length ? (
              <WorkflowActions plan={plan} ar={ar} onAction={(action) => { setPendingAction(action); setActionDialog(true); }} />
            ) : <Typography.Text type="secondary">{t("No actions are available at this stage.", "لا توجد إجراءات متاحة في هذه المرحلة.")}</Typography.Text>}
            <Typography.Text type="secondary">
              {t("Actions are controlled by your role, plan state and cycle deadlines.", "تتحدد الإجراءات وفقاً لصلاحيتك وحالة الخطة ومواعيد الدورة.")}
            </Typography.Text>
          </Space>
        </Card>

        {historyVisible ? (
          <Card title={t("Workflow history", "سجل سير العمل")}>
            <PlanHistoryPanel planId={plan.id} ar={ar} />
          </Card>
        ) : null}
        {historyVisible ? (
          <Card title={t("Plan snapshots", "نسخ الخطة المحفوظة")}>
            <PlanSnapshotsPanel planId={plan.id} ar={ar} />
          </Card>
        ) : null}

        <PlanActionModal
          open={actionDialog}
          action={pendingAction}
          ar={ar}
          plan={plan}
          loading={transition.isPending || removePlan.isPending}
          onCancel={() => { setActionDialog(false); setPendingAction(""); }}
          onConfirm={(payload) => {
            if (pendingAction === "delete") {
              removePlan.mutate();
              setActionDialog(false);
              return;
            }
            transition.mutate({ action: pendingAction, payload });
          }}
        />
      </Space>
    </AppShell>
  );
}
