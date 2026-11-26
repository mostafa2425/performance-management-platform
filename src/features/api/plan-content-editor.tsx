"use client";

import { Alert, Button, Card, Col, Collapse, Form, Input, InputNumber, Modal, Popconfirm, Progress, Row, Select, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
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
  initialObjectives: ObjectiveDraft[];
  categories: ObjectiveCategory[];
  units: KpiUnitsMeta | Record<string, never>;
  ar: boolean;
  loading?: boolean;
  openComments?: OpenComments;
  onSave: (objectives: ObjectiveDraft[]) => void;
  addObjectiveRequest?: number;
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
          <Tag color="blue">{t("Weight", "الوزن")}: {Number(kpiWeight || 0).toLocaleString(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 0 })}%</Tag>
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
        <Input placeholder={t("Enter KPI name", "أدخل اسم المؤشر")} />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "measurement_type"]} label={t("Type", "النوع")} rules={[{ required: true }]}>
            <Select
              placeholder={t("Select measurement type", "اختر نوع القياس")}
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
              placeholder={t("Select unit", "اختر الوحدة")}
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
              placeholder={t("Select direction", "اختر الاتجاه")}
              options={[
                { value: "higher", label: t("Higher is better", "الأعلى أفضل") },
                { value: "lower", label: t("Lower is better", "الأقل أفضل") },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "target"]} label={t("Target", "المستهدف")} rules={[{ required: true }]}>
            <InputNumber placeholder={t("Enter target", "أدخل المستهدف")} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "baseline"]} label={t("Baseline", "خط الأساس")}>
            <InputNumber placeholder={t("Enter baseline (optional)", "أدخل خط الأساس (اختياري)")} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[kpiField.name, "weight_pct"]} label={t("Weight %", "الوزن %")} rules={[{ required: true }]}>
            <InputNumber min={0} max={100} step={1} precision={0} placeholder={t("Enter whole number", "أدخل رقمًا صحيحًا")} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}

