"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Input, Modal, Select, Space, Typography } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { resolveActionLabel } from "./plan-shared";

type CommentDraft = {
  target: "objective" | "kpi";
  id: number;
  body: string;
};

type Props = {
  open: boolean;
  action: string;
  ar: boolean;
  loading?: boolean;
  plan?: any;
  onCancel: () => void;
  onConfirm: (payload: {
    comment?: string;
    reason?: string;
    comments?: Array<{ target: string; id: number; body: string }>;
  }) => void;
};

export function PlanActionModal(props: Props) {
  return <PlanActionModalContent key={`${props.open}-${props.action}-${props.plan?.id ?? "none"}`} {...props} />;
}

function PlanActionModalContent({
  open,
  action,
  ar,
  loading,
  plan,
  onCancel,
  onConfirm,
}: Props) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [comment, setComment] = useState("");
  const [itemComments, setItemComments] = useState<CommentDraft[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>();
  const [itemBody, setItemBody] = useState("");


  const targetOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    for (const objective of plan?.objectives || []) {
      if (objective?.id != null) {
        options.push({
          value: `objective:${objective.id}`,
          label: `${t("Objective", "هدف")}: ${objective.text || `#${objective.id}`}`,
        });
      }
      for (const kpi of objective?.kpis || []) {
        if (kpi?.id != null) {
          options.push({
            value: `kpi:${kpi.id}`,
            label: `${t("KPI", "مؤشر")}: ${kpi.name || `#${kpi.id}`}`,
          });
        }
      }
    }
    return options;
  }, [plan, ar]);

  const needsComment = [
    "request_modification",
    "attention_comment",
    "reopen",
  ].includes(action);
  const needsReturnComments = action === "return";
  const commentRequired =
    (needsComment && !comment.trim()) ||
    (needsReturnComments && itemComments.length === 0);

  const addItemComment = () => {
    if (!selectedTarget || !itemBody.trim()) return;
    const [target, idRaw] = selectedTarget.split(":");
    const id = Number(idRaw);
    if (!id || (target !== "objective" && target !== "kpi")) return;
    setItemComments((prev) => [
      ...prev.filter((row) => !(row.target === target && row.id === id)),
      { target, id, body: itemBody.trim() },
    ]);
    setItemBody("");
  };

  const isApprove = action === "approve" || action === "employee_approve" || action.endsWith("_approve");
  const modalTitle = isApprove
    ? t("Approve plan", "اعتماد الخطة")
    : resolveActionLabel(action, ar, plan);

  return (
    <Modal
      open={open}
      title={modalTitle}
      width={520}
      okText={isApprove ? t("Approve plan", "اعتماد الخطة") : resolveActionLabel(action, ar, plan)}
      cancelText={t("Cancel", "إلغاء")}
      onCancel={onCancel}
      onOk={() => {
        if (action === "return") {
          onConfirm({
            comment: comment.trim() || undefined,
            comments: itemComments,
          });
          return;
        }
        if (action === "reopen") {
          onConfirm({ reason: comment.trim() });
          return;
        }
        if (needsComment) {
          onConfirm({ comment: comment.trim() });
          return;
        }
        onConfirm({});
      }}
      confirmLoading={loading}
      okButtonProps={{
        disabled: commentRequired || (needsReturnComments && targetOptions.length === 0),
        danger: action === "return" || action === "delete",
      }}
      destroyOnHidden
    >
      {isApprove ? (
        <Space orientation="vertical" size={14} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: 18,
              border: "1px solid #cbd8ea",
              borderRadius: 12,
              background: "#f5f8fc",
            }}
          >
            <div
              style={{
                display: "grid",
                flex: "0 0 40px",
                width: 40,
                height: 40,
                placeItems: "center",
                borderRadius: 10,
                background: "#e7eef8",
                color: "#163366",
              }}
            >
              <CheckCircleFilled style={{ fontSize: 21 }} aria-hidden="true" />
            </div>
            <div style={{ minWidth: 0 }}>
              <Typography.Text strong style={{ display: "block", color: "#163366", marginBottom: 5, fontSize: 15 }}>
                {t("You’re about to approve this plan", "أنت على وشك اعتماد هذه الخطة")}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t(
                  "This confirms the plan as the approved version, records your decision in the workflow history, and moves it to the next stage.",
                  "يؤكد هذا الإجراء الخطة كنسخة معتمدة، ويسجل قرارك في سجل سير العمل، وينقلها إلى المرحلة التالية.",
                )}
              </Typography.Text>
            </div>
          </div>
          <Alert
            type="warning"
            showIcon
            title={t("Please review before confirming", "يرجى المراجعة قبل التأكيد")}
            description={t(
              "Make sure the objectives, KPI targets and weights are correct. This is an official workflow action.",
              "تأكد من صحة الأهداف ومستهدفات مؤشرات الأداء وأوزانها. هذا إجراء رسمي ضمن سير العمل.",
            )}
          />
          {plan?.status ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Typography.Text type="secondary">{t("Current plan status", "الحالة الحالية للخطة")}</Typography.Text>
              <Tag color="processing">{typeof plan.status === "object" ? (ar ? plan.status.label || plan.status.key : plan.status.label || plan.status.key) : String(plan.status)}</Tag>
            </div>
          ) : null}
        </Space>
      ) : needsReturnComments ? (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            title={t(
              "Return requires at least one objective or KPI comment.",
              "الإعادة تتطلب ملاحظةً على هدف أو مؤشر واحد على الأقل.",
            )}
          />
          {targetOptions.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              title={t(
                "Load the plan details first so objective/KPI comments can be attached.",
                "افتح تفاصيل الخطة أولاً لربط الملاحظات بالأهداف أو المؤشرات.",
              )}
            />
          ) : null}
          <Select
            style={{ width: "100%" }}
            placeholder={t("Select objective or KPI", "اختر هدفاً أو مؤشراً")}
            options={targetOptions}
            value={selectedTarget}
            onChange={setSelectedTarget}
            disabled={targetOptions.length === 0}
          />
          <Input.TextArea
            rows={3}
            value={itemBody}
            onChange={(e) => setItemBody(e.target.value)}
            placeholder={t("Comment for the selected item", "ملاحظة للعنصر المحدد")}
            disabled={targetOptions.length === 0}
          />
          <Button
            type="dashed"
            onClick={addItemComment}
            disabled={targetOptions.length === 0 || !selectedTarget || !itemBody.trim()}
          >
            {t("Add item comment", "إضافة ملاحظة على العنصر")}
          </Button>
          {itemComments.map((row) => (
            <Alert
              key={`${row.target}-${row.id}`}
              type="warning"
              showIcon
              closable
              onClose={() =>
                setItemComments((prev) =>
                  prev.filter((item) => !(item.target === row.target && item.id === row.id)),
                )
              }
              title={`${row.target} #${row.id}`}
              description={row.body}
            />
          ))}
          <Input.TextArea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("Optional plan-level comment", "ملاحظة اختيارية على مستوى الخطة")}
          />
        </Space>
      ) : needsComment ? (
        <Input.TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            action === "reopen"
              ? t("Mandatory reopen reason", "سبب إلزامي لإعادة الفتح")
              : t("Add a required comment", "أضف تعليقاً مطلوباً")
          }
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
  );
}
