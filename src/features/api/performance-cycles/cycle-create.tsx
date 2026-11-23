"use client";

import { App, Button, Card, Col, Form, Input, InputNumber, Row, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { cyclesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { compareDate, stageKeys, yearBounds } from "./shared";

export function CycleCreate() {
  const t = useTranslations("PerformanceCycles");
  const locale = useLocale();
  const router = useRouter();
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const { min: yearMin, max: yearMax } = yearBounds();

  const create = useMutation({
    mutationFn: (v: any) => cyclesApi.create(v),
    onSuccess: async (created: any) => {
      message.success(t("toast.created"));
      await qc.invalidateQueries({ queryKey: queryKeys.adminCycles });
      if (created?.id) router.push(`/${locale}/admin/performance-cycles/${created.id}`);
      else router.push(`/${locale}/admin/performance-cycles`);
    },
    onError: (error: Error) => message.error(error.message),
  });

  const trimRule = (requiredMsg: string, minMsg: string) => [
    { required: true, whitespace: true, message: requiredMsg },
    { min: 3, message: minMsg },
  ];

  const stageDeadlineRules = (key: (typeof stageKeys)[number], index: number) => [
    {
      required: true,
      message: t("validation.stageRequired", { stage: t(`stages.${key}.label`) }),
    },
    {
      validator: async (_: unknown, value?: string) => {
        if (!value) return;
        const startDate = form.getFieldValue("start_date") as string | undefined;
        if (startDate && compareDate(value, startDate) < 0) {
          throw new Error(t("validation.stageAfterStart", { stage: t(`stages.${key}.label`) }));
        }
        if (index > 0) {
          const prevKey = stageKeys[index - 1];
          const prev = form.getFieldValue(prevKey) as string | undefined;
          if (prev && compareDate(value, prev) < 0) {
            throw new Error(t("validation.stageOrder", { stage: t(`stages.${key}.label`) }));
          }
        }
      },
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ performance_year: new Date().getFullYear() }}
      onValuesChange={(changed) => {
        if ("start_date" in changed || stageKeys.some((k) => k in changed)) {
          void form.validateFields([...stageKeys]).catch(() => undefined);
        }
      }}
      onFinish={(v) => {
        create.mutate({
          name: { ar: String(v.name_ar).trim(), en: String(v.name_en).trim() },
          performance_year: v.performance_year,
          start_date: v.start_date,
          stages: {
            goal_setting: v.goal_setting,
            employee_review: v.employee_review,
            active_performance: v.active_performance,
            manager_evaluation: v.manager_evaluation,
            admin_final_review: v.admin_final_review,
          },
        });
      }}
    >
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <Card
          title={t("sections.cycleInfo")}
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {t("sections.cycleInfoHint")}
            </Typography.Text>
          }
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="name_en" label={t("fields.nameEn")} rules={trimRule(t("validation.nameEnRequired"), t("validation.nameEnMin"))}>
                <Input placeholder={t("placeholders.nameEn")} maxLength={120} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="name_ar" label={t("fields.nameAr")} rules={trimRule(t("validation.nameArRequired"), t("validation.nameArMin"))}>
                <Input dir="rtl" placeholder={t("placeholders.nameAr")} maxLength={120} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="performance_year"
                label={t("fields.performanceYear")}
                rules={[
                  { required: true, message: t("validation.yearRequired") },
                  { type: "integer", message: t("validation.yearInteger") },
                  {
                    type: "number",
                    min: yearMin,
                    max: yearMax,
                    message: t("validation.yearRange", { min: yearMin, max: yearMax }),
                  },
                ]}
              >
                <InputNumber
                  min={yearMin}
                  max={yearMax}
                  style={{ width: "100%" }}
                  placeholder={t("placeholders.performanceYear")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="start_date"
                label={t("fields.startDate")}
                rules={[{ required: true, message: t("validation.startDateRequired") }]}
              >
                <FormDatePicker placeholder={t("placeholders.startDate")} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title={t("sections.stageDeadlines")}
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {t("sections.stageDeadlinesHint")}
            </Typography.Text>
          }
        >
          <Row gutter={[16, 0]}>
            {stageKeys.map((key, i) => (
              <Col xs={24} md={12} key={key}>
                <Form.Item
                  name={key}
                  label={`${t(`stages.${key}.label`)} — ${t("fields.deadline")}`}
                  tooltip={t(`stages.${key}.hint`)}
                  dependencies={["start_date", ...stageKeys.slice(0, i)]}
                  rules={stageDeadlineRules(key, i)}
                >
                  <FormDatePicker placeholder={t("placeholders.stageDeadline")} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        <Space wrap>
          <Button type="primary" htmlType="submit" loading={create.isPending}>
            {t("actions.createDraft")}
          </Button>
          <Link href={`/${locale}/admin/performance-cycles`}>
            <Button>{t("actions.cancel")}</Button>
          </Link>
        </Space>
      </Space>
    </Form>
  );
}
