"use client";

import { Alert, Button, Card, Col, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import type { KpiUnitsMeta, ObjectiveCategory } from "@/lib/api/types";
import { commentsForTarget, type OpenComments } from "./plans/plan-shared";

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
  openComments?: OpenComments;
  onSave: (objectives: ObjectiveDraft[]) => void;
};

function InlineComments({
  openComments,
  target,
  id,
  ar,
}: {
  openComments?: OpenComments;
  target: "plan" | "objective" | "kpi";
  id?: number | null;
  ar: boolean;
}) {
  const comments = commentsForTarget(openComments || null, target, id);
  if (!comments.length) return null;
  return (
    <Space orientation="vertical" size={6} style={{ width: "100%", marginBottom: 12 }}>
      {comments.map((comment, index) => (
        <Alert
          key={`${target}-${id}-${index}`}
          type="warning"
          showIcon
          title={ar ? "ملاحظة تحتاج معالجة" : "Comment to address"}
          description={comment.body}
        />
      ))}
    </Space>
  );
}

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
  openComments,
}: {
  objectiveIndex: number;
  kpiField: { key: number; name: number };
  measurementTypes: KpiUnitsMeta["measurement_types"];
  ar: boolean;
  t: (en: string, arabic: string) => string;
  canRemove: boolean;
  onRemove: () => void;
  openComments?: OpenComments;
}) {
  const form = Form.useFormInstance();
  const measurementType = Form.useWatch(["objectives", objectiveIndex, "kpis", kpiField.name, "measurement_type"], form);
  const kpiId = Form.useWatch(["objectives", objectiveIndex, "kpis", kpiField.name, "id"], form);
  const unitOptions =
    measurementTypes.find((item) => item.value === measurementType)?.units || measurementTypes[0]?.units || [];

  const kpiName = Form.useWatch(["objectives", objectiveIndex, "kpis", kpiField.name, "name"], form);
  const kpiWeight = Form.useWatch(["objectives", objectiveIndex, "kpis", kpiField.name, "weight_pct"], form);

  return (
    <Card
      size="small"
      type="inner"
      title={
        <Space wrap size={8}>
          <Typography.Text strong>{kpiName || t("New KPI", "مؤشر جديد")}</Typography.Text>
          <Tag color="blue">{t("Weight", "الوزن")}: {Number(kpiWeight || 0).toFixed(2)}%</Tag>
        </Space>
      }
      extra={canRemove ? (
        <Popconfirm
          title={t("Delete KPI?", "حذف مؤشر الأداء؟")}
          description={t("This KPI will be removed from this objective.", "سيتم حذف مؤشر الأداء من هذا الهدف.")}
          okText={t("Delete", "حذف")}
          cancelText={t("Keep", "إلغاء")}
          okButtonProps={{ danger: true }}
          onConfirm={onRemove}
        >
          <Button danger type="text" size="small" icon={<DeleteOutlined />}>
            {t("Delete", "حذف")}
          </Button>
        </Popconfirm>
      ) : null}
    >
      <InlineComments openComments={openComments} target="kpi" id={kpiId} ar={ar} />
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
    </Card>
  );
}

export function PlanContentEditor({
  form,
  categories,
  units,
  ar,
  loading,
  openComments,
  onSave,
}: Props) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const measurementTypes = (units as KpiUnitsMeta).measurement_types || [];
  const watchedObjectives = Form.useWatch("objectives", form) || [];
  const weightTotal = watchedObjectives.reduce(
    (sum: number, objective: ObjectiveDraft) =>
      sum + (objective?.kpis || []).reduce((kpiSum, kpi) => kpiSum + (Number(kpi?.weight_pct) || 0), 0),
    0,
  );
  const weightReady = Math.abs(weightTotal - 100) < 0.01;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => onSave(values.objectives || [])}
    >
      <InlineComments openComments={openComments} target="plan" ar={ar} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <Alert
          type={weightReady ? "success" : "warning"}
          showIcon
          style={{ flex: 1, minWidth: 240 }}
          title={`${t("Total KPI weight", "إجمالي وزن المؤشرات")}: ${weightTotal.toFixed(2)}%`}
          description={
            weightReady
              ? t("Ready for submission checks.", "جاهز لفحوصات الإرسال.")
              : t("Must equal 100% before submit.", "يجب أن يساوي 100% قبل الإرسال.")
          }
        />
        <Button type="primary" htmlType="submit" loading={loading}>
          {t("Save draft", "حفظ المسودة")}
        </Button>>
      </div>

      <Form.List name="objectives">
        {(fields, { add, remove }) => (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <Button
                type="primary"
                ghost
                icon={<PlusOutlined />}
                onClick={() => add({
                  text: "",
                  category_id: undefined,
                  kpis: [{
                    name: "",
                    measurement_type: "number_amount",
                    unit: "count",
                    direction: "higher",
                    target: null,
                    baseline: null,
                    weight_pct: 0,
                  }],
                })}
              >
                {t("Add objective", "إضافة هدف")}
              </Button>
            </div>
            {fields.map((field) => {
              const objectiveId = form.getFieldValue(["objectives", field.name, "id"]);
              const objectiveCategoryId = form.getFieldValue(["objectives", field.name, "category_id"]);
              const categoryLabel = bilingual(categories.find((item) => item.id === objectiveCategoryId)?.name, ar);
              return (
              <Card
                key={field.key}
                size="small"
                style={{ marginBottom: 16, borderRadius: 12 }}
                title={
                  <Space wrap size={8}>
                    <Typography.Text strong>{`${t("Objective", "الهدف")} ${field.name + 1}`}</Typography.Text>
                    {categoryLabel ? <Tag>{categoryLabel}</Tag> : null}
                    <Tag color="cyan">{(form.getFieldValue(["objectives", field.name, "kpis"]) || []).length} {t("KPIs", "مؤشرات")}</Tag>
                  </Space>
                }
                extra={
                  <Popconfirm
                    title={t("Delete objective?", "حذف الهدف؟")}
                    description={t("All KPIs under this objective will also be deleted.", "سيتم حذف جميع مؤشرات الأداء التابعة لهذا الهدف أيضاً.")}
                    okText={t("Delete", "حذف")}
                    cancelText={t("Keep", "إلغاء")}
                    okButtonProps={{ danger: true }}
                    onConfirm={() => remove(field.name)}
                  >
                    <Button danger type="text" icon={<DeleteOutlined />}>
                      {t("Delete objective", "حذف الهدف")}
                    </Button>
                  </Popconfirm>
                }
              >
                <InlineComments
                  openComments={openComments}
                  target="objective"
                  id={objectiveId}
                  ar={ar}
                />
                <Form.Item name={[field.name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  name={[field.name, "category_id"]}
                  label={t("Category", "التصنيف")}
                  rules={[{ required: true, message: t("Category is required", "التصنيف مطلوب") }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
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
                          openComments={openComments}
                        />
                      ))}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
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
            )})}
          </>
        )}
      </Form.List>
    </Form>
  );
}
