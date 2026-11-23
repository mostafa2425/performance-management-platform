"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
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
import type { KpiUnitsMeta } from "@/lib/api/types";

type PlanMode = "manager" | "employee" | "admin";

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

function actionLabel(action: string, ar: boolean) {
  const labels: Record<string, [string, string]> = {
    edit_content: ["Edit", "تعديل"],
    delete: ["Delete", "حذف"],
    submit: ["Submit", "إرسال"],
    approve: ["Approve", "اعتماد"],
    return: ["Return", "إعادة"],
    request_modification: ["Request changes", "طلب تعديل"],
    attention_comment: ["Flag for admin", "تنبيه الإدارة"],
    reopen: ["Reopen", "إعادة فتح"],
  };
  const pair = labels[action];
  return pair ? (ar ? pair[1] : pair[0]) : action;
}

const PLAN_STATUS_META: Record<
  string,
  {
    en: string;
    ar: string;
    tone: "active" | "blue" | "gold" | "orange" | "purple" | "default";
  }
> = {
  not_started: { en: "Not started", ar: "لم تبدأ", tone: "default" },
  draft: { en: "Draft", ar: "مسودة", tone: "blue" },
  pending_admin_approval: {
    en: "Pending admin approval",
    ar: "بانتظار اعتماد الإدارة",
    tone: "gold",
  },
  returned_to_manager: {
    en: "Returned to manager",
    ar: "معاد للمدير",
    tone: "orange",
  },
  pending_employee_review: {
    en: "Pending employee review",
    ar: "بانتظار مراجعة الموظف",
    tone: "purple",
  },
  goals_approved: {
    en: "Goals approved",
    ar: "تم اعتماد الأهداف",
    tone: "active",
  },
};

function planStatusTag(value?: string | null, ar?: boolean) {
  if (!value) return <Tag style={{ marginInlineEnd: 0 }}>—</Tag>;
  const meta = PLAN_STATUS_META[value];
  const label = meta ? (ar ? meta.ar : meta.en) : value.replaceAll("_", " ");
  if (meta?.tone === "active")
    return <span className="table-status-active">{label}</span>;
  const color = meta?.tone === "default" ? undefined : meta?.tone;
  return (
    <Tag color={color} style={{ marginInlineEnd: 0 }}>
      {label}
    </Tag>
  );
}

