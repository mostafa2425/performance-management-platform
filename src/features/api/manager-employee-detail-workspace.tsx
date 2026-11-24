"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { DownloadOutlined } from "@ant-design/icons";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  cyclesApi,
  employeesApi,
  plansApi,
  resultsApi,
} from "@/lib/api/endpoints";
import { bilingual, planStatusTag, weightPct } from "./plans/plan-shared";
import { PlanHistoryPanel } from "./plans/plan-history-panel";
import { PlanSnapshotsPanel } from "./plans/plan-snapshots-panel";
import { PlanReadonlyTree } from "./plans/plan-readonly-tree";

type Props = {
  employeeId: string;
};

export function ManagerEmployeeDetailWorkspace({ employeeId }: Props) {
  const locale = useLocale();
  const ar = locale === "ar";
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const { message } = App.useApp();
  const [cycleId, setCycleId] = useState<number>();

  const employee = useQuery({
    queryKey: ["employees", "detail", employeeId],
    queryFn: () => employeesApi.get(employeeId),
  });
  const cycles = useQuery({
    queryKey: ["cycles"],
    queryFn: cyclesApi.mine,
  });
  const cycleOptions = useMemo(
    () =>
      (cycles.data || [])
        .filter((c: any) => c.my_roles?.manager)
        .map((c: any) => ({
          value: c.id as number,
          label: `${bilingual(c.name, ar)} · ${c.performance_year}`,
        })),
    [cycles.data, ar],
  );
  const firstCycleId = cycleOptions[0]?.value;

  useEffect(() => {
    if (firstCycleId == null) return;
    setCycleId((prev) => (prev == null ? firstCycleId : prev));
  }, [firstCycleId]);

  const planStatus = useQuery({
    queryKey: ["cycles", cycleId, "plan-status", employeeId],
    queryFn: () => cyclesApi.planStatus(cycleId!, { per_page: 100 }),
    enabled: Boolean(cycleId),
  });

  const member = useMemo(() => {
    const rows = (planStatus.data as any)?.data || [];
    return rows.find(
      (row: any) => String(row.employee?.id) === String(employeeId),
    );
  }, [planStatus.data, employeeId]);

  const planId = member?.plan_id as number | null | undefined;

  const plan = useQuery({
    queryKey: ["plans", "detail", planId],
    queryFn: () => plansApi.get(planId!),
    enabled: Boolean(planId),
  });

  const evaluation = useQuery({
    queryKey: ["plans", planId, "evaluation"],
    queryFn: () => plansApi.evaluation(planId!),
    enabled: Boolean(planId),
  });

  const results = useQuery({
    queryKey: ["results", "manager", employeeId],
    queryFn: () => resultsApi.list(),
  });

  const previousResults = useMemo(() => {
    const rows = (results.data || []) as any[];
    return rows.filter(
      (row) =>
        String(row.employee?.id) === String(employeeId) &&
        (cycleId == null || row.cycle?.id !== cycleId),
    );
  }, [results.data, employeeId, cycleId]);

  const person = employee.data as any;
  const selectedCycle = (cycles.data || []).find((c: any) => c.id === cycleId);
  const evalData = evaluation.data as any;
  const evalAvailable =
    evaluation.isSuccess && evalData && !evaluation.isError;

  return (
    <AppShell
      role="manager"
      title={t("Employee performance details", "تفاصيل أداء الموظف")}
      subtitle={t(
        "UC-010 · Review objectives, evaluation, history and previous results for a direct report.",
        "UC-010 · راجع الأهداف والتقييم والسجل والنتائج السابقة لموظف مباشر.",
      )}
      backHref="/manager/team"
    >
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <Select
                style={{ width: "100%" }}
                placeholder={t("Select cycle", "اختر الدورة")}
                options={cycleOptions}
                value={cycleId}
                onChange={setCycleId}
                loading={cycles.isLoading}
              />
            </Col>
            <Col xs={24} md={14}>
              <Space wrap>
                {planId ? (
                  <Link href={`/${locale}/manager/objectives`}>
                    <Button type="primary">
                      {t("Open team plans", "فتح خطط الفريق")}
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/${locale}/manager/objectives`}>
                    <Button type="primary">
                      {t("Prepare objectives & KPIs", "إعداد الأهداف والمؤشرات")}
                    </Button>
                  </Link>
                )}
                {member?.status?.key === "approved" ? (
                  <Link href={`/${locale}/manager/evaluation`}>
                    <Button>{t("Go to evaluation", "الانتقال للتقييم")}</Button>
                  </Link>
                ) : null}
              </Space>
            </Col>
          </Row>
        </Card>

        {employee.isLoading ? (
          <Spin />
        ) : employee.isError ? (
          <Alert type="error" showIcon title={(employee.error as Error).message} />
        ) : !person ? (
          <Empty
            description={t(
              "Employee not found or not in your team.",
              "الموظف غير موجود أو ليس ضمن فريقك.",
            )}
          />
        ) : (
          <>
            <Card>
              <Space wrap style={{ marginBottom: 12 }} size={[8, 8]}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {person.full_name || person.name}
                </Typography.Title>
                {person.code ? (
                  <Typography.Text type="secondary">#{person.code}</Typography.Text>
                ) : null}
                {planStatusTag(member?.status, ar)}
                {member?.requires_admin_attention ? (
                  <Tag color="orange">
                    {t("Requires admin attention", "يتطلب متابعة الإدارة")}
                  </Tag>
                ) : null}
              </Space>
              <Descriptions
                size="small"
                bordered
                column={{ xs: 1, md: 2 }}
                items={[
                  {
                    key: "job",
                    label: t("Job title", "المسمى الوظيفي"),
                    children: person.job_title?.name || "—",
                  },
                  {
                    key: "dept",
                    label: t("Department", "الإدارة"),
                    children: person.department?.name || "—",
                  },
                  {
                    key: "bu",
                    label: t("Business unit", "وحدة الأعمال"),
                    children: person.business_unit?.name || "—",
                  },
                  {
                    key: "cycle",
                    label: t("Performance cycle", "دورة الأداء"),
                    children: selectedCycle
                      ? `${bilingual(selectedCycle.name, ar)} · ${selectedCycle.performance_year}`
                      : "—",
                  },
                  {
                    key: "status",
                    label: t("Performance status", "حالة الأداء"),
                    children: planStatusTag(member?.display_status, ar),
                  },
                  {
                    key: "manager",
                    label: t("Current manager id", "معرف المدير الحالي"),
                    children: member?.current_manager_id ?? person.line_manager_id ?? "—",
                  },
                ]}
              />
            </Card>

            <Card>
              <Tabs
                items={[
                  {
                    key: "plan",
                    label: t("Objectives & KPIs", "الأهداف والمؤشرات"),
                    children: !cycleId ? (
                      <Empty description={t("Select a cycle.", "اختر دورة.")} />
                    ) : planStatus.isLoading || (planId && plan.isLoading) ? (
                      <Spin />
                    ) : !planId ? (
                      <Empty
                        description={t(
                          "No plan started for this employee in the selected cycle.",
                          "لا توجد خطة لهذا الموظف في الدورة المحددة.",
                        )}
                      >
                        <Link href={`/${locale}/manager/objectives`}>
                          <Button type="primary">
                            {t("Start plan", "بدء الخطة")}
                          </Button>
                        </Link>
                      </Empty>
                    ) : plan.isError ? (
                      <Alert
                        type="error"
                        showIcon
                        title={(plan.error as Error).message}
                      />
                    ) : (
                      <PlanReadonlyTree
                        ar={ar}
                        objectives={plan.data?.objectives}
                        openComments={plan.data?.open_comments}
                        contentVisible={plan.data?.content_visible !== false}
                      />
                    ),
                  },
                  {
                    key: "evaluation",
                    label: t("Evaluation results", "نتائج التقييم"),
                    children: !planId ? (
                      <Empty
                        description={t(
                          "Evaluation becomes available after a plan exists.",
                          "يصبح التقييم متاحاً بعد وجود خطة.",
                        )}
                      />
                    ) : evaluation.isLoading ? (
                      <Spin />
                    ) : evaluation.isError ? (
                      <Alert
                        type="info"
                        showIcon
                        title={t(
                          "Evaluation is not available for this stage yet.",
                          "التقييم غير متاح لهذه المرحلة بعد.",
                        )}
                        description={(evaluation.error as Error).message}
                      />
                    ) : evalAvailable ? (
                      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                        <Descriptions
                          size="small"
                          bordered
                          column={{ xs: 1, md: 3 }}
                          items={[
                            {
                              key: "obj",
                              label: t("Objectives result", "نتيجة الأهداف"),
                              children: evalData.objectives_bp == null ? "—" : (weightPct(evalData.objectives_bp).toFixed(2) + "%"),
                            },
                            {
                              key: "comp",
                              label: t("Competency result", "نتيجة الكفاءات"),
                              children: evalData.competency_bp == null ? "—" : (weightPct(evalData.competency_bp).toFixed(2) + "%"),
                            },
                            {
                              key: "overall",
                              label: t("Overall", "الإجمالي"),
                              children: evalData.overall_bp == null ? "—" : (weightPct(evalData.overall_bp).toFixed(2) + "%"),
                            },
                            {
                              key: "template",
                              label: t("Competency template version", "إصدار قالب الكفاءات"),
                              children: evalData.provenance?.template_version_id ? ("#" + evalData.provenance.template_version_id) : "—",
                            },
                          ]}
                        />
                        {(evalData.kpis || []).map((kpi: any) => (
                          <Card size="small" key={kpi.plan_kpi_id} title={kpi.name}>
                            <Descriptions
                              size="small"
                              column={{ xs: 1, sm: 2, xl: 3 }}
                              items={[
                                { key: "target", label: t("Target", "المستهدف"), children: kpi.target ?? "—" },
                                { key: "weight", label: t("Weight", "الوزن"), children: (weightPct(kpi.weight_bp).toFixed(2) + "%") },
                                { key: "actual", label: t("Actual", "الفعلي"), children: kpi.actual ?? "—" },
                                { key: "achievement", label: t("Achievement", "نسبة الإنجاز"), children: kpi.achievement_bp == null ? "—" : (weightPct(kpi.achievement_bp).toFixed(2) + "%") },
                                { key: "weighted", label: t("Weighted KPI result", "نتيجة المؤشر الموزونة"), children: kpi.weighted_bp == null ? "—" : (weightPct(kpi.weighted_bp).toFixed(2) + "%") },
                                { key: "direction", label: t("Calculation direction", "اتجاه الاحتساب"), children: kpi.direction === "lower" ? t("Lower is better", "الأقل أفضل") : t("Higher is better", "الأعلى أفضل") },
                              ]}
                            />
                            {kpi.comment ? (
                              <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
                                {t("Manager comment", "تعليق المدير")}: {kpi.comment}
                              </Typography.Paragraph>
                            ) : null}
                            {(kpi.evidence || []).length > 0 ? (
                              <Space wrap style={{ marginTop: 8 }}>
                                {(kpi.evidence || []).map((file: any) => (
                                  <Button
                                    key={file.id}
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={async () => {
                                      try {
                                        await plansApi.downloadEvidence(planId!, file.id, file.original_name || file.name || ("evidence-" + file.id));
                                      } catch (error) {
                                        message.error((error as Error).message || t("Could not download evidence", "تعذر تنزيل المرفق"));
                                      }
                                    }}
                                  >
                                    {file.original_name || file.name || t("Download evidence", "تنزيل الدليل")}
                                  </Button>
                                ))}
                              </Space>
                            ) : null}
                          </Card>
                        ))}
                        <Typography.Title level={5}>
                          {t("Competencies", "الكفاءات")}
                        </Typography.Title>
                        {(evalData.competencies || []).map((c: any) => (
                          <Card size="small" key={c.id} title={bilingual(c.name, ar)}>
                            <Typography.Text>
                              {t("Rating", "التقييم")}: {c.rating ?? "—"}
                            </Typography.Text>
                            {c.description ? (
                              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                {bilingual(c.description, ar)}
                              </Typography.Paragraph>
                            ) : null}
                          </Card>
                        ))}
                      </Space>
                    ) : (
                      <Empty
                        description={t(
                          "No evaluation data yet for this cycle.",
                          "لا توجد بيانات تقييم لهذه الدورة بعد.",
                        )}
                      />
                    ),
                  },
                  {
                    key: "history",
                    label: t("Workflow history", "سجل سير العمل"),
                    children: planId ? (
                      <PlanHistoryPanel planId={planId} ar={ar} />
                    ) : (
                      <Empty
                        description={t(
                          "Workflow history appears after a plan is created.",
                          "يظهر سجل سير العمل بعد إنشاء الخطة.",
                        )}
                      />
                    ),
                  },
                  {
                    key: "versions",
                    label: t("Plan versions", "إصدارات الخطة"),
                    children: planId ? (
                      <PlanSnapshotsPanel planId={planId} ar={ar} />
                    ) : (
                      <Empty description={t("No plan versions yet.", "لا توجد إصدارات للخطة بعد.")} />
                    ),
                  },
                  {
                    key: "previous",
                    label: t("Previous performance", "الأداء السابق"),
                    children: results.isLoading ? (
                      <Spin />
                    ) : previousResults.length === 0 ? (
                      <Empty
                        description={t(
                          "No previous published/available results.",
                          "لا توجد نتائج سابقة متاحة.",
                        )}
                      />
                    ) : (
                      <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                        {previousResults.map((row: any) => (
                          <Card
                            size="small"
                            key={row.id}
                            title={`${bilingual(row.cycle?.name, ar)} · ${row.cycle?.performance_year || "—"}`}
                            extra={<Tag>{t("Read only", "للعرض فقط")}</Tag>}
                          >
                            <Descriptions
                              size="small"
                              column={{ xs: 1, sm: 3 }}
                              items={[
                                { key: "overall", label: t("Overall", "الإجمالي"), children: `${weightPct(row.overall_bp).toFixed(2)}%` },
                                { key: "objectives", label: t("Objectives", "الأهداف"), children: `${weightPct(row.objectives_bp).toFixed(2)}%` },
                                { key: "competencies", label: t("Competencies", "الكفاءات"), children: `${weightPct(row.competency_bp).toFixed(2)}%` },
                                { key: "rating", label: t("Final rating", "التقدير النهائي"), children: bilingual(row.rating_label, ar) },
                              ]}
                            />
                            <PlanReadonlyTree ar={ar} objectives={row.objectives || []} />
                          </Card>
                        ))}
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          </>
        )}
      </Space>
    </AppShell>
  );
}
