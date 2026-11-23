"use client";

import { Alert, Card, Empty, Space, Typography } from "antd";
import {
  bilingual,
  commentsForTarget,
  type OpenComments,
  weightPct,
} from "./plan-shared";

function CommentList({
  comments,
  ar,
}: {
  comments: Array<{ body: string }>;
  ar: boolean;
}) {
  if (!comments.length) return null;
  return (
    <Space orientation="vertical" size={4} style={{ width: "100%", marginTop: 8 }}>
      {comments.map((comment, index) => (
        <Alert
          key={`${comment.body}-${index}`}
          type="warning"
          showIcon
          title={ar ? "ملاحظة على العنصر" : "Item comment"}
          description={comment.body}
        />
      ))}
    </Space>
  );
}

export function PlanReadonlyTree({
  objectives,
  openComments,
  ar,
  contentVisible = true,
}: {
  objectives?: any[] | null;
  openComments?: OpenComments;
  ar: boolean;
  contentVisible?: boolean;
}) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);

  if (!contentVisible) {
    return (
      <Alert
        type="info"
        showIcon
        title={t(
          "Plan content is not visible yet for your role.",
          "محتوى الخطة غير ظاهر لصلاحيتك حالياً.",
        )}
      />
    );
  }

  const planComments = commentsForTarget(openComments || null, "plan");
  const rows = objectives || [];

  if (!rows.length) {
    return <Empty description={t("No objectives yet.", "لا توجد أهداف بعد.")} />;
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
      {planComments.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={t("Plan-level return comments", "ملاحظات على مستوى الخطة")}
          description={
            <Space orientation="vertical" size={4}>
              {planComments.map((comment, index) => (
                <span key={index}>{comment.body}</span>
              ))}
            </Space>
          }
        />
      )}
      {rows.map((objective: any, index: number) => (
        <Card
          size="small"
          key={objective.id || index}
          title={
            <Space wrap size={[8, 4]}>
              <Typography.Text strong>{objective.text || t("Untitled objective", "هدف بلا عنوان")}</Typography.Text>
              <Typography.Text type="secondary">
                {bilingual(objective.category_name, ar)}
              </Typography.Text>
            </Space>
          }
        >
          <CommentList
            ar={ar}
            comments={commentsForTarget(openComments || null, "objective", objective.id)}
          />
          <Space orientation="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
            {(objective.kpis || []).map((kpi: any) => (
              <Card size="small" type="inner" key={kpi.id} title={kpi.name}>
                <Typography.Paragraph style={{ marginBottom: 4 }}>
                  {t("Target", "المستهدف")}: {kpi.target ?? "—"} · {t("Weight", "الوزن")}:{" "}
                  {weightPct(kpi.weight_bp).toFixed(2)}% · {t("Direction", "الاتجاه")}:{" "}
                  {kpi.direction === "lower"
                    ? t("Lower is better", "الأقل أفضل")
                    : t("Higher is better", "الأعلى أفضل")}
                </Typography.Paragraph>
                <Typography.Text type="secondary">
                  {kpi.measurement_type?.replaceAll("_", " ") || "—"} · {kpi.unit || "—"}
                </Typography.Text>
                <CommentList
                  ar={ar}
                  comments={commentsForTarget(openComments || null, "kpi", kpi.id)}
                />
              </Card>
            ))}
          </Space>
        </Card>
      ))}
    </Space>
  );
}
