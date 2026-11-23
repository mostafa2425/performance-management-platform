"use client";

import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography } from "antd";
import type { FormInstance } from "antd";
import type { KpiUnitsMeta, ObjectiveCategory } from "@/lib/api/types";

type ObjectiveDraft = {
  id?: number;
  category_id?: number;
  text: string;
  kpis: Array<{
    id?: number;
    name: string;
    measurement_type: string;
    unit: string;
    direction: "higher" | "lower";
    target: number | null;
    baseline?: number | null;
    weight_pct: number;
  }>;
};

type Props = {
  form: FormInstance<{ objectives: ObjectiveDraft[] }>;
  categories: ObjectiveCategory[];
  units: KpiUnitsMeta | Record<string, never>;
  ar: boolean;
  loading?: boolean;
  onSave: (objectives: ObjectiveDraft[]) => void;
};

function bilingual(value: { ar?: string; en?: string } | string | undefined, ar: boolean) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return ar ? value.ar || value.en || "" : value.en || value.ar || "";
}

function KpiFields({
  objectiveIndex,
  kpiField,
  measurementTypes,
  ar,
  t,
  canRemove,
  onRemove,
}: {
  objectiveIndex: number;
  kpiField: { key: number; name: number };
  measurementTypes: KpiUnitsMeta["measurement_types"];
  ar: boolean;
  t: (en: string, arabic: string) => string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const form = Form.useFormInstance();
  const measurementType = Form.useWatch(["objectives", objectiveIndex, "kpis", kpiField.name, "measurement_type"], form);
  const unitOptions =
    measurementTypes.find((item) => item.value === measurementType)?.units || measurementTypes[0]?.units || [];

  return (
    <Card size="small" type="inner" title={t("KPI", "مؤشر أداء")}>
      <Form.Item name={[kpiField.name, "id"]} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={[kpiField.name, "name"]} label={t("KPI name", "اسم المؤشر")} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "measurement_type"]} label={t("Type", "النوع")} rules={[{ required: true }]}>
            <Select
              options={measurementTypes.map((item) => ({
                value: item.value,
                label: bilingual(item.label, ar),
              }))}
              onChange={(value) => {
                const firstUnit = measurementTypes.find((item) => item.value === value)?.units?.[0]?.value;
                form.setFieldValue(["objectives", objectiveIndex, "kpis", kpiField.name, "unit"], firstUnit);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "unit"]} label={t("Unit", "الوحدة")} rules={[{ required: true }]}>
            <Select
              options={unitOptions.map((item) => ({
                value: item.value,
                label: bilingual(item.label, ar),
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "direction"]} label={t("Direction", "الاتجاه")} rules={[{ required: true }]}>
            <Select
              options={[
                { value: "higher", label: t("Higher is better", "الأعلى أفضل") },
                { value: "lower", label: t("Lower is better", "الأقل أفضل") },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "target"]} label={t("Target", "المستهدف")} rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "baseline"]} label={t("Baseline", "خط الأساس")}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "weight_pct"]} label={t("Weight %", "الوزن %")} rules={[{ required: true }]}>
            <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      {canRemove && (
        <Button danger type="link" onClick={onRemove}>
          {t("Remove KPI", "حذف المؤشر")}
        </Button>
      )}
    </Card>
  );
}

export function PlanContentEditor({ form, categories, units, ar, loading, onSave }: Props) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const measurementTypes = (units as KpiUnitsMeta).measurement_types || [];
  const watchedObjectives = Form.useWatch("objectives", form) || [];
  const weightTotal = watchedObjectives.reduce(
    (sum: number, objective: ObjectiveDraft) =>
      sum + (objective?.kpis || []).reduce((kpiSum, kpi) => kpiSum + (Number(kpi?.weight_pct) || 0), 0),
    0,
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => onSave(values.objectives || [])}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <Typography.Text type={Math.abs(weightTotal - 100) < 0.01 ? "success" : "warning"}>
          {t("Total KPI weight", "إجمالي وزن المؤشرات")}: {weightTotal.toFixed(2)}%
        </Typography.Text>
        <Space>
          <Button
            onClick={() => {
              const current = form.getFieldValue("objectives") || [];
              form.setFieldsValue({
                objectives: [
                  ...current,
                  {
                    text: "",
                    category_id: undefined,
                    kpis: [
                      {
                        name: "",
                        measurement_type: "number_amount",
                        unit: "count",
                        direction: "higher",
                        target: null,
                        baseline: null,
                        weight_pct: 0,
                      },
                    ],
                  },
                ],
              });
            }}
          >
            {t("Add objective", "إضافة هدف")}
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t("Save plan", "حفظ الخطة")}
          </Button>
        </Space>
      </div>

      <Form.List name="objectives">
        {(fields, { remove }) => (
          <>
            {fields.map((field) => (
              <Card
                key={field.key}
                size="small"
                style={{ marginBottom: 12 }}
                title={`${t("Objective", "الهدف")} ${field.name + 1}`}
                extra={
                  <Button danger type="link" onClick={() => remove(field.name)}>
                    {t("Remove", "حذف")}
                  </Button>
                }
              >
                <Form.Item name={[field.name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  name={[field.name, "category_id"]}
                  label={t("Category", "التصنيف")}
                  rules={[{ required: true, message: t("Category is required", "التصنيف مطلوب") }]}
                >
                  <Select
                    options={categories.map((category) => ({
                      value: category.id,
                      label: bilingual(category.name, ar),
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name={[field.name, "text"]}
                  label={t("Objective text", "نص الهدف")}
                  rules={[{ required: true, message: t("Objective text is required", "نص الهدف مطلوب") }]}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.List name={[field.name, "kpis"]}>
                  {(kpiFields, kpiOps) => (
                    <Space orientation="vertical" style={{ width: "100%" }} size={8}>
                      {kpiFields.map((kpiField) => (
                        <KpiFields
                          key={kpiField.key}
                          objectiveIndex={field.name}
                          kpiField={kpiField}
                          measurementTypes={measurementTypes}
                          ar={ar}
                          t={t}
                          canRemove={kpiFields.length > 1}
                          onRemove={() => kpiOps.remove(kpiField.name)}
                        />
                      ))}
                      <Button
                        type="dashed"
                        onClick={() =>
                          kpiOps.add({
                            name: "",
                            measurement_type: "number_amount",
                            unit: "count",
                            direction: "higher",
                            target: null,
                            baseline: null,
                            weight_pct: 0,
                          })
                        }
                      >
                        {t("Add KPI", "إضافة مؤشر")}
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Card>
            ))}
          </>
        )}
      </Form.List>
    </Form>
  );
}
