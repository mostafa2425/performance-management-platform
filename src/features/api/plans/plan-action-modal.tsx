"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Input, Modal, Select, Space } from "antd";
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

  return (
    <Modal
      open={open}
      title={resolveActionLabel(action, ar, plan)}
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
      okText={resolveActionLabel(action, ar, plan)}
      destroyOnHidden
    >
      {needsReturnComments ? (
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