export function ApiPlanWorkspace({ mode }: { mode: PlanMode }) {
  const ar = useLocale() === "ar";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [cycleId, setCycleId] = useState<number>();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [dialog, setDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [comment, setComment] = useState("");
  const [form] = Form.useForm();

  const cycles = useQuery({
    queryKey: queryKeys.cycles,
    queryFn: cyclesApi.mine,
  });
  const plans = useQuery({
    queryKey: [...queryKeys.plans, mode, cycleId],
    queryFn: () =>
      plansApi.list({
        ...(cycleId ? { filter: { cycle_id: cycleId } } : {}),
        per_page: 100,
      }),
  });
  const status = useQuery({
    queryKey: ["cycles", cycleId, "plan-status"],
    queryFn: () => cyclesApi.planStatus(cycleId!, { per_page: 100 }),
    enabled: mode === "manager" && Boolean(cycleId),
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

  const create = useMutation({
    mutationFn: (id: number) => plansApi.create(id),
    onSuccess: async (plan: any) => {
      message.success(ar ? "تم إنشاء مسودة الخطة" : "Plan draft created");
      setSelectedPlan(plan);
      await qc.invalidateQueries({ queryKey: queryKeys.plans });
      await qc.invalidateQueries({
        queryKey: ["cycles", cycleId, "plan-status"],
      });
    },
    onError: (error: Error) => message.error(error.message),
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
    onSuccess: async () => {
      message.success(ar ? "تم تنفيذ الإجراء" : "Workflow action completed");
      setDialog(false);
      setComment("");
      await qc.invalidateQueries({ queryKey: queryKeys.plans });
      if (selectedPlan?.id) {
        await qc.invalidateQueries({
          queryKey: [...queryKeys.plans, "detail", selectedPlan.id],
        });
      }
    },
    onError: (error: Error) => message.error(error.message),
  });

  const removePlan = useMutation({
    mutationFn: (id: number) => plansApi.remove(id),
    onSuccess: async () => {
      message.success(ar ? "تم حذف المسودة" : "Draft deleted");
      setSelectedPlan(null);
      await qc.invalidateQueries({ queryKey: queryKeys.plans });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const saveContent = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      plansApi.saveContent(id, body),
    onSuccess: async (plan: any) => {
      message.success(ar ? "تم حفظ محتوى الخطة" : "Plan content saved");
      setSelectedPlan(plan);
      await qc.invalidateQueries({ queryKey: queryKeys.plans });
      await qc.invalidateQueries({
        queryKey: [...queryKeys.plans, "detail", plan.id],
      });
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
  const rows = (plans.data as any)?.data || [];
  const members = (status.data as any)?.data || [];
  const planDetails = detail.data || selectedPlan;
  const canEdit = planDetails?.allowed_actions?.includes("edit_content");

  const doAction = () => {
    if (!selectedPlan) return;
    const body: any = { version: planDetails.version };
    if (["request_modification", "attention_comment"].includes(pendingAction))
      body.comment = comment;
    if (pendingAction === "reopen") body.reason = comment;
    if (pendingAction === "return") {
      body.comment = comment;
      const objective = planDetails.objectives?.[0];
      const kpi = objective?.kpis?.[0];
      body.comments = [
        objective
          ? { target: "objective", id: objective.id, body: comment }
          : kpi
            ? { target: "kpi", id: kpi.id, body: comment }
            : null,
      ].filter(Boolean);
    }
    if (pendingAction === "delete") {
      removePlan.mutate(selectedPlan.id);
      setDialog(false);
      return;
    }
    transition.mutate({ id: selectedPlan.id, action: pendingAction, body });
  };

  const title =
    mode === "admin"
      ? t("Plan reviews", "مراجعة الخطط")
      : mode === "manager"
        ? t("Team plans", "خطط الفريق")
        : t("My plan", "خطتي");
  const subtitle =
    mode === "admin"
      ? t(
          "Approve or return submitted plans.",
          "اعتماد أو إعادة الخطط المُرسلة.",
        )
      : mode === "manager"
        ? t(
            "Create, edit, and submit plans for your team.",
            "أنشئ وعدّل وأرسل خطط فريقك.",
          )
        : t(
            "Review your plan and approve or request changes.",
            "راجع خطتك واعتمدها أو اطلب تعديلاً.",
          );

  return (
    <AppShell
      role={
        mode === "admin" ? "admin" : mode === "manager" ? "manager" : "employee"
      }
      title={title}
      subtitle={subtitle}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
        }}
      >
        <Card>
          {mode !== "employee" && (
            <Select
              allowClear
              style={{ width: 320, maxWidth: "100%", marginBottom: 16 }}
              placeholder={t("Select cycle", "اختر الدورة")}
              options={cycleOptions}
              value={cycleId}
              onChange={setCycleId}
            />
          )}
          {mode === "manager" && cycleId && (
            <Card
              size="small"
              title={t("Start a plan", "بدء خطة")}
              style={{ marginBottom: 16 }}
            >
              <Select
                style={{ width: "100%" }}
                placeholder={t(
                  "Select a team member without a plan",
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
            <div
              style={{ display: "grid", placeItems: "center", minHeight: 180 }}
            >
              <Spin />
            </div>
          ) : plans.isError ? (
            <Alert
              type="error"
              showIcon
              title={(plans.error as Error).message}
            />
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
              locale={{ emptyText: t("No plans yet.", "لا توجد خطط بعد.") }}
              rowClassName={(record) =>
                selectedPlan?.id === record.id
                  ? "clickable-row clickable-row-selected"
                  : "clickable-row"
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
                  dataIndex: "code",
                  width: 100,
                  render: (_: unknown, row: ApiPlan) => (row.employee?.code ? `#${row.employee.code}` : "—"),
                },
                {
                  title: t("Employee", "الموظف"),
                  ellipsis: true,
                  render: (_: any, r: any) => (
                    <div className="table-primary-cell">
                      <strong>
                        {r.employee?.name || r.employee?.full_name || "—"}
                      </strong>
                    
                    </div>
                  ),
                },
                {
                  title: t("Status", "الحالة"),
                  dataIndex: "display_status",
                  width: 200,
                  render: (v: string) => planStatusTag(v, ar),
                },
                {
                  title: t("Actions", "الإجراءات"),
                  width: 280,
                  render: (_: any, r: any) => {
                    const actions = (r.allowed_actions || []).filter(
                      (action: string) => action !== "edit_content",
                    );
                    if (actions.length === 0) {
                      return <span className="table-muted-code">—</span>;
                    }
                    return (
                      <Space
                        wrap
                        size={[6, 6]}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actions.map((action: string) => (
                          <Button
                            key={action}
                            size="small"
                            type={
                              action === "approve" || action === "submit"
                                ? "primary"
                                : "default"
                            }
                            danger={action === "return" || action === "delete"}
                            onClick={() => {
                              setSelectedPlan(r);
                              setPendingAction(action);
                              setComment("");
                              setDialog(true);
                            }}
                          >
                            {actionLabel(action, ar)}
                          </Button>
                        ))}
                      </Space>
                    );
                  },
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
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  minHeight: 160,
                }}
              >
                <Spin />
              </div>
            ) : detail.isError ? (
              <Alert
                type="error"
                showIcon
                title={(detail.error as Error).message}
              />
            ) : (
              <>
                <Space wrap style={{ marginBottom: 12 }} size={[8, 8]}>
                  <Typography.Text strong>
                    {planDetails.employee?.name ||
                      planDetails.employee?.full_name}
                  </Typography.Text>
                  {planDetails.employee?.code ? (
                    <span className="table-muted-code">
                      #{planDetails.employee.code}
                    </span>
                  ) : null}
                  {planStatusTag(planDetails.display_status, ar)}
                </Space>
                {!planDetails.content_visible && (
                  <Alert
                    type="info"
                    showIcon
                    title={t(
                      "Plan content is not visible yet for your role.",
                      "محتوى الخطة غير ظاهر لصلاحيتك حالياً.",
                    )}
                  />
                )}
                {canEdit ? (
                  <PlanContentEditor
                    form={form}
                    categories={(categories.data || []) as any}
                    units={(units.data || {}) as KpiUnitsMeta}
                    ar={ar}
                    loading={saveContent.isPending}
                    onSave={(objectives) =>
                      saveContent.mutate({
                        id: planDetails.id,
                        body: {
                          version: planDetails.version,
                          objectives: toApiObjectives(objectives),
                        },
                      })
                    }
                  />
                ) : (
                  (planDetails.objectives || []).map(
                    (objective: any, index: number) => (
                      <Card
                        size="small"
                        key={objective.id || index}
                        title={objective.text}
                        style={{ marginBottom: 8 }}
                      >
                        {(objective.kpis || []).map((kpi: any) => (
                          <Typography.Paragraph
                            key={kpi.id}
                            style={{ marginBottom: 4 }}
                          >
                            {kpi.name} · {t("Target", "المستهدف")}: {kpi.target}{" "}
                            · {t("Weight", "الوزن")}:{" "}
                            {(kpi.weight_bp / 100).toFixed(2)}%
                          </Typography.Paragraph>
                        ))}
                      </Card>
                    ),
                  )
                )}
                {(planDetails.allowed_actions || []).filter(
                  (action: string) => action !== "edit_content",
                ).length > 0 && (
                  <Space wrap style={{ marginTop: 12 }}>
                    {(planDetails.allowed_actions || [])
                      .filter((action: string) => action !== "edit_content")
                      .map((action: string) => (
                        <Button
                          key={action}
                          type={
                            action === "approve" || action === "submit"
                              ? "primary"
                              : "default"
                          }
                          danger={action === "return" || action === "delete"}
                          onClick={() => {
                            setPendingAction(action);
                            setComment("");
                            setDialog(true);
                          }}
                        >
                          {actionLabel(action, ar)}
                        </Button>
                      ))}
                  </Space>
                )}
              </>
            )}
          </Card>
        )}

        <Modal
          open={dialog}
          title={actionLabel(pendingAction, ar)}
          onCancel={() => setDialog(false)}
          onOk={doAction}
          confirmLoading={transition.isPending || removePlan.isPending}
          okButtonProps={{
            disabled:
              detail.isLoading ||
              ([
                "return",
                "request_modification",
                "attention_comment",
                "reopen",
              ].includes(pendingAction) &&
                !comment.trim()),
          }}
        >
          {[
            "return",
            "request_modification",
            "attention_comment",
            "reopen",
          ].includes(pendingAction) ? (
            <Input.TextArea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("Add a required comment", "أضف تعليقاً مطلوباً")}
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              title={t(
                "This updates the official plan workflow.",
                "سيؤدي هذا إلى تحديث سير عمل الخطة رسمياً.",
              )}
            />
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
