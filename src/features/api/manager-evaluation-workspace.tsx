"use client";

import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  SaveOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { plansApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import "./manager-evaluation-workspace.css";

export default function ApiManagerEvaluationWorkspace() {
  const ar = useLocale() === "ar";
  const locale = ar ? "ar" : "en";
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [planId, setPlanId] = useState<number>();
  const [form] = Form.useForm();

  const plans = useQuery({
    queryKey: [...queryKeys.plans, "manager-evaluation"],
    queryFn: () => plansApi.list({ filter: { status: "approved" }, per_page: 100 }),
  });
  const evaluation = useQuery({
    queryKey: ["plans", planId, "evaluation"],
    queryFn: () => plansApi.evaluation(planId!),
    enabled: Boolean(planId),
  });
  const save = useMutation({
    mutationFn: (body: any) => plansApi.saveEvaluation(planId!, body),
    onSuccess: async () => {
      message.success(ar ? "تم حفظ التقييم" : "Evaluation saved");
      await qc.invalidateQueries({ queryKey: ["plans", planId, "evaluation"] });
    },
  });

  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const rows = (plans.data as any)?.data || [];
  const ev = evaluation.data as any;
  const selectedPlan = rows.find((plan: any) => plan.id === planId);
  const employeeName =
    selectedPlan?.employee?.name || selectedPlan?.employee?.full_name || t("Selected employee", "الموظف المحدد");
  const initial = () => ({
    kpis: ev?.kpis?.map((kpi: any) => ({
      plan_kpi_id: kpi.plan_kpi_id,
      actual: kpi.actual === null ? null : Number(kpi.actual),
      comment: kpi.comment || "",
    })),
    competencies: ev?.competencies?.map((competency: any) => ({
      competency_id: competency.id,
      rating: competency.rating,
    })),
  });

  return (
    <AppShell
      role="manager"
      title={t("Manager evaluation", "تقييم المدير")}
      subtitle={t(
        "Record actual results and annual competency ratings using the approved plan.",
        "سجّل النتائج الفعلية وتقييمات الكفاءات السنوية بناءً على الخطة المعتمدة.",
      )}
    >
      <div className="manager-evaluation-workspace">
        <Card className="evaluation-plan-picker" bordered>
          <div className="evaluation-picker-copy">
            <span className="evaluation-eyebrow">{t("Evaluation workspace", "مساحة التقييم")}</span>
            <Typography.Title level={5}>{t("Choose an employee plan", "اختر خطة الموظف")}</Typography.Title>
            <Typography.Text type="secondary">
              {t(
                "Only approved plans available to your team are listed.",
                "تظهر هنا الخطط المعتمدة والمتاحة لفريقك فقط.",
              )}
            </Typography.Text>
          </div>
          <div className="evaluation-picker-control">
            <Typography.Text strong>{t("Approved plan", "الخطة المعتمدة")}</Typography.Text>
            {plans.isLoading ? (
              <Skeleton.Input active block className="evaluation-plan-select-skeleton" />
            ) : (
              <Select
                showSearch
                optionFilterProp="label"
                className="evaluation-plan-select"
                placeholder={t("Select an approved plan to evaluate", "اختر خطة معتمدة لتقييمها")}
                value={planId}
                onChange={setPlanId}
                options={rows.map((plan: any) => ({
                  value: plan.id,
                  label: `${plan.employee?.name || plan.employee?.full_name || plan.id} · ${plan.display_status} · #${plan.id}`,
                }))}
              />
            )}
          </div>
          {plans.isError ? <Alert type="error" showIcon title={(plans.error as Error).message} /> : null}
        </Card>

        {!planId && !plans.isLoading ? (
          <Card className="evaluation-empty-state">
            <Empty
              image={<FileTextOutlined />}
              description={t(
                rows.length
                  ? "Select an approved plan to start the evaluation."
                  : "No approved plans are available for evaluation.",
                rows.length
                  ? "اختر خطة معتمدة لبدء التقييم."
                  : "لا توجد خطط معتمدة متاحة للتقييم.",
              )}
            />
          </Card>
        ) : null}

        {planId && evaluation.isLoading ? (
          <Card className="evaluation-loading"><Skeleton active title={{ width: "38%" }} paragraph={{ rows: 4, width: ["100%", "92%", "76%", "48%"] }} /></Card>
        ) : null}

        {planId && evaluation.isError ? (
          <Alert
            type="error"
            showIcon
            title={(evaluation.error as Error).message}
            action={<Button onClick={() => evaluation.refetch()}>{t("Retry", "إعادة المحاولة")}</Button>}
          />
        ) : null}

        {planId && ev ? (
          <>
            <Card
              className="evaluation-employee-card"
              title={
                <Space size={10}>
                  <span className="evaluation-employee-avatar"><UserOutlined /></span>
                  <span>
                    <Typography.Text strong>{employeeName}</Typography.Text>
                    <Typography.Text type="secondary" className="evaluation-employee-subtitle">
                      {t("Employee evaluation", "تقييم الموظف")} · #{planId}
                    </Typography.Text>
                  </span>
                </Space>
              }
              extra={<Tag color="blue">{t("Version", "الإصدار")} {ev.version}</Tag>}
            >
              <Row gutter={[12, 12]} className="evaluation-summary">
                <Col xs={12} md={8}>
                  <div className="evaluation-summary-tile">
                    <Statistic title={t("KPIs", "مؤشرات الأداء")} value={(ev.kpis || []).length} />
                  </div>
                </Col>
                <Col xs={12} md={8}>
                  <div className="evaluation-summary-tile">
                    <Statistic title={t("Competencies", "الكفاءات")} value={(ev.competencies || []).length} />
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="evaluation-summary-tile evaluation-summary-status">
                    <span>{t("Evaluation status", "حالة التقييم")}</span>
                    <Tag color={ev.is_complete ? "success" : ev.editable ? "processing" : "default"}>
                      {ev.is_complete
                        ? t("Completed", "مكتمل")
                        : ev.editable
                          ? t("In progress", "قيد التنفيذ")
                          : t("Read only", "للقراءة فقط")}
                    </Tag>
                  </div>
                </Col>
              </Row>

              {!ev.evaluable ? (
                <Alert
                  className="evaluation-notice"
                  type="warning"
                  showIcon
                  title={t("This member is not evaluable.", "لا يمكن تقييم هذا الموظف حالياً.")}
                />
              ) : null}
              {!ev.editable ? (
                <Alert
                  className="evaluation-notice"
                  type="info"
                  showIcon
                  title={t(
                    "Evaluation is read-only in the current workflow state.",
                    "التقييم للقراءة فقط في حالة سير العمل الحالية.",
                  )}
                />
              ) : null}

              <Form
                form={form}
                key={`${planId}-${ev.version}`}
                layout="vertical"
                initialValues={initial()}
                onFinish={(values) =>
                  save.mutate({
                    version: ev.version,
                    kpis: values.kpis,
                    competencies: values.competencies,
                  })
                }
              >
                <section className="evaluation-section">
                  <div className="evaluation-section-heading">
                    <div>
                      <Typography.Title level={5}>{t("KPI actuals", "القيم الفعلية لمؤشرات الأداء")}</Typography.Title>
                      <Typography.Text type="secondary">
                        {t("Enter actual results and attach supporting evidence.", "أدخل النتائج الفعلية وأرفق الأدلة الداعمة.")}
                      </Typography.Text>
                    </div>
                    <Tag>{(ev.kpis || []).length} {t("indicators", "مؤشرات")}</Tag>
                  </div>

                  {(ev.kpis || []).length ? (
                    <div className="evaluation-kpi-list">
                      {ev.kpis.map((kpi: any, index: number) => (
                        <Card size="small" className="evaluation-kpi-card" key={kpi.plan_kpi_id}>
                          <div className="evaluation-kpi-heading">
                            <div>
                              <Typography.Text strong>{kpi.name}</Typography.Text>
                              <Typography.Text type="secondary">
                                {t("KPI", "مؤشر الأداء")} {index + 1}
                              </Typography.Text>
                            </div>
                            <div className="evaluation-kpi-meta">
                              <span><small>{t("Target", "المستهدف")}</small><strong>{kpi.target ?? "—"}</strong></span>
                              <span><small>{t("Weight", "الوزن")}</small><strong>{(kpi.weight_bp / 100).toFixed(2)}%</strong></span>
                            </div>
                          </div>
                          <Form.Item name={["kpis", index, "plan_kpi_id"]} hidden initialValue={kpi.plan_kpi_id}>
                            <Input />
                          </Form.Item>
                          <Row gutter={[16, 0]}>
                            <Col xs={24} md={10}>
                              <Form.Item
                                name={["kpis", index, "actual"]}
                                label={t("Actual value", "القيمة الفعلية")}
                              >
                                <InputNumber
                                  className="evaluation-full-control"
                                  stringMode
                                  disabled={!ev.editable}
                                  placeholder={t("Enter actual value", "أدخل القيمة الفعلية")}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={14}>
                              <Form.Item
                                name={["kpis", index, "comment"]}
                                label={t("Manager comment", "تعليق المدير")}
                              >
                                <Input.TextArea
                                  rows={2}
                                  disabled={!ev.editable}
                                  placeholder={t("Add a comment (optional)", "أضف تعليقاً (اختياري)")}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          {(kpi.evidence || []).length || ev.editable ? (
                            <div className="evaluation-evidence">
                              <Typography.Text type="secondary">{t("Supporting evidence", "الأدلة الداعمة")}</Typography.Text>
                              <Space wrap>
                                {(kpi.evidence || []).map((file: any) => (
                                  <Button
                                    key={file.id}
                                    size="small"
                                    icon={<FileTextOutlined />}
                                    onClick={() => plansApi.downloadEvidence(planId, file.id, file.original_name)}
                                  >
                                    {t("Download", "تحميل")}: {file.original_name}
                                  </Button>
                                ))}
                                <Upload
                                  showUploadList={false}
                                  disabled={!ev.editable}
                                  beforeUpload={async (file) => {
                                    try {
                                      await plansApi.uploadEvidence(planId, kpi.plan_kpi_id, file as File);
                                      message.success(ar ? "تم رفع الدليل" : "Evidence uploaded");
                                      await qc.invalidateQueries({ queryKey: ["plans", planId, "evaluation"] });
                                    } catch (error) {
                                      message.error((error as Error).message);
                                    }
                                    return Upload.LIST_IGNORE;
                                  }}
                                >
                                  <Button size="small" disabled={!ev.editable} icon={<UploadOutlined />}>
                                    {t("Upload evidence", "رفع دليل")}
                                  </Button>
                                </Upload>
                              </Space>
                            </div>
                          ) : null}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description={t("No KPIs are assigned to this plan.", "لا توجد مؤشرات أداء مرتبطة بهذه الخطة.")} />
                  )}
                </section>

                <section className="evaluation-section">
                  <div className="evaluation-section-heading">
                    <div>
                      <Typography.Title level={5}>{t("Annual competencies", "الكفاءات السنوية")}</Typography.Title>
                      <Typography.Text type="secondary">
                        {t("Rate each competency using the available scale.", "قيّم كل كفاءة باستخدام مقياس التقييم المتاح.")}
                      </Typography.Text>
                    </div>
                    <Tag>{(ev.competencies || []).length} {t("competencies", "كفاءات")}</Tag>
                  </div>
                  <Row gutter={[12, 4]}>
                    {(ev.competencies || []).map((competency: any, index: number) => (
                      <Col xs={24} md={12} key={competency.id}>
                        <Card size="small" className="evaluation-competency-card">
                          <Form.Item name={["competencies", index, "competency_id"]} hidden initialValue={competency.id}>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={["competencies", index, "rating"]}
                            label={typeof competency.name === "object"
                              ? (ar ? competency.name.ar : competency.name.en)
                              : competency.name}
                            rules={[{ required: true }]}
                            className="evaluation-rating-item"
                          >
                            <Select
                              disabled={!ev.editable}
                              placeholder={t("Select rating", "اختر التقييم")}
                              options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }))}
                            />
                          </Form.Item>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </section>

                {ev.is_complete ? (
                  <Alert
                    className="evaluation-result"
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    title={
                      <Space wrap>
                        <strong>{t("Overall score", "النتيجة الإجمالية")}: {((ev.overall_bp || 0) / 100).toFixed(2)}%</strong>
                        <Tag color="success">{ev.rating?.label?.[locale] || ""}</Tag>
                      </Space>
                    }
                  />
                ) : null}

                <div className="evaluation-form-actions">
                  <Typography.Text type="secondary">
                    {ev.editable
                      ? t("Your changes are saved when you submit this evaluation.", "سيتم حفظ التغييرات عند إرسال التقييم.")
                      : t("This evaluation cannot be edited at this stage.", "لا يمكن تعديل هذا التقييم في هذه المرحلة.")}
                  </Typography.Text>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={save.isPending}
                    disabled={!ev.editable || !ev.evaluable}
                  >
                    {t("Save evaluation", "حفظ التقييم")}
                  </Button>
                </div>
              </Form>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
