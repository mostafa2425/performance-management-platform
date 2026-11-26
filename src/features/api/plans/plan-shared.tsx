"use client";

import { Tag } from "antd";
import { CheckCircleFilled, ClockCircleOutlined, EditOutlined, FileTextOutlined, RollbackOutlined, UserOutlined } from "@ant-design/icons";

export type PlanMode = "manager" | "employee" | "admin";

export type OpenComment = {
  id?: number | null;
  body: string;
  target: "plan" | "objective" | "kpi" | string;
};

export type OpenComments = {
  event_id?: number;
  action?: string;
  return_source?: "admin" | "employee" | "admin_reopen" | string | null;
  actor?: { id?: number; name?: string } | null;
  created_at?: string;
  comments?: OpenComment[];
} | null;

export const PLAN_STATUS_META: Record<
  string,
  { en: string; ar: string; color?: string }
> = {
  not_started: { en: "Not started", ar: "لم تبدأ", color: "default" },
  draft: { en: "Draft", ar: "مسودة", color: "blue" },
  pending_admin: { en: "Pending Admin approval", ar: "بانتظار موافقة المسؤول", color: "gold" },
  returned: { en: "Returned", ar: "مُعادة", color: "error" },
  pending_employee: { en: "Pending employee review", ar: "بانتظار مراجعة الموظف", color: "purple" },
  approved: { en: "Goals approved", ar: "الأهداف معتمدة", color: "success" },
  complete: { en: "Evaluation complete", ar: "اكتمل التقييم", color: "success" },
};

const ACTION_LABELS: Record<string, [string, string]> = {
  edit_content: ["Edit", "تعديل"],
  delete: ["Delete draft", "حذف المسودة"],
  submit: ["Submit", "إرسال"],
  resubmit: ["Resubmit updated plan", "إعادة إرسال الخطة المحدّثة"],
  approve: ["Approve plan", "اعتماد الخطة"],
  return: ["Return", "إعادة للتعديل"],
  employee_approve: ["Approve plan", "اعتماد الخطة"],
  request_modification: ["Request changes", "طلب تعديل"],
  attention_comment: ["Add attention note", "إضافة ملاحظة متابعة"],
  reopen: ["Reopen plan", "إعادة فتح الخطة"],
};

export function resolveActionLabel(
  action: string,
  ar: boolean,
  plan?: { status?: { key?: string } | null } | null,
) {
  if (
    action === "submit" &&
    plan?.status?.key === "returned"
  ) {
    return actionLabel("resubmit", ar);
  }
  return actionLabel(action, ar);
}

const HISTORY_ACTION_LABELS: Record<string, [string, string]> = {
  plan_created: ["Plan created", "تم إنشاء الخطة"],
  plan_content_saved: ["Content saved", "تم حفظ المحتوى"],
  plan_submitted: ["Submitted", "تم الإرسال"],
  plan_approved_by_admin: ["Approved by admin", "اعتمدتها الإدارة"],
  plan_returned: ["Returned", "أُعيدت"],
  plan_approved_by_employee: ["Approved by employee", "اعتمدها الموظف"],
  plan_modification_requested: ["Modification requested", "طُلب تعديل"],
  plan_attention_comment: ["Admin attention note", "ملاحظة متابعة الإدارة"],
  plan_reopened: ["Reopened", "أُعيد فتحها"],
};

export function bilingual(
  value: { ar?: string; en?: string } | string | null | undefined,
  ar: boolean,
) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return ar ? value.ar || value.en || "—" : value.en || value.ar || "—";
}

export function actionLabel(action: string, ar: boolean) {
  const pair = ACTION_LABELS[action];
  return pair ? (ar ? pair[1] : pair[0]) : action.replaceAll("_", " ");
}

export function historyActionLabel(action: string, ar: boolean) {
  const pair = HISTORY_ACTION_LABELS[action];
  return pair ? (ar ? pair[1] : pair[0]) : action.replaceAll("_", " ");
}

export function returnSourceLabel(source: string | null | undefined, ar: boolean) {
  if (source === "admin") return ar ? "أعادتها الإدارة" : "Returned by admin";
  if (source === "employee") return ar ? "طلب تعديل من الموظف" : "Returned by employee";
  if (source === "admin_reopen") return ar ? "أُعيد فتحها من الإدارة" : "Reopened by admin";
  return ar ? "مصدر الإعادة غير معروف" : "Unknown return source";
}

export function planStatusTag(value?: { key?: string; label?: string } | null, ar?: boolean) {
  if (!value?.key) return <Tag className="pmp-status-tag" style={{ marginInlineEnd: 0 }}>—</Tag>;
  const meta = PLAN_STATUS_META[value.key];
  const label = (ar ? meta?.ar : value.label || meta?.en) || value.key.replaceAll("_", " ");
  const icon = value.key === "approved" || value.key === "complete"
    ? <CheckCircleFilled />
    : value.key === "returned"
      ? <RollbackOutlined />
      : value.key.startsWith("pending_")
        ? <ClockCircleOutlined />
        : value.key === "draft"
          ? <EditOutlined />
          : value.key === "not_started"
            ? <FileTextOutlined />
            : <UserOutlined />;
  return (
    <Tag icon={icon} color={meta?.color} className={`pmp-status-tag pmp-status-tag--${value.key}`} style={{ marginInlineEnd: 0 }}>
      {label}
    </Tag>
  );
}

export function formatInstant(value?: string | null, ar?: boolean) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function weightPct(bp?: number | null) {
  return Number((((bp || 0) / 100)).toFixed(2));
}

export function commentsForTarget(
  openComments: OpenComments,
  target: "plan" | "objective" | "kpi",
  id?: number | null,
) {
  return (openComments?.comments || []).filter((comment) => {
    if (comment.target !== target) return false;
    if (target === "plan") return true;
    return Number(comment.id) === Number(id);
  });
}

export function workflowActions(actions: string[] = []) {
  return actions.filter((action) => action !== "edit_content");
}
