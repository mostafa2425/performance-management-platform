"use client";

import "../plan-detail-workspace.css";

import { Alert, Card, Collapse, Empty, Progress, Row, Col, Space, Statistic, Tag, Typography } from "antd";
import { bilingual, commentsForTarget, type OpenComments, weightPct } from "./plan-shared";

function CommentList({ comments, ar }: { comments: Array<{ body: string }>; ar: boolean }) {
  if (!comments.length) return null;
  return (
    <Space orientation="vertical" size={6} style={{ width: "100%", marginTop: 10 }}>
      {comments.map((comment, index) => (
        <Alert
          key={`comment-${index}`}
          type="warning"
          showIcon
          title={ar ? "ملاحظة على العنصر" : "Item comment"}
          description={comment.body}
          style={{ maxWidth: 760, width: "100%" }}
        />
      ))}
    </Space>
  );
}

function scoreLabel(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return score <= 100 ? score : score / 100;
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
  const t = (en: string, arabic: string) => ar ? arabic : en;

  if (!contentVisible) {
    return (
      <Alert
        type="info"
        showIcon
        title={t("Plan content is not visible yet for your role.", "محتوى الخطة غير ظاهر لصلاحيتك حالياً.")}
        style={{ maxWidth: 760, width: "100%" }}
      />
    );
  }

  const rows = objectives || [];
  if (!rows.length) return <Empty description={t("No objectives yet.", "لا توجد أهداف بعد.")} />;

  const planComments = commentsForTarget(openComments || null, "plan");
  const kpiCount = rows.reduce((sum: number, objective: any) => sum + (objective.kpis || []).length, 0);
  const totalWeight = rows.reduce((sum: number, objective: any) =>
    sum + (objective.kpis || []).reduce((part: number, kpi: any) => part + weightPct(kpi.weight_bp), 0), 0);
  const weightReady = Math.abs(totalWeight - 100) < 0.01;

  const objectiveItems = rows.map((objective: any, index: number) => {
    const kpis = objective.kpis || [];
    const objectiveWeight = kpis.reduce((sum: number, kpi: any) => sum + weightPct(kpi.weight_bp), 0);
    const categoryName = bilingual(objective.category_name, ar) || t("Uncategorized", "غير مصنف");

    return {
      key: String(objective.id ?? index),
      label: (
        <Space wrap size={8}>
          <Typography.Text strong>{objective.text || t("Untitled objective", "هدف بلا عنوان")}</Typography.Text>
          <Tag>{categoryName}</Tag>
          <Tag color="blue">{objectiveWeight.toFixed(2)}%</Tag>
          <Typography.Text type="secondary">{kpis.length} {t("KPIs", "مؤشرات")}</Typography.Text>
        </Space>
      ),
      children: (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <CommentList ar={ar} comments={commentsForTarget(openComments || null, "objective", objective.id)} />
          {kpis.length ? (
            <Row gutter={[12, 12]}>
              {kpis.map((kpi: any, kpiIndex: number) => {
                const smartScore = scoreLabel(kpi.smart_score);
                return (
                  <Col xs={24} md={12} key={kpi.id ?? kpiIndex}>
                    <Card
                      className="plan-kpi-card"
                      size="small"
                      title={kpi.name || t("Untitled KPI", "مؤشر بلا اسم")}
                      extra={<Tag color="blue">{weightPct(kpi.weight_bp).toFixed(2)}%</Tag>}
                    >
                      <Row gutter={[12, 12]}>
                        <Col xs={12}>
                          <Typography.Text type="secondary">{t("Measurement", "نوع القياس")}</Typography.Text>
                          <div>{String(kpi.measurement_type || "—").replaceAll("_", " ")}</div>
                        </Col>
                        <Col xs={12}>
                          <Typography.Text type="secondary">{t("Unit", "الوحدة")}</Typography.Text>
                          <div>{kpi.unit || "—"}</div>
                        </Col>
                        <Col xs={12}>
                          <Typography.Text type="secondary">{t("Target", "المستهدف")}</Typography.Text>
                          <div>{kpi.target ?? "—"}</div>
                        </Col>
                        <Col xs={12}>
                          <Typography.Text type="secondary">{t("Baseline", "خط الأساس")}</Typography.Text>
                          <div>{kpi.baseline ?? "—"}</div>
                        </Col>
                        <Col xs={12}>
                          <Typography.Text type="secondary">{t("Direction", "اتجاه الاحتساب")}</Typography.Text>
                          <div>{kpi.direction === "lower" ? t("Lower is better", "الأقل أفضل") : t("Higher is better", "الأعلى أفضل")}</div>
                        </Col>
                        {smartScore !== null ? (
                          <Col xs={12}>
                            <Typography.Text type="secondary">SMART</Typography.Text>
                            <div><Tag color={smartScore >= 70 ? "success" : "warning"}>{smartScore.toFixed(0)}%</Tag></div>
                          </Col>
                        ) : null}
                      </Row>
                      {smartScore !== null ? (
                        <div style={{ marginTop: 12 }}>
                          <Progress percent={Math.max(0, Math.min(100, smartScore))} size="small" />
                        </div>
                      ) : null}
                      <CommentList ar={ar} comments={commentsForTarget(openComments || null, "kpi", kpi.id)} />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("No KPIs under this objective.", "لا توجد مؤشرات أداء لهذا الهدف.")} />
          )}
        </Space>
      ),
    };
  });

  return (
    <Space className="plan-readonly-tree" orientation="vertical" size={14} style={{ width: "100%" }}>
      {planComments.length > 0 ? (
        <div style={{ maxWidth: 760, width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            title={t("Plan-level comments", "ملاحظات على مستوى الخطة")}
            description={<Space orientation="vertical" size={4}>{planComments.map((comment, index) => <span key={index}>{comment.body}</span>)}</Space>}
          />
        </div>
      ) : null}

      <Row gutter={[12, 12]}>
        <Col xs={12} md={8}>
          <Card className="plan-summary-card" size="small"><Statistic title={t("Objectives", "الأهداف")} value={rows.length} /></Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="plan-summary-card" size="small"><Statistic title={t("KPIs", "مؤشرات الأداء")} value={kpiCount} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="plan-summary-card plan-summary-card-weight" size="small">
            <Statistic
              title={t("Total KPI weight", "إجمالي أوزان المؤشرات")}
              value={totalWeight}
              precision={2}
              suffix="%"
              valueStyle={{ color: weightReady ? "#16a34a" : "#d97706" }}
            />
            <Progress percent={Math.min(totalWeight, 100)} showInfo={false} status={weightReady ? "success" : "active"} size="small" />
          </Card>
        </Col>
      </Row>

      <Typography.Text type="secondary">
        {t("Expand an objective to review its KPI cards and details.", "افتح الهدف لمراجعة بطاقات مؤشرات الأداء وتفاصيلها.")}
      </Typography.Text>
      <Collapse items={objectiveItems} />
    </Space>
  );
}
