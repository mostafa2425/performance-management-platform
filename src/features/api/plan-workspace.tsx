"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Dropdown,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircleFilled, MoreOutlined } from "@ant-design/icons";
import { cyclesApi, plansApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { usePerformanceCycle } from "@/features/performance-cycles/performance-cycle-provider";
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
  plan?: { status?: { key?: string } | null } | null;
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
          type={["approve", "submit", "employee_approve"].includes(action) ? "primary" : "default"}
          className={["approve", "employee_approve"].includes(action) ? "pmp-approve-button" : undefined}
          icon={["approve", "employee_approve"].includes(action) ? <CheckCircleFilled /> : undefined}
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
  const { cycleId, options: cycleOptions, cycles } = usePerformanceCycle();
  const [cycleFilter, setCycleFilter] = useState<number | undefined>(undefined);
  const [cycleFilterTouched, setCycleFilterTouched] = useState(false);
  const selectedCycleId = mode === "admin" ? (cycleFilterTouched ? cycleFilter : cycleId) : cycleId;
  const [statusFilter, setStatusFilter] = useState<string>();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState("");
  const [dialog, setDialog] = useState(false);

  const listParams = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (selectedCycleId) filter.cycle_id = selectedCycleId;
    if (statusFilter) filter.status = statusFilter;
    return { per_page: 100, ...(Object.keys(filter).length ? { filter } : {}) };
  }, [selectedCycleId, statusFilter]);

  const plans = useQuery({
    queryKey: [...queryKeys.plans, mode, listParams],
    queryFn: () => plansApi.list(listParams),
    enabled: mode === "admin" ? !cycles.isLoading : Boolean(cycleId),
  });
  const status = useQuery({
    queryKey: ["cycles", cycleId, "plan-status"],
    queryFn: () => cyclesApi.planStatus(cycleId!, { per_page: 100 }),
    enabled: mode === "manager" && Boolean(cycleId),
  });
  const adminStatusQueries = useQueries({
    queries: mode === "admin"
      ? (selectedCycleId != null
          ? [selectedCycleId]
          : (cycles.data || []).map((cycle: any) => cycle.id)
        ).map((id: number) => ({
          queryKey: ["cycles", id, "plan-status"],
          queryFn: () => cyclesApi.planStatus(id, { per_page: 200 }),
          select: (response: any) => ({
            ...response,
            data: (response?.data || []).map((member: any) => ({
              ...member,
              cycle_id: member.cycle_id ?? id,
            })),
          }),
          enabled: true,
        }))
      : [],
  });
  const detail = useQuery({
    queryKey: [...queryKeys.plans, "detail", selectedPlan?.id],
    queryFn: () => plansApi.get(selectedPlan.id),
    enabled: Boolean(selectedPlan?.id),
  });


  const invalidatePlanQueries = async (planId?: number) => {
    await qc.invalidateQueries({ queryKey: queryKeys.plans });
    await qc.invalidateQueries({ queryKey: ["cycles"] });
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
  const rows = ((plans.data as any)?.data || []) as Plan[];
  const members = mode === "admin"
    ? adminStatusQueries.flatMap((query) => ((query.data as any)?.data || []).map((member: any) => ({ ...member })))
    : (status.data as any)?.data || [];
  const memberByPlanId = new Map<number, any>(members.filter((member: any) => member.plan_id != null).map((member: any) => [Number(member.plan_id), member]));
  const adminStatusLoading = adminStatusQueries.some((query) => query.isFetching);
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

  const dialogOpen = dialog || (pendingAction === "return" && Boolean(selectedPlan?.id) && detail.data?.id === selectedPlan?.id);

  const title =
    mode === "admin"
      ? t("Plan reviews", "مراجعة الخطط")
      : mode === "manager"
        ? t("Team objectives", "أهداف الفريق")
        : t("My plan", "خطتي");
  const subtitle =
    mode === "admin"
      ? t(
          "Review submitted performance plans, approve them, or return them with feedback.",
          "راجع خطط الأداء المقدمة واعتمدها أو أعدها مع الملاحظات.",
        )
      : mode === "manager"
        ? t(
            "Create, review, and manage your team’s performance objectives throughout the active cycle.",
            "أنشئ أهداف فريقك وراجعها وأدرها طوال دورة الأداء الحالية.",
          )
        : t(
            "Review your performance plan, confirm your objectives, or request changes.",
            "راجع خطة أدائك وأكد أهدافك أو اطلب إجراء تعديلات.",
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
        {(mode === "manager" || mode === "admin") && (mode === "admin" || cycleId) ? (
          <Alert
            type="info"
            showIcon
            title={t("Some goal-setting tools need backend support", "بعض أدوات إعداد الأهداف تحتاج إلى دعم من الخادم")}
            description={t(
              "The current API supports plan creation, editing, validation and workflow actions. It does not expose objective templates, copy-previous-cycle, SMART analysis (70% score), or AI wording suggestions yet.",
              "تدعم الواجهة الحالية إنشاء الخطة وتعديلها والتحقق منها وإجراءات سير العمل، لكنها لا توفر بعد قوالب الأهداف أو نسخ أهداف الدورة السابقة أو تحليل SMART (70%) أو تحسين الصياغة بالذكاء الاصطناعي."
            )}
          />
        ) : null}
        <Card>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>

            {mode === "admin" && (
              <>
                <Col xs={24} md={8}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    placeholder={t("Select performance cycle", "اختر دورة الأداء")}
                    value={selectedCycleId}
                    onChange={(value) => {
                      setCycleFilterTouched(true);
                      setCycleFilter(value);
                    }}
                    options={cycleOptions}
                  />
                </Col>
                <Col xs={24} md={8}>
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
                <Col xs={24} md={8}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    placeholder={t("Select a member without a plan", "اختر عضواً بلا خطة")}
                    options={members
                      .filter((member: any) => !member.plan_id)
                      .map((member: any) => {
                        const cycleLabel = cycleOptions.find((option) => option.value === member.cycle_id)?.label;
                        const employeeName = member.employee?.name || member.employee?.full_name || member.cycle_member_id;
                        return {
                          value: member.cycle_member_id,
                          label: selectedCycleId == null && cycleLabel ? `${employeeName} · ${cycleLabel}` : employeeName,
                        };
                      })}
                    onChange={(id) => create.mutate(id)}
                    loading={adminStatusLoading || create.isPending}
                    disabled={!members.some((member: any) => !member.plan_id)}
                  />
                </Col>
              </>
            )}
          </Row>

          {mode === "manager" && cycleId && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                placeholder={t("Select a member without a plan", "اختر عضواً بلا خطة")}
                options={members.filter((member: any) => !member.plan_id).map((member: any) => ({
                  value: member.cycle_member_id,
                  label: member.employee?.name || member.employee?.full_name || member.cycle_member_id,
                }))}
                onChange={(id) => create.mutate(id)}
                loading={status.isFetching || create.isPending}
              />
            </Card>
          )}

          {plans.isError && rows.length === 0 ? (
            <Alert type="error" showIcon title={(plans.error as Error).message} />
          ) : (
            <DataTable
              rowKey="id"
              size="middle"
              loading={{ spinning: plans.isFetching, delay: 150 }}
              locale={{ emptyText: <Empty description={t("No plans yet.", "لا توجد خطط بعد.")} /> }}
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
                ...(mode !== "employee" ? [
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
                ] : []),
                {
                  title: t("Current manager", "المدير الحالي"),
                  width: 190,
                  render: (_: unknown, row: Plan) => {
                    const member = memberByPlanId.get(Number(row.id));
                    const manager = (row as any).current_manager || member?.current_manager;
                    return manager ? (
                      <Typography.Text strong>{manager.name || manager.full_name || "—"}</Typography.Text>
                    ) : "—";
                  },
                },
                ...(mode === "employee" ? [
                  {
                    title: t("Performance cycle", "دورة الأداء"),
                    width: 220,
                    render: (_: unknown, row: Plan) => {
                      const cycle = (row as any).cycle;
                      const cycleName = typeof cycle?.name === "object"
                        ? (ar ? cycle.name.ar || cycle.name.en : cycle.name.en || cycle.name.ar)
                        : cycle?.name;
                      const cycleOption = cycleOptions.find((option) => option.value === Number((row as any).cycle_id));
                      return <Typography.Text strong>{cycleName || cycleOption?.label || "—"}</Typography.Text>;
                    },
                  },
                ] : []),
                {
                  title: t("Status", "الحالة"),
                  dataIndex: "status",
                  width: 210,
                  render: (v: Plan["status"]) => planStatusTag(v, ar),
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
                  width: 76,
                  align: "center" as const,
                  render: (_: unknown, r: Plan) => {
                    if (mode !== "admin") {
                      return (
                        <ActionButtons
                          actions={r.allowed_actions || []}
                          ar={ar}
                          plan={r}
                          onAction={(action) => openAction(r, action)}
                        />
                      );
                    }

                    // Prefer backend permissions. The current list response exposes
                    // status but not allowed_actions; pending_admin is reviewable by Admin.
                    const actions = Array.isArray(r.allowed_actions)
                      ? workflowActions(r.allowed_actions)
                      : r.status?.key === "pending_admin"
                        ? ["approve", "return"]
                        : [];
                    const menuItems = actions.map((action) => ({
                      key: action,
                      label: resolveActionLabel(action, ar, r),
                      danger: action === "return" || action === "delete",
                    }));

                    return (
                      <div onClick={(event) => event.stopPropagation()}>
                        <Dropdown
                          trigger={["click"]}
                          placement={ar ? "bottomLeft" : "bottomRight"}
                          menu={{
                            items: menuItems,
                            onClick: ({ key }) => openAction(r, String(key)),
                          }}
                        >
                          <Button
                            type="text"
                            size="small"
                            aria-label={t("Plan actions", "إجراءات الخطة")}
                            icon={<MoreOutlined />}
                            disabled={!menuItems.length}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    );
                  },
                },
              ]}
            />
          )}
        </Card>

        <PlanActionModal
          open={dialogOpen}
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