export function PlanContentEditor({
  initialObjectives,
  categories,
  units,
  ar,
  loading,
  openComments,
  onSave,
  addObjectiveRequest = 0,
}: Props) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [form] = Form.useForm<{ objectives: ObjectiveDraft[] }>();
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [activeObjectiveKeys, setActiveObjectiveKeys] = useState<string[]>([]);
  const [objectiveForm] = Form.useForm();
  const addObjectiveRef = useRef<((value: ObjectiveDraft) => void) | null>(null);
  const measurementTypes = (units as KpiUnitsMeta).measurement_types || [];
  const watchedObjectives = Form.useWatch("objectives", form) || [];
  const weightTotal = watchedObjectives.reduce(
    (sum: number, objective: ObjectiveDraft) =>
      sum + (objective?.kpis || []).reduce((kpiSum, kpi) => kpiSum + (Number(kpi?.weight_pct) || 0), 0),
    0,
  );
  const weightReady = Math.abs(weightTotal - 100) < 0.01;

  const openObjectiveModal = useCallback(() => {
    objectiveForm.resetFields();
    objectiveForm.setFieldsValue({
      text: "",
      category_id: undefined,
      kpis: [{ name: "", measurement_type: "number_amount", unit: measurementTypes.find((item) => item.value === "number_amount")?.units?.[0]?.value || "count", direction: "higher", target: null, baseline: null, weight_pct: 0 }],
    });
    setObjectiveModalOpen(true);
  }, [measurementTypes, objectiveForm]);

  useEffect(() => {
    if (addObjectiveRequest > 0) openObjectiveModal();
  }, [addObjectiveRequest, openObjectiveModal]);

  return (
    <Form
      id="plan-content-editor-form"
      form={form}
      layout="vertical"
      initialValues={{ objectives: initialObjectives }}
      onFinish={(values) => onSave(values.objectives || [])}
    >
      <InlineComments openComments={openComments} target="plan" ar={ar} />
      <div className="plan-content-editor-toolbar">
        <div className="plan-content-editor-weight-progress">
          <div className="plan-content-editor-weight-heading">
            <Typography.Text strong>{t("Total KPI weight", "إجمالي وزن المؤشرات")}</Typography.Text>
            <Typography.Text strong className={weightReady ? "is-complete" : weightTotal > 100 ? "is-overweight" : "is-incomplete"}>
              {Math.round(weightTotal)}%
            </Typography.Text>
          </div>
          <Progress
            percent={Math.min(100, Math.max(0, weightTotal))}
            showInfo={false}
            strokeColor={weightReady ? "#16a34a" : weightTotal > 100 ? "#dc2626" : weightTotal >= 70 ? "#d97706" : "#3b82f6"}
            railColor="#e8edf4"
            size={{ height: 9 }}
          />
          <Typography.Text type="secondary" className="plan-content-editor-weight-hint">
            {weightReady
              ? t("Weight distribution is complete.", "توزيع الأوزان مكتمل.")
              : weightTotal > 100
                ? t("Total weight exceeds 100%. Reduce the KPI weights.", "إجمالي الأوزان تجاوز 100%. قلل أوزان المؤشرات.")
                : t("Adjust KPI weights until the total reaches 100%.", "اضبط أوزان المؤشرات حتى يصل الإجمالي إلى 100%.")}
          </Typography.Text>
        </div>
        <Space className="plan-content-editor-actions" wrap>
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={openObjectiveModal}>
            {t("Add objective", "إضافة هدف")}
          </Button>
        </Space>
      </div>

      <Form.List name="objectives">
        {(fields, { add, remove }) => {
          addObjectiveRef.current = add;
          return (
            <>
              {fields.length ? (
                <Collapse
                  bordered={false}
                  activeKey={activeObjectiveKeys}
                  onChange={(keys) => setActiveObjectiveKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])}
                  items={fields.map((field) => {
                    const objectiveId = form.getFieldValue(["objectives", field.name, "id"]);
                    const objectiveCategoryId = form.getFieldValue(["objectives", field.name, "category_id"]);
                    const categoryLabel = bilingual(categories.find((item) => item.id === objectiveCategoryId)?.name, ar);
                    const kpiCount = (form.getFieldValue(["objectives", field.name, "kpis"]) || []).length;
                    return {
                      key: String(field.key),
                      label: (
                        <Space wrap size={8}>
                          <Typography.Text strong>{`${t("Objective", "الهدف")} ${field.name + 1}`}</Typography.Text>
                          {categoryLabel ? <Tag>{categoryLabel}</Tag> : null}
                          <Tag color="cyan">{kpiCount} {t("KPIs", "مؤشرات")}</Tag>
                        </Space>
                      ),
                      extra: (
                        <Popconfirm
                          title={t("Delete objective?", "حذف الهدف؟")}
                          description={t("All KPIs under this objective will also be deleted.", "سيتم حذف جميع مؤشرات الأداء التابعة لهذا الهدف أيضاً.")}
                          okText={t("Delete", "حذف")}
                          cancelText={t("Keep", "إلغاء")}
                          okButtonProps={{ danger: true }}
                          onConfirm={() => remove(field.name)}
                        >
                          <Button danger type="text" size="small" icon={<DeleteOutlined />}>
                            {t("Delete", "حذف")}
                          </Button>
                        </Popconfirm>
                      ),
                      children: (
                        <div style={{ padding: "4px 2px 8px" }}>
                          <InlineComments openComments={openComments} target="objective" id={objectiveId} ar={ar} />
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
                              placeholder={t("Select objective category", "اختر تصنيف الهدف")}
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
                            <Input.TextArea rows={2} placeholder={t("Describe the objective", "اكتب وصف الهدف")} />
                          </Form.Item>
                          <Form.List name={[field.name, "kpis"]}>
                            {(kpiFields, kpiOps) => (
                              <Space orientation="vertical" style={{ width: "100%" }} size={8}>
                                <Collapse
                                  bordered={false}
                                  defaultActiveKey={kpiFields.map((item) => String(item.key))}
                                  items={kpiFields.map((kpiField, kpiIndex) => ({
                                    key: String(kpiField.key),
                                    label: t("KPI", "مؤشر الأداء") + " " + (kpiIndex + 1),
                                    children: (
                                      <KpiFields
                                        objectiveIndex={field.name}
                                        kpiField={kpiField}
                                        measurementTypes={measurementTypes}
                                        ar={ar}
                                        t={t}
                                        canRemove={kpiFields.length > 1}
                                        onRemove={() => kpiOps.remove(kpiField.name)}
                                        openComments={openComments}
                                      />
                                    ),
                                  }))}
                                />
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
                        </div>
                      ),
                    };
                  })}
                />
              ) : (
                <Card size="small" style={{ textAlign: "center", color: "rgba(0,0,0,.45)" }}>
                  {t("No objectives added yet. Use Add objective to get started.", "لم تتم إضافة أهداف بعد. اضغط على إضافة هدف للبدء.")}
                </Card>
              )}
            </>
          );
        }}
      </Form.List>
      <Modal
        open={objectiveModalOpen}
        title={t("Add objective", "إضافة هدف")}
        width={820}
        onCancel={() => setObjectiveModalOpen(false)}
        onOk={() => objectiveForm.submit()}
        okText={t("Add objective", "إضافة الهدف")}
        cancelText={t("Cancel", "إلغاء")}
        destroyOnHidden
      >
        <Form
          form={objectiveForm}
          layout="vertical"
          onFinish={(values) => {
            addObjectiveRef.current?.(values);
            setActiveObjectiveKeys([]);
            setObjectiveModalOpen(false);
            objectiveForm.resetFields();
          }}
        >
          <Form.Item name="category_id" label={t("Category", "التصنيف")} rules={[{ required: true }]}>
            <Select showSearch placeholder={t("Select objective category", "اختر تصنيف الهدف")} optionFilterProp="label" options={categories.map((category) => ({ value: category.id, label: bilingual(category.name, ar) }))} />
          </Form.Item>
          <Form.Item name="text" label={t("Objective text", "نص الهدف")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder={t("Describe the objective", "اكتب وصف الهدف")} />
          </Form.Item>
          <Form.List name="kpis">
            {(kpiFields, { add: addKpi, remove: removeKpi }) => (
              <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                {kpiFields.map((field, index) => (
                  <Card key={field.key} size="small" title={t("KPI", "مؤشر الأداء") + " " + (index + 1)}
                    extra={kpiFields.length > 1 ? (
                      <Popconfirm title={t("Delete KPI?", "حذف المؤشر؟")} okText={t("Delete", "حذف")} cancelText={t("Cancel", "إلغاء")} okButtonProps={{ danger: true }} onConfirm={() => removeKpi(field.name)}>
                        <Button danger type="text" icon={<DeleteOutlined />}>{t("Delete", "حذف")}</Button>
                      </Popconfirm>
                    ) : null}>
                    <Form.Item name={[field.name, "name"]} label={t("KPI name", "اسم المؤشر")} rules={[{ required: true }]}><Input placeholder={t("Enter KPI name", "أدخل اسم المؤشر")} /></Form.Item>
                    <Row gutter={[12, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item name={[field.name, "measurement_type"]} label={t("Type", "النوع")} rules={[{ required: true }]}>
                          <Select
                            placeholder={t("Select measurement type", "اختر نوع القياس")}
                            options={measurementTypes.map((item) => ({ value: item.value, label: bilingual(item.label, ar) }))}
                            onChange={(value) => objectiveForm.setFieldValue(["kpis", field.name, "unit"], measurementTypes.find((item) => item.value === value)?.units?.[0]?.value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item noStyle shouldUpdate={(previous, current) => previous.kpis?.[field.name]?.measurement_type !== current.kpis?.[field.name]?.measurement_type}>
                          {() => {
                            const selectedType = objectiveForm.getFieldValue(["kpis", field.name, "measurement_type"]);
                            const unitOptions = measurementTypes.find((item) => item.value === selectedType)?.units || [];
                            return (
                              <Form.Item name={[field.name, "unit"]} label={t("Unit", "الوحدة")} rules={[{ required: true }]}>
                                <Select placeholder={t("Select unit", "اختر الوحدة")} options={unitOptions.map((item) => ({ value: item.value, label: bilingual(item.label, ar) }))} />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={[field.name, "direction"]} label={t("Direction", "الاتجاه")} rules={[{ required: true }]}>
                          <Select placeholder={t("Select direction", "اختر الاتجاه")} options={[{ value: "higher", label: t("Higher is better", "الأعلى أفضل") }, { value: "lower", label: t("Lower is better", "الأقل أفضل") }]} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}><Form.Item name={[field.name, "target"]} label={t("Target", "المستهدف")} rules={[{ required: true }]}><InputNumber placeholder={t("Enter target", "أدخل المستهدف")} style={{ width: "100%" }} /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={[field.name, "baseline"]} label={t("Baseline", "خط الأساس")}><InputNumber placeholder={t("Enter baseline (optional)", "أدخل خط الأساس (اختياري)")} style={{ width: "100%" }} /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={[field.name, "weight_pct"]} label={t("Weight %", "الوزن %")} rules={[{ required: true }]}><InputNumber min={0} max={100} step={1} precision={0} placeholder={t("Enter whole number", "أدخل رقمًا صحيحًا")} style={{ width: "100%" }} /></Form.Item></Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => addKpi({ name: "", measurement_type: "number_amount", unit: measurementTypes.find((item) => item.value === "number_amount")?.units?.[0]?.value || "count", direction: "higher", target: null, baseline: null, weight_pct: 0 })}>
                  {t("Add KPI", "إضافة مؤشر")}
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Form>
  );
}
