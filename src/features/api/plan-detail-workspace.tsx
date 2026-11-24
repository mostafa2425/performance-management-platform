"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { App, Alert, Button, Card, Col, Form, Row, Space, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { ApiRequestError } from "@/lib/api/client";
import { authApi, cyclesApi, employeesApi, metaApi, plansApi } from "@/lib/api/endpoints";
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
  const planData = planQuery.data;
  const plan = (planData ?? {}) as any;
  const cycles = useQuery({ queryKey: queryKeys.cycles, queryFn: cyclesApi.mine });
  const employeeProfileQuery = useQuery({
    queryKey: ["plan-employee-profile", mode, plan?.employee?.id],
    queryFn: () => mode === "employee" ? authApi.me() : employeesApi.get(plan.employee.id),
    enabled: Boolean(plan?.employee?.id),
  });
  const employeeProfile = mode === "employee"
    ? employeeProfileQuery.data?.employee
    : employeeProfileQuery.data;
  const categories = useQuery({ queryKey: ["meta", "objective-categories"], queryFn: metaApi.objectiveCategories });
  const units = useQuery({ queryKey: ["meta", "kpi-units"], queryFn: metaApi.kpiUnits });
  const cycle = useMemo(() => (cycles.data || []).find((item: any) => item.id === plan?.cycle_id), [cycles.data, plan?.cycle_id]);
  const canEdit = Boolean(plan?.allowed_actions?.includes("edit_content"));
  const canEditContent = canEdit && (mode !== "admin" || adminEditMode);

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
  const cycleLabel = cycle
    ? String(typeof cycle.name === "object" ? (ar ? cycle.name.ar : cycle.name.en) : cycle.name) + " · " + cycle.performance_year
    : "#" + String(plan.cycle_id);
  const employeeInfo: Array<[string, React.ReactNode]> = [
    [t("Employee", "الموظف"), employeeProfile?.full_name || employeeName],
    [t("Employee code", "كود الموظف"), employeeProfile?.code || plan.employee?.code || "—"],
    [t("Email", "البريد الإلكتروني"), employeeProfile?.email || "—"],
    [t("Department", "الإدارة"), employeeProfile?.department?.name || "—"],
    [t("Job title", "المسمى الوظيفي"), employeeProfile?.job_title?.name || "—"],
    [t("Business unit", "قطاع الأعمال"), employeeProfile?.business_unit?.name || "—"],
    [t("Location", "الموقع"), employeeProfile?.location?.name || "—"],
    [t("Line manager ID", "رقم المدير المباشر"), employeeProfile?.line_manager_id ?? "—"],
  ];
  const planInfo: Array<[string, React.ReactNode]> = [
    [t("Performance cycle", "دورة الأداء"), cycleLabel],
    [t("Current stage", "المرحلة الحالية"), cycle?.current_stage || "—"],
    [t("Plan version", "إصدار الخطة"), plan.version ?? "—"],
    [t("Created by role", "دور منشئ الخطة"), plan.author_role || "—"],
    [t("Created at", "تاريخ الإنشاء"), formatInstant(plan.created_at, ar)],
    [t("Last updated", "آخر تحديث"), formatInstant(plan.updated_at, ar)],
  ];
  const renderInfoCards = (items: Array<[string, React.ReactNode]>) => (
    <Row gutter={[10, 10]}>
      {items.map(([label, value]) => (
        <Col xs={12} sm={8} md={6} lg={6} key={label}>
          <Card size="small" style={{ height: "100%", borderRadius: 10 }} styles={{ body: { padding: "12px 14px" } }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
            <div style={{ fontWeight: 600, marginTop: 5, lineHeight: 1.45, overflowWrap: "anywhere" }}>{value || "—"}</div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  if (!Number.isFinite(planId) || planId <= 0) {
    return <AppShell role={mode} title={pageTitle}><Alert type="error" title={t("Invalid plan ID", "رقم الخطة غير صحيح")} /></AppShell>;
  }
  if (planQuery.isLoading) {
    return <AppShell role={mode} title={pageTitle}><div style={{ minHeight: 300, display: "grid", placeItems: "center" }}><Spin size="large" /></div></AppShell>;
  }
  if (planQuery.isError || !planData) {
    return <AppShell role={mode} title={pageTitle}><Alert type="error" showIcon title={(planQuery.error as Error)?.message || t("Plan not found", "لم يتم العثور على الخطة")} action={<Button onClick={() => router.push(listPath)}>{t("Back to plans", "العودة للخطط")}</Button>} /></AppShell>;
  }

  return (
    <AppShell
      role={mode}
      title={pageTitle}
      subtitle={t("Review employee information, objectives, KPIs and workflow.", "راجع بيانات الموظف والأهداف ومؤشرات الأداء وسير العمل.")}
    >
      <div style={{ width: "100%", maxWidth: mode === "employee" ? 1040 : "100%", marginInline: "auto" }}>
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
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
          styles={{ body: { padding: 16 } }}
        >
          <Space orientation="vertical" size={18} style={{ width: "100%" }}>
            <div>
              <Typography.Text strong style={{ display: "block", marginBottom: 10 }}>
                {t("Employee information", "بيانات الموظف")}
              </Typography.Text>
              {renderInfoCards(employeeInfo)}
            </div>
            <div>
              <Typography.Text strong style={{ display: "block", marginBottom: 10 }}>
                {t("Plan information", "بيانات الخطة")}
              </Typography.Text>
              {renderInfoCards(planInfo)}
            </div>
          </Space>
        </Card>

        {plan.return_source ? (
          <div style={{ maxWidth: mode === "employee" ? 720 : 960, width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            title={returnSourceLabel(plan.return_source, ar)}
            description={
              <Space orientation="vertical" size={4}>
                <Typography.Text>{plan.open_comments?.actor?.name || "—"} · {formatInstant(plan.open_comments?.created_at, ar)}</Typography.Text>
                {plan.open_comments?.comments?.map((comment: any, index: number) => (
                  <Typography.Text key={index}>{comment.body}</Typography.Text>
                ))}
              </Space>
            }
          />
          </div>
        ) : null}

        {mode === "employee" && plan.content_visible === false ? (
          <div style={{ maxWidth: 720, width: "100%" }}>
          <Alert type="info" showIcon message={t("Waiting for Manager Submission", "في انتظار إرسال المدير للخطة")}
            description={t("Your manager has not submitted your objectives for review yet. You cannot comment or approve until the plan is submitted.", "لم يرسل مديرك الأهداف للمراجعة بعد. لن تتمكن من التعليق أو الاعتماد قبل إرسال الخطة.")}
          />
          </div>
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
                    <Button onClick={() => { setEditing(false); setAdminEditMode(false); }}>
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
                initialObjectives={toDraftObjectives(plan.objectives || [])}
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
          <Space orientation="vertical" size={12} style={{ width: "100%" }}>
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
      </div>
    </AppShell>
  );
}
