"use client";

import { Alert, Typography } from "antd";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import { ApiRequestError } from "@/lib/api/client";
import { CycleEligibilityPreview } from "./cycle-eligibility-preview";

type TranslateFn = {
  (key: string, values?: Record<string, string | number>): string;
};

function activationCandidates(details: unknown): any[] {
  if (!details || typeof details !== "object") return [];
  const candidates = (details as { candidates?: unknown }).candidates;
  return Array.isArray(candidates) ? candidates : [];
}

export function showCycleActivationError(
  modal: Pick<ModalStaticFunctions, "error">,
  error: unknown,
  t: TranslateFn,
) {
  const apiError = error instanceof ApiRequestError ? error : null;
  const candidates = activationCandidates(apiError?.details);
  const message =
    apiError?.message ||
    (error instanceof Error ? error.message : t("errors.activationFailed"));

  if (!candidates.length) {
    modal.error({
      title: t("errors.activationFailed"),
      content: message,
    });
    return;
  }

  modal.error({
    title: t("errors.activationFailed"),
    width: 760,
    okText: t("actions.close"),
    content: (
      <div style={{ marginTop: 8 }}>
        <Alert type="error" showIcon message={message} style={{ marginBottom: 16 }} />
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          {t("errors.activationCandidatesHint", { count: candidates.length })}
        </Typography.Paragraph>
        <CycleEligibilityPreview rows={candidates} pageSize={8} />
      </div>
    ),
  });
}
