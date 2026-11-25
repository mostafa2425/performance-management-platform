"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { App, Alert, Button, Card, Col, Row, Space, Skeleton, Tag, Typography } from "antd";
import { ArrowLeftOutlined, CheckCircleFilled, EditOutlined } from "@ant-design/icons";
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
      weight_pct: Math.round((kpi.weight_bp || 0) / 100),
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
          className={["approve", "employee_approve"].includes(action) ? "pmp-approve-button" : undefined}
          icon={["approve", "employee_approve"].includes(action) ? <CheckCircleFilled /> : undefined}
          danger={["return", "delete", "request_modification"].includes(action)}
          onClick={() => onAction(action)}
        >
          {resolveActionLabel(action, ar, plan)}
        </Button>
      ))}
    </Space>
  );
}

function PlanDetailLoadingSkeleton({ mode }: { mode: PlanMode }) {
  const infoCards = (count: number) => (
    <Row gutter={[10, 10]}>
      {Array.from({ length: count }, (_, index) => (
        <Col xs={12} sm={8} md={6} key={index}>
          <Card className="plan-detail-info-card" size="small" style={{ height: "100%", borderRadius: 10 }}>
            <Skeleton active title={false} paragraph={{ rows: 2, width: ["42%", "76%"] }} />
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="plan-detail-workspace plan-detail-loading" style={{ width: "100%" }}>
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <div className="plan-detail-page-toolbar">
          <div className="plan-detail-page-heading">
            <Skeleton.Button active shape="default" size="large" />
            <div style={{ flex: 1, minWidth: 220 }}>
              <Skeleton active title={{ width: 180 }} paragraph={{ rows: 1, width: "68%" }} />
            </div>
          </div>
          <Space wrap>
            <Skeleton.Button active />
            <Skeleton.Button active />
          </Space>
        </div>

        <Card className="plan-detail-hero-card" styles={{ body: { padding: 16 } }}>
          <Space orientation="vertical" size={18} style={{ width: "100%" }}>
            <Skeleton active title={{ width: 220 }} paragraph={false} />
            <div>
              <Skeleton active title={{ width: 150 }} paragraph={false} />
              {infoCards(8)}
            </div>
            <div>
              <Skeleton active title={{ width: 130 }} paragraph={false} />
              {infoCards(6)}
            </div>
          </Space>
        </Card>

        <Card className="plan-detail-section plan-detail-objectives" title={<Skeleton.Input active size="small" />}>
          <Row gutter={[12, 12]}>
            {[0, 1, 2].map((item) => (
              <Col xs={12} md={8} key={item}>
                <Card className="plan-summary-card" size="small">
                  <Skeleton active title={{ width: "48%" }} paragraph={{ rows: 1, width: "30%" }} />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: 18 }}>
            <Skeleton active title={false} paragraph={{ rows: 1, width: "58%" }} />
            {[0, 1].map((item) => (
              <Card key={item} size="small" style={{ marginTop: 10 }}>
                <Skeleton active title={{ width: "52%" }} paragraph={{ rows: 1, width: "34%" }} />
                <Row gutter={[12, 12]}>
                  {[0, 1].map((kpi) => (
                    <Col xs={24} md={12} key={kpi}>
                      <Card size="small"><Skeleton active title={{ width: "46%" }} paragraph={{ rows: 2 }} /></Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            ))}
          </div>
        </Card>

        {mode !== "employee" ? (
          <div className="plan-detail-workflow-grid">
            <Card className="plan-detail-section plan-detail-history" title={<Skeleton.Input active size="small" />}>
              <Space orientation="vertical" size={20} style={{ width: "100%" }}>
                {[0, 1, 2, 3].map((item) => (
                  <Space key={item} align="start" size={12}>
                    <Skeleton.Avatar active size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Skeleton active title={{ width: "58%" }} paragraph={{ rows: 2, width: ["36%", "78%"] }} />
                    </div>
                  </Space>
                ))}
              </Space>
            </Card>
          </div>
        ) : null}

        {mode !== "employee" ? (
          <Card className="plan-detail-section plan-detail-snapshots" title={<Skeleton.Input active size="small" />}>
            {[0, 1].map((item) => (
              <Card key={item} size="small" style={{ marginBottom: 10 }}>
                <Skeleton active title={{ width: "48%" }} paragraph={false} />
              </Card>
            ))}
          </Card>
        ) : null}
      </Space>
    </div>
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
  const [addObjectiveRequest, setAddObjectiveRequest] = useState(0);
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
  const isDraft = String(plan?.status?.key ?? plan?.status ?? "").toLowerCase() === "draft";
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
  ];
  const planInfo: Array<[string, React.ReactNode]> = [
    [t("Performance cycle", "دورة الأداء"), cycleLabel],
    [t("Created at", "تاريخ الإنشاء"), formatInstant(plan.created_at, ar)],
    [t("Last updated", "آخر تحديث"), formatInstant(plan.updated_at, ar)],
  ];
  const renderInfoCards = (items: Array<[string, React.ReactNode]>) => (
    <Row gutter={[10, 10]}>
      {items.map(([label, value]) => (
        <Col xs={12} sm={8} md={6} lg={6} key={label}>
          <Card className="plan-detail-info-card" size="small" style={{ height: "100%", borderRadius: 10 }} styles={{ body: { padding: "12px 14px" } }}>
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
    return (
      <AppShell role={mode} title={pageTitle}>
        <PlanDetailLoadingSkeleton mode={mode} />
      </AppShell>
    );
  }
  if (planQuery.isError || !planData) {
    return <AppShell role={mode} title={pageTitle}><Alert type="error" showIcon title={(planQuery.error as Error)?.message || t("Plan not found", "لم يتم العثور على الخطة")} action={<Button onClick={() => router.push(listPath)}>{t("Back to plans", "العودة للخطط")}</Button>} /></AppShell>;
  }

  return (
    <AppShell
      role={mode}
    >
      <div className="plan-detail-workspace" style={{ width: "100%", maxWidth: mode === "employee" ? 1040 : "100%", marginInline: "auto" }}>
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <div className="plan-detail-page-toolbar">
          <div className="plan-detail-page-heading">
            <Button
              type="text"
              className="plan-detail-back-button"
              icon={<ArrowLeftOutlined />}
              aria-label={t("Back to objectives", "العودة إلى الأهداف")}
              title={t("Back to objectives", "العودة إلى الأهداف")}
              onClick={() => router.push(listPath)}
            />
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>{pageTitle}</Typography.Title>
              <Typography.Text type="secondary">
                {t("Review employee information, objectives, KPIs and workflow.", "راجع بيانات الموظف والأهداف ومؤشرات الأداء وسير العمل.")}
              </Typography.Text>
            </div>
          </div>
          <div className="plan-detail-page-actions">
            <Space wrap>
              {mode === "manager" && isDraft && canEdit ? (
                <Button type="primary" icon={<EditOutlined />} onClick={() => { setEditing(true); setAddObjectiveRequest((value) => value + 1); }}>
                  {t("Add objective", "إضافة هدف")}
                </Button>
              ) : null}
              <WorkflowActions plan={editing ? { ...plan, allowed_actions: (plan.allowed_actions || []).filter((action: string) => !["submit", "submit_plan"].includes(action)) } : plan} ar={ar} onAction={(action) => { setPendingAction(action); setActionDialog(true); }} />
            </Space>
          </div>
        </div>

        <Card
          className="plan-detail-hero-card"
          title={
            <Space wrap size={10}>
              <Typography.Title level={4} style={{ margin: 0 }}>{employeeName}</Typography.Title>
              {plan.employee?.code ? <Tag>#{plan.employee.code}</Tag> : null}
              {planStatusTag(plan.status, ar)}
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
          <Alert type="info" showIcon title={t("Waiting for Manager Submission", "في انتظار إرسال المدير للخطة")}
            description={t("Your manager has not submitted your objectives for review yet. You cannot comment or approve until the plan is submitted.", "لم يرسل مديرك الأهداف للمراجعة بعد. لن تتمكن من التعليق أو الاعتماد قبل إرسال الخطة.")}
          />
          </div>
        ) : null}

        <Card
          className="plan-detail-section plan-detail-objectives"
          title={t("Objectives & KPIs", "الأهداف ومؤشرات الأداء")}
          extra={
            canEdit ? (
              mode === "admin" && !adminEditMode ? (
                <Button type="primary" icon={<EditOutlined />} onClick={() => { setAdminEditMode(true); setEditing(true); }}>
                  {t("Edit submitted plan", "تعديل الخطة المرسلة")}
                </Button>
              ) : (
                <Space wrap>
                  {editing ? (
                    <>
                      <Button onClick={() => { setEditing(false); setAdminEditMode(false); }}>
                        {t("Cancel editing", "إلغاء التعديل")}
                      </Button>
                      {categories.isSuccess && units.isSuccess ? (
                        <Button type="primary" htmlType="submit" form="plan-content-editor-form" loading={save.isPending}>
                          {t("Save draft", "حفظ المسودة")}
                        </Button>
                      ) : null}
                    </>
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
            categories.isLoading || units.isLoading ? <Skeleton active /> : categories.isError || units.isError ? (
              <Alert type="error" showIcon title={t("Could not load objective categories or KPI units.", "تعذر تحميل تصنيفات الأهداف أو وحدات المؤشرات.")} />
            ) : (
              <PlanContentEditor
                initialObjectives={toDraftObjectives(plan.objectives || [])}
                categories={(categories.data || []) as any}
                units={(units.data || {}) as KpiUnitsMeta}
                ar={ar}
                loading={save.isPending}
                addObjectiveRequest={addObjectiveRequest}
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

        <div className={historyVisible ? "plan-detail-workflow-grid" : undefined}>
          {historyVisible ? (
            <Card className="plan-detail-section plan-detail-history" title={t("Workflow history", "سجل سير العمل")}>
              <PlanHistoryPanel planId={plan.id} ar={ar} />
            </Card>
          ) : null}
        </div>

        {historyVisible ? (
          <Card className="plan-detail-section plan-detail-snapshots" title={t("Plan snapshots", "نسخ الخطة المحفوظة")}>
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
